import copy
import os
import re
import threading
from time import time
from typing import Any, Dict, List

import requests
import tool.instructions

from httpx import get
from nora_lib.tasks.state import StateManager
from openai import OpenAI
from tool.modal_engine import ModalEngine
from tool.use_search_apis import (
    get_paper_data,
    search_paper_via_query,
    search_youcom_non_restricted,
)
from tool.models import TaskResult, GeneratedIteration, Citation

from tool.utils import remove_citations

RETRIEVAL_API = "http://tricycle.cs.washington.edu:5001/search"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
RUNPOD_ID = os.getenv("RUNPOD_ID")
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
SNIPPET_LENGTH = int(os.getenv("SNIPPET_LENGTH", 300))


class OpenScholar:
    def __init__(
            self,
            task_mgr: StateManager,
            n_retrieval: int = 100,
            n_rerank: int = 10,
            n_feedback: int = 1,
    ):
        # TODO: Initialize retriever and re-ranker clients here
        self.n_retrieval = n_retrieval
        self.n_rerank = n_rerank
        self.n_feedback = n_feedback
        # FIXME: temporarily use OAI for debugging; will replace with modal engine
        self.modal_engine = ModalEngine()
        self.task_mgr = task_mgr

        # OpenScholar Cofigurations
        # FIXME: temporarily use OAI for debugging; will replace with modal engine
        self.model = None
        # self.client = OpenAI(
        #     api_key=OPENAI_API_KEY,
        # )
        self.model_name = "gpt-4o"

        self.top_n = n_rerank
        # FIXME: replace this with reranker API
        self.reranker = None
        self.min_citation = None
        self.norm_cite = False
        self.ss_retriever = False
        self.use_contexts = True

    ############################ OpenScholar Functions

    # Model API codes
    # def llm_inference(self, input_query: str, **opt_kwargs):
    #     outputs = []
    #     for chunk in self.modal_engine.generate(input_query, **opt_kwargs):
    #         outputs.append(chunk)
    #     return "".join(outputs)

    def llm_inference(self, input_query: str, **opt_kwargs):
        client = OpenAI(
            api_key=RUNPOD_API_KEY,
            base_url=f"https://api.runpod.ai/v2/{RUNPOD_ID}/openai/v1",
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
            model="akariasai/os_8b",
            messages=messages,
            temperature=0.7,
            max_tokens=4096,
        )

        output = output.choices[0].message.content
        if "[Response_Start]" in output and "[Response_End]" not in output:
            return output.split("[Response_Start]")[1]
        else:
            return output

    def process_passage(self, retrieved_ctxs: List[Dict[str, Any]]):
        ctxs = ""
        for doc_idx, doc in enumerate(retrieved_ctxs[: self.top_n]):
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
            max_tokens: int = 3000,
    ):
        ctxs_text = self.process_passage(retrieved_ctxs)

        input_query = (
            tool.instructions.generation_instance_prompts_w_references.format_map(
                {"context": ctxs_text, "input": query}
            )
        )

        outputs = self.llm_inference(
            input_query, temperature=0.7, max_tokens=max_tokens
        )
        # else:
        #     sampling_params = vllm.SamplingParams(
        #         temperature=0.9,  # greedy decoding
        #         max_tokens=max_tokens,
        #         stop_token_ids=[128009],
        #     )
        #     outputs = self.model.generate([input_query], sampling_params)
        #     outputs = [it.outputs[0].text for it in outputs][0]
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
            paper["text"][:100] + paper["title"]: paper
            for paper in retrieved_papers
            if paper is not None
               and type(paper["text"]) is str
               and "title" in paper["title"]
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

        outputs = self.llm_inference(input_query, temperature=0.7, max_tokens=2500)

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
            max_tokens: int = 3000,
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
        return raw_output

    def edit_with_feedback_retrieval(
            self,
            query: str,
            ctxs: List[Dict[str, Any]],
            previous_response: str,
            feedback: str,
            passage_start_index,
            max_tokens=3000,
    ):
        processed_passages = ""
        for doc_idx, doc in enumerate(ctxs[: self.top_n]):
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
        return raw_output

    def retrieve_keywords(self, input_query: str):
        prompt = [
            tool.instructions.keyword_extraction_prompt.format_map(
                {"question": input_query}
            )
        ]

        outputs = self.llm_inference(prompt[0], temperature=0.7, max_tokens=1000)

        search_queries = outputs.split(", ")[:3]
        search_queries = [
            query.replace("Search queries: ", "")
            for query in search_queries
            if len(query) > 0
        ]
        return search_queries

    ############################ Code for API
    def update_task_state(self, task_id: str, status: str, estimated_time: str = None,
                          curr_response: List[GeneratedIteration] = None):
        status = f"{time()}:{status}"
        if task_id:
            task_state = self.task_mgr.read_state(task_id)
            task_state.task_status = status
            if estimated_time:
                task_state.estimated_time = estimated_time
            if curr_response:
                task_state.task_result = TaskResult(iterations=curr_response)
            self.task_mgr.write_state(task_state)

    def retrieve(self, query: str, task_id: str) -> List[Dict[str, Any]]:
        print("retrieval started")
        json_data = {"query": query, "n_docs": self.n_rerank, "domains": "pes2o"}
        headers = {"Content-Type": "application/json"}
        response = requests.post(RETRIEVAL_API, json=json_data, headers=headers)
        if response.status_code != 200:
            print(f"Error in retrieving snippets from url: {RETRIEVAL_API}")
            raise Exception(
                f"Failed to retrieve snippets. Status code: {response.status_code}"
            )
        else:
            res_contents = response.json()
            results = res_contents["results"]
            status_str = f'{len(results["passages"])} snippets retrieved successfully'
            self.update_task_state(task_id, status_str)
            print(f"retrieval done - {status_str}")
            paper_titles = {}
            for pes2o_id in results["pes2o IDs"]:
                paper_data = get_paper_data(pes2o_id)
                if paper_data is not None:
                    paper_titles[pes2o_id] = paper_data["title"]
            snippets_list = [
                {
                    "corpus_id": cid,
                    "text": remove_citations(snippet),
                    "score": score,
                    "title": paper_titles[cid] if cid in paper_titles else "",
                }
                for cid, snippet, score in zip(
                    results["pes2o IDs"],
                    results["passages"],
                    results["scores"],
                )
            ]
            return snippets_list

    def answer_query(
            self, query: str, feedback_toggle: bool, task_id: str
    ) -> TaskResult:
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
            return snippet[:SNIPPET_LENGTH] + "..." if len(snippet) > SNIPPET_LENGTH else snippet

        def get_response(iteration: Dict[str, Any]):
            return GeneratedIteration(
                text=iteration["text"],
                feedback=iteration["feedback"],
                citations=[Citation(id=f"[{idx}]", corpus_id=cite["corpus_id"], snippet=truncate_snippet(cite["text"]),
                                    score=cite["score"])
                           for
                           idx, cite in enumerate(iteration["citations"])],
            )

        responses = []
        citation_lists = []
        t = threading.Thread(target=self.llm_inference, args=("Just waking you up",))
        t.start()
        self.update_task_state(task_id, "retrieving relevant snippets from 40M papers")
        retrieved_candidates = self.retrieve(query, task_id)
        citation_lists.append(retrieved_candidates)

        self.update_task_state(task_id, "Waiting for model cold start...")
        t.join()
        # generate response
        self.update_task_state(task_id, "Generating the intial draft")
        initial_response = self.generate_response(query, retrieved_candidates)
        print("initial response", initial_response)
        responses.append(get_response(
            {
                "text": initial_response,
                "feedback": None,
                "citations": retrieved_candidates,
            }
        ))
        self.update_task_state(task_id, "Initial draft generated successfully", curr_response=responses)

        # iteratiive feedback loop
        if feedback_toggle:
            self.update_task_state(task_id, "Generating feedback on the initial draft.")
            feedbacks = self.get_feedback(
                query=query,
                ctxs=retrieved_candidates,
                initial_response=initial_response,
            )[: self.n_feedback]

            previous_response = initial_response
            for feedback_idx, feedback in enumerate(feedbacks):
                self.update_task_state(
                    task_id,
                    "Incorporating feedback {}.".format(feedback_idx),
                    f"{(self.n_feedback - feedback_idx + 1)} minutes",
                )
                if len(feedback[1]) == 0:
                    edited_answer = self.edit_with_feedback(
                        query, retrieved_candidates, previous_response, feedback[0]
                    )
                    if "Here is the revised answer:\n\n" in edited_answer:
                        edited_answer = edited_answer.split(
                            "Here is the revised answer:\n\n"
                        )[1]
                    if (
                            len(edited_answer) > 0
                            and len(edited_answer) / len(previous_response) > 0.9
                    ):
                        previous_response = edited_answer
                        citation_lists.append(copy.deepcopy(retrieved_candidates))
                        responses.append(
                            get_response(
                                {
                                    "text": edited_answer,
                                    "feedback": feedback[0],
                                    "citations": citation_lists[-1],
                                }
                            ))
                    else:
                        print("Skipping as edited answers got too short")
                else:
                    new_papers = []
                    # FIXME: Fix API endpoint
                    new_papers = self.retrieve(feedback[1], task_id)
                    if self.ss_retriever is True:
                        new_keywords = self.retrieve_keywords(feedback[1])
                        paper_list = {}
                        if len(new_keywords) > 0:
                            for keyword in new_keywords[:2]:
                                top_papers = search_paper_via_query(keyword)
                                if top_papers is None:
                                    print(keyword)
                                else:
                                    for paper in top_papers:
                                        if paper["paperId"] not in paper_list:
                                            paper["text"] = paper["abstract"]
                                            paper["citation_counts"] = paper[
                                                "citationCount"
                                            ]
                                            paper_list[paper["paperId"]] = paper
                            new_papers += list(paper_list.values())
                    if len(new_papers) > 0:
                        # TODO: add dedup check
                        # new_papers = self.check_paper_duplication(new_papers)
                        prev_citations = copy.deepcopy(citation_lists[-1])
                        passages_start_index = len(prev_citations)

                        edited_answer = self.edit_with_feedback_retrieval(
                            query=query,
                            ctxs=new_papers,
                            previous_response=previous_response,
                            feedback=feedback[0],
                            passage_start_index=passages_start_index,
                        )

                        if (len(edited_answer) / len(previous_response)) > 0.9:
                            prev_citations += new_papers[: self.top_n]
                            previous_response = edited_answer
                            responses.append(
                                get_response(
                                    {
                                        "text": edited_answer,
                                        "feedback": feedback[0],
                                        "citations": prev_citations,
                                    }
                                ))
                            citation_lists.append(prev_citations)
                        else:
                            print("skipping as edited answers got too short")
                self.update_task_state(task_id, f"Feedback {feedback_idx} incorporated successfully",
                                       curr_response=responses)
        return TaskResult(iterations=responses)
