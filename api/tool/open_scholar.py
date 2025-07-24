import copy
import logging
import os
import re
import threading
from time import time
from typing import Any, Dict, List

from openai import OpenAI
from openai import moderations
from scholarqa import FullTextRetriever

import tool.instructions
from tool.event_tracing import EventTrace
from tool.locked_state import LockedStateManager
from tool.models import Citation, GeneratedIteration, TaskResult, ToolRequest
from tool.rag_subs import PaperFinderWithRerankerThreshold, ModalRerankerNoBatch
from tool.utils import extract_citations, remove_citations

logger = logging.getLogger(__name__)

MODERATION_MODEL = "omni-moderation-latest"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# env
MODAL_OPENAI_BASE_URL = "https://ai2-reviz--akariasai-os-8b-openai-update-serve.modal.run/v1"
MODAL_WEB_AUTH_KEY = os.getenv("MODAL_WEB_AUTH")

LLM_BASE_URL = MODAL_OPENAI_BASE_URL
LLM_KEY = MODAL_WEB_AUTH_KEY
SNIPPET_LENGTH = int(os.getenv("SNIPPET_LENGTH", 300))

filter_demo_pattern = r"\s*[^.!?]*\[20\]\."


class OpenScholar:
    def __init__(
            self,
            task_mgr: LockedStateManager,
            n_retrieval: int = 300,
            n_rerank: int = 8,
            n_feedback: int = 0,
            context_threshold: float = 0.5,
            llm_model: str = "akariasai/os_8b",  # env
            reranker_model: str = "akariasai-ranker-large-update",  # env
    ):
        # TODO: Initialize retriever and re-ranker clients here
        self.n_rerank = n_rerank
        self.n_feedback = n_feedback
        self.task_mgr = task_mgr
        # FIXME: replace this with reranker API
        model_name = "akariasai-ranker-large-update"
        retriever = FullTextRetriever(n_retrieval=n_retrieval, n_keyword_srch=10)
        logger.info(f"using model {model_name} for reranking")
        reranker = ModalRerankerNoBatch(
            reranker_model, "inference_api", gen_options=dict()
        )
        self.paper_finder = PaperFinderWithRerankerThreshold(retriever, reranker, n_rerank, context_threshold)
        self.paper_finder.snippet_srch_fields = self.paper_finder.snippet_srch_fields[:4]
        self.min_citation = None
        self.norm_cite = False
        self.ss_retriever = True
        self.use_contexts = True
        self.llm_model = llm_model
        logger.info(f"using model {self.llm_model} for inference")

    ############################ OpenScholar Functions

    def llm_inference(self, input_query: str, **opt_kwargs):
        client = OpenAI(
            api_key=LLM_KEY,
            base_url=LLM_BASE_URL,
        )
        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant for scientific literature review. Please carefully follow user's instruction and help them to understand the most recent papers.",
            },
            {
                "role": "user",
                "content": input_query,
            },
        ]
        output = client.chat.completions.create(
            model=self.llm_model, messages=messages, **opt_kwargs
        )

        output = output.choices[0].message.content
        if "[Response_Start]" in output and "[Response_End]" not in output:
            return output.split("[Response_Start]")[1]
        else:
            return output

    def process_passage(self, retrieved_ctxs: List[Dict[str, Any]]):
        ctxs = ""
        for doc_idx, doc in enumerate(retrieved_ctxs[: self.n_rerank]):
            if "title" in doc and len(doc["title"]) > 0:
                ctxs += "[{0}] Title: {1} Text: {2}\n".format(
                    doc_idx, doc["title"], doc["text"]
                )
            else:
                ctxs += "[{0}] {1}\n".format(doc_idx, doc["text"])

        return ctxs

    def generate_response(
            self,
            query: str,
            retrieved_ctxs: List[Dict[str, Any]],
            max_tokens: int = 2000,
    ):
        ctxs_text = self.process_passage(retrieved_ctxs)
        if len(ctxs_text.split()) > 4500:
            ctxs_text = ctxs_text.split()
            ctxs_text = " ".join(ctxs_text[:4000])
        logger.info(f"Context length (words): {len(ctxs_text.split())}")
        input_query = (
            tool.instructions.generation_instance_prompts_w_references.format_map(
                {"context": ctxs_text, "input": query}
            )
        )

        outputs = self.llm_inference(
            input_query, temperature=0.7, max_tokens=max_tokens
        )

        logger.info(f"Generated response: {outputs[:100]}...{len(outputs)}")
        raw_output = (
            [
                t.split("[Response_End]")[0]
                for t in outputs.split("[Response_Start]")
                if "[Response_End]" in t
            ][0]
            if "[Response_End]" in outputs
            else outputs
        )
        if "References:" in raw_output:
            raw_output = raw_output.split("References:")[0]
        return raw_output

    # Feedback: send feedback on model' predictions.
    def process_feedack(self, response):
        feedbacks_and_questions = re.findall(
            r"Feedback: (.*?)(?:Question: (.*?))?\n", response
        )
        ratings = [
            (feedback.strip(), question.strip() if question else "")
            for feedback, question in feedbacks_and_questions
        ]
        return ratings

    def check_paper_duplication(self, retrieved_papers: List[Dict[str, Any]]):
        papers_dicts = {
            " ".join(paper["text"].split(" ")[:20]): paper
            for paper in retrieved_papers
            if paper["text"] is not None and len(paper["text"].split(" ")) > 20
        }
        dedup_papers = list(papers_dicts.values())

        return dedup_papers

    def get_feedback(
            self,
            query: str,
            ctxs: List[Dict[str, Any]],
            initial_response: str,
    ):
        ctxs_text = self.process_passage(ctxs)
        input_query = tool.instructions.feedback_example_instance_prompt.format_map(
            {
                "question": query,
                "passages": ctxs_text,
                "answer": initial_response,
            }
        )

        outputs = self.llm_inference(input_query, temperature=0.7, max_tokens=1000)

        raw_output = (
            [
                t.split("[Response_End]")[0]
                for t in outputs.split("[Response_Start]")
                if "[Response_End]" in t
            ][0]
            if "[Response_End]" in outputs
            else outputs
        )
        feedbacks = self.process_feedack(raw_output)
        return feedbacks

    def edit_with_feedback(
            self,
            query: str,
            ctxs: List[Dict[str, Any]],
            previous_response: str,
            feedback: str,
            max_tokens: int = 2000,
    ):
        input_query = tool.instructions.editing_instance_prompt.format_map(
            {
                "question": query,
                "passages": self.process_passage(ctxs),
                "answer": previous_response,
                "feedback": feedback,
            }
        )

        outputs = self.llm_inference(
            input_query, temperature=0.7, max_tokens=max_tokens
        )

        raw_output = (
            [
                t.split("[Response_End]")[0]
                for t in outputs.split("[Response_Start]")
                if "[Response_End]" in t
            ][0]
            if "[Response_End]" in outputs
            else outputs
        )

        if "References:" in raw_output:
            raw_output = raw_output.split("References:")[0]
        return raw_output

    def edit_with_feedback_retrieval(
            self,
            query: str,
            ctxs: List[Dict[str, Any]],
            previous_response: str,
            feedback: str,
            passage_start_index,
            max_tokens=2000,
    ):
        processed_passages = ""
        for doc_idx, doc in enumerate(ctxs[: self.n_rerank]):
            if "title" in doc and len(doc["title"]) > 0:
                processed_passages += "[{0}] Title: {1} Text: {2}\n".format(
                    passage_start_index + doc_idx, doc["title"], doc["text"]
                )
            else:
                processed_passages += "[{0}] {1}\n".format(
                    passage_start_index + doc_idx, doc["text"]
                )

        input_query = (
            tool.instructions.editing_with_retrieval_instance_prompt.format_map(
                {
                    "question": query,
                    "retrieved_passages": processed_passages,
                    "answer": previous_response,
                    "feedback": feedback,
                }
            )
        )

        outputs = self.llm_inference(
            input_query, temperature=0.7, max_tokens=max_tokens
        )
        raw_output = (
            [
                t.split("[Response_End]")[0]
                for t in outputs.split("[Response_Start]")
                if "[Response_End]" in t
            ][0]
            if "[Response_End]" in outputs
            else outputs
        )

        if "References:" in raw_output:
            raw_output = raw_output.split("References:")[0]
        return raw_output

    def retrieve_keywords(self, input_query: str):
        prompt = [
            tool.instructions.keyword_extraction_prompt.format_map(
                {"question": input_query}
            )
        ]

        outputs = self.llm_inference(prompt[0], temperature=0.7, max_tokens=1500)

        search_queries = outputs.split(", ")[:3]
        search_queries = [
            query.replace("Search queries: ", "")
            for query in search_queries
            if len(query) > 0
        ]
        return search_queries

    ############################ Code for API
    def update_task_state(
            self,
            task_id: str,
            status: str,
            estimated_time: str = None,
            curr_response: List[GeneratedIteration] = None,
    ):
        logger.info(f"{task_id}: {status}")
        if task_id:
            status = f"{time()}:{status}"
            task_state = self.task_mgr.read_state(task_id)
            task_state.task_status = status
            if estimated_time:
                task_state.estimated_time = estimated_time
            if curr_response:
                task_state.task_result = TaskResult(iterations=curr_response)
            self.task_mgr.write_state(task_state)

    def retrieve(
            self, query: str, task_id: str, prefix: str = ""
    ) -> List[Dict[str, Any]]:
        snippets_list = self.paper_finder.retrieve_passages(query)

        status_str = (
            f"{prefix}Retrieved {len(snippets_list)} relevant passages successfully"
        )
        self.update_task_state(task_id, status_str)

        for snippet in snippets_list:
            snippet["text"] = remove_citations(snippet["text"])

        snippets_list = [
            snippet for snippet in snippets_list if len(snippet["text"].split(" ")) > 20
        ]

        print("retrieved context: {}".format(len(snippets_list)))
        return snippets_list

    def rerank(
            self, query: str, retrieved_ctxs: List[Dict[str, Any]], filtering: bool = True
    ) -> List[Dict[str, Any]]:
        sorted_ctxs = self.paper_finder.rerank(query, retrieved_ctxs)
        if filtering is True and len(sorted_ctxs) < 1:
            logger.warning("No relevant information found for the query.")
            raise Exception(
                "We were unable to retrieve any relevant papers for your query. Please try a different query. "
                "OpenScholar is not designed to answer non-scientific questions or questions that require sources outside the scientific literature.")
        return sorted_ctxs

    def retrieve_additional_passages_ss(self, query: str):
        new_papers = []
        new_keywords = self.retrieve_keywords(query)
        paper_list = {}
        if len(new_keywords) > 0:
            for keyword in new_keywords[:2]:
                top_papers = self.paper_finder.retrieve_additional_papers(keyword, minCitationCount=10,
                                                                          sort="citationCount:desc", )
                if top_papers is None:
                    print(keyword)
                else:
                    for paper in top_papers:
                        if paper["corpus_id"] not in paper_list:
                            paper["citation_counts"] = paper["citationCount"]
                            paper_list[paper["corpus_id"]] = paper
            new_papers += list(paper_list.values())
        return new_papers

    def moderation_api(self, text: str) -> bool:
        response = moderations.create(input=text, model=MODERATION_MODEL)
        return response.results[0].flagged

    def validate(self, query: str, task_id: str) -> None:
        def _starts_with_who_is(question: str):
            # Regular expression to match "Who is" at the beginning of the question
            pattern = r"^who is\b"
            # Perform case-insensitive match
            return bool(re.match(pattern, question.lower(), re.IGNORECASE))

        if OPENAI_API_KEY:
            # self.update_task_state(task_id, "Validating the query")
            logger.info(
                f"{task_id}: Checking query for malicious content with wildguard..."
            )
            if self.moderation_api(query):
                raise Exception(
                    "The input query contains harmful content. Please try again with a different query"
                )
        if _starts_with_who_is(query):
            raise Exception(
                "We cannot answer questions about people. Please try again with a different query"
            )
        logger.info(f"{task_id}: {query} is valid")

    def answer_query(self, req: ToolRequest, task_id: str) -> TaskResult:
        """
        This function takes a query and returns a response.
        Goes through the following steps:
        1) Query retrieval api to get the relevant snippets from the index (100)
        2) Re-rank the snippets based on the query with a cross encoder (20)
        3) Generate a response from the top snippets
        4) Get feedback and call retrieval again based on the feedback

        :param query: A scientific query posed to nora by a user
        :return: A response to the query
        """

        def truncate_snippet(snippet: str) -> str:
            snippet_splits = snippet.split()
            total_len = 0
            for idx, split in enumerate(snippet_splits):
                if len(split) + total_len > SNIPPET_LENGTH:
                    return " ".join(snippet_splits[:idx]) + "..."

                total_len += len(split) + 1
            return snippet

        def get_response(iteration: Dict[str, Any]):
            return GeneratedIteration(
                text=iteration["text"],
                feedback=iteration["feedback"],
                citations=[
                    Citation(
                        id=f"[{idx}]",
                        corpus_id=cite["corpus_id"],
                        snippet=cite["text"] if "section_title" not in cite or cite[
                            "section_title"] != "abstract" else "",
                        score=cite["score"] if "score" in cite else 0.0,
                    )
                    for idx, cite in enumerate(iteration["citations"])
                    if cite["used"]
                ],
            )

        self.update_task_state(task_id, "Processing user query")
        query, feedback_toggle = req.query, req.feedback_toggle
        logger.info(
            f"For {task_id}, received query: {query} from user_id: {req.user_id} with feedback toggle: {feedback_toggle}, and opt_in: {req.opt_in}"
        )
        event_trace = EventTrace(
            task_id,
            self.llm_model,
            self.paper_finder.retriever.n_retrieval,
            self.n_rerank,
            self.n_feedback,
            req,
        )

        self.validate(query, task_id)

        responses = []
        citation_lists = []
        logger.info(f"{task_id}: Waking the modal deployment for a warm start")
        t = threading.Thread(target=self.llm_inference, args=("Just waking you up",))
        t.start()

        retrieved_candidates = self.retrieve(query, task_id)

        self.update_task_state(
            task_id, "Augmenting retrieved results with Semantic Scholar"
        )
        retrieved_candidates += self.retrieve_additional_passages_ss(query)

        retrieved_candidates = self.check_paper_duplication(retrieved_candidates)
        logger.info(
            f"{task_id}: {len(retrieved_candidates)} remain after de-duplication"
        )

        self.update_task_state(task_id, f"Total {len(retrieved_candidates)} passages retrieved")

        event_trace.trace_retrieval_event(retrieved_candidates, 0)

        if not retrieved_candidates:
            logger.warning(
                f"{task_id}: There is no relevant information in the retrieved snippets for query: {query}"
            )
            raise Exception(
                "There is no relevant information in the retrieved snippets. Please try a different query."
            )
        self.update_task_state(
            task_id, f"Re-ranking to obtain top {self.n_rerank} passages"
        )
        retrieved_candidates = self.rerank(query, retrieved_candidates)
        event_trace.trace_rerank_event(retrieved_candidates, 0)
        citation_lists.append(retrieved_candidates)

        self.update_task_state(task_id, "Waiting for model cold start...")
        t.join()
        # generate response
        self.update_task_state(task_id, "Generating the initial draft")
        initial_response = self.generate_response(query, retrieved_candidates)
        if len(initial_response) < 10:
            logger.warning(
                f"Initial response is too short: {initial_response}, retrying"
            )
            initial_response = self.generate_response(query, retrieved_candidates)
        # filter out unused citations
        used_ctxs_ids = list(set(extract_citations(initial_response)))
        for cand_idx, cand in enumerate(retrieved_candidates):
            if cand_idx in used_ctxs_ids:
                cand["used"] = True
            else:
                cand["used"] = False

        responses.append(
            get_response(
                {
                    "text": initial_response,
                    "feedback": None,
                    "citations": retrieved_candidates,
                }
            )
        )
        logger.info(
            f"{task_id}: Initial response: {initial_response[:100]}..., Citations: {len(responses[-1].citations)}"
        )
        event_trace.trace_summary_event(responses[0].model_dump(), 0)

        self.update_task_state(
            task_id, "Initial draft generated successfully", curr_response=responses
        )

        # iteratiive feedback loop
        if feedback_toggle and self.n_feedback > 0:
            self.update_task_state(
                task_id,
                "Generating feedback(s) on the initial draft.",
                estimated_time=f"{self.n_feedback} minutes",
            )
            feedbacks = self.get_feedback(
                query=query,
                ctxs=retrieved_candidates,
                initial_response=initial_response,
            )[: self.n_feedback]
            previous_response = initial_response
            for feedback_idx, feedback in enumerate(feedbacks):
                self.update_task_state(
                    task_id,
                    "Incorporating feedback {}.".format((feedback_idx + 1)),
                    f"{(self.n_feedback - feedback_idx)} minutes",
                )
                if len(feedback[1]) == 0:
                    edited_answer = self.edit_with_feedback(
                        query, retrieved_candidates, previous_response, feedback[0]
                    )
                    edited_answer = re.sub(filter_demo_pattern, "", edited_answer)
                    if "Here is the revised answer:\n\n" in edited_answer:
                        edited_answer = edited_answer.split(
                            "Here is the revised answer:\n\n"
                        )[1]
                    if (
                            len(edited_answer) > 0
                            and len(edited_answer) / len(previous_response) > 0.9
                            # and len(edited_answer.splitlines()) / len(previous_response.splitlines()) > 0.5
                    ):
                        initial_citations = copy.deepcopy(citation_lists[0])
                        citation_lists.append(initial_citations)
                        used_ctxs_ids = extract_citations(edited_answer)

                        previous_response = edited_answer

                        for cand_idx, cand in enumerate(initial_citations):
                            if cand_idx in used_ctxs_ids:
                                cand["used"] = True
                            else:
                                cand["used"] = False

                        logger.info(
                            f"after feedback, the number of citations are: {len(citation_lists[-1])}"
                        )
                        logger.info("new responses added")
                        responses.append(
                            get_response(
                                {
                                    "text": edited_answer,
                                    "feedback": feedback[0],
                                    "citations": citation_lists[-1],
                                }
                            )
                        )
                        event_trace.trace_summary_event(
                            responses[-1].model_dump(), feedback_idx + 1
                        )

                    else:
                        print("Skipping as edited answers got too short")
                else:
                    new_papers = []
                    # FIXME: Fix API endpoint
                    new_papers = self.retrieve(
                        feedback[1],
                        task_id,
                        f"Feedback {(feedback_idx + 1)}- ",
                    )
                    if self.ss_retriever is True:
                        new_keywords = self.retrieve_keywords(feedback[1])
                        if len(new_keywords) > 0:
                            ss_retrieved_papers = self.retrieve_additional_passages_ss(
                                feedback[1]
                            )
                            new_papers += ss_retrieved_papers
                    if len(new_papers) > 0:
                        # TODO: add dedup check
                        new_papers = self.check_paper_duplication(new_papers)
                        self.update_task_state(
                            task_id,
                            f"Feedback {(feedback_idx + 1)}- Re-ranking top passages",
                        )
                        new_papers = self.rerank(
                            feedback[1] + " " + query, new_papers, filtering=False
                        )

                        event_trace.trace_retrieval_event(new_papers, feedback_idx + 1)
                        prev_citations = copy.deepcopy(citation_lists[-1])
                        passages_start_index = len(prev_citations)

                        self.update_task_state(
                            task_id,
                            f"Feedback {(feedback_idx + 1)}- Updating the draft",
                        )
                        edited_answer = self.edit_with_feedback_retrieval(
                            query=query,
                            ctxs=new_papers,
                            previous_response=previous_response,
                            feedback=feedback[0],
                            passage_start_index=passages_start_index,
                        )
                        edited_answer = re.sub(filter_demo_pattern, "", edited_answer)

                        if (len(edited_answer) / len(previous_response)) > 0.9:
                            # and len(edited_answer.splitlines()) / len(previous_response.splitlines()) > 0.5:
                            prev_citations += new_papers[: self.n_rerank]
                            # merge citations
                            logger.info("merging citations")
                            text_to_citations = {}
                            for cand_idx, cand in enumerate(prev_citations):
                                if (
                                        " ".join(cand["text"].split()[:20])
                                        in text_to_citations
                                ):
                                    edited_answer.replace(
                                        "[{}]".format(cand_idx),
                                        "[{}]".format(
                                            text_to_citations[
                                                " ".join(cand["text"].split()[:20])
                                            ]
                                        ),
                                    )
                                else:
                                    text_to_citations[
                                        " ".join(cand["text"].split()[:20])
                                    ] = cand_idx

                            used_ctxs_ids = extract_citations(edited_answer)

                            previous_response = edited_answer

                            for cand_idx, cand in enumerate(prev_citations):
                                if cand_idx in used_ctxs_ids:
                                    cand["used"] = True
                                else:
                                    cand["used"] = False

                            responses.append(
                                get_response(
                                    {
                                        "text": edited_answer,
                                        "feedback": feedback[0],
                                        "citations": prev_citations,
                                    }
                                )
                            )
                            citation_lists.append(prev_citations)
                            event_trace.trace_summary_event(
                                responses[-1].model_dump(), feedback_idx + 1
                            )
                        else:
                            print("skipping as edited answers got too short")
                self.update_task_state(
                    task_id,
                    f"Feedback {(feedback_idx + 1)}- Incorporated successfully",
                    curr_response=responses,
                )
        event_trace.push_trace_to_gcs()
        return TaskResult(iterations=responses)
