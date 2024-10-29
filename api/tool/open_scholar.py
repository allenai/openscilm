import re
import os
from typing import Any, Dict, List
from time import time
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

RETRIEVAL_API = "http://tricycle.cs.washington.edu:5000/search"

OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")

class OpenScholar:
    def __init__(
        self,
        task_mgr: StateManager,
        n_retrieval: int = 100,
        n_rerank: int = 20,
        n_feedback: int = 5,
    ):
        # TODO: Initialize retriever and re-ranker clients here
        self.n_retrieval = n_retrieval
        self.n_rerank = n_rerank
        self.n_feedback = n_feedback
        # FIXME: temporarily use OAI for debugging; will replace with modal engine
        # self.modal_engine = ModalEngine()
        self.task_mgr = task_mgr

        # OpenScholar Cofigurations
        # FIXME: temporarily use OAI for debugging; will replace with modal engine
        self.model = None
        self.client = OpenAI(
            api_key=OPENAI_API_KEY,
        )
        self.model_name = "gpt-4o"

        self.top_n = n_rerank
        # FIXME: replace this with reranker API
        self.reranker = None
        self.min_citation = None
        self.norm_cite = False
        self.ss_retriever = True
        self.use_contexts = True

    ############################ OpenScholar Functions
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

        result = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "user", "content": input_query},
            ],
            temperature=0.9,
            max_tokens=max_tokens,
        )
        raw_output = result.choices[0].message.content
        outputs = raw_output
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

        result = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "user", "content": input_query},
            ],
            temperature=0.9,
            max_tokens=2500,
        )
        outputs = result.choices[0].message.content

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

        result = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "user", "content": input_query},
            ],
            temperature=0.9,
            max_tokens=max_tokens,
        )
        raw_output = result.choices[0].message.content
        outputs = raw_output

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
                    passage_start_index + doc_idx + len(ctxs), doc["text"]
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

        result = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "user", "content": input_query},
            ],
            temperature=0.9,
            max_tokens=max_tokens,
        )
        raw_output = result.choices[0].message.content
        outputs = raw_output
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

        result = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "user", "content": prompt[0]},
            ],
            temperature=0.9,
            max_tokens=1000,
        )
        raw_output = result.choices[0].message.content
        outputs = raw_output

        search_queries = raw_output.split(", ")[:3]
        search_queries = [
            query.replace("Search queries: ", "")
            for query in search_queries
            if len(query) > 0
        ]
        return search_queries

    ############################ Code for API
    def update_task_state(self, task_id: str, status: str, estimated_time: str = None):
        status = f"{time()}:{status}"
        if task_id:
            task_state = self.task_mgr.read_state(task_id)
            task_state.task_status = status
            if estimated_time:
                task_state.estimated_time = estimated_time
            self.task_mgr.write_state(task_state)

    def retrieve(self, query: str, task_id: str) -> List[Dict[str, Any]]:
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
            print(status_str)
            # TODO: add paper meta data info here.
            # paper_titles = []
            # for pes2o_id in results["pes2o IDs"]:
            #     paper_data = get_paper_data(pes2o_id)
            #     if paper_data is not None:
            #         paper_titles.append(paper_data["title"])
            #     else:
            #         paper_titles.append("")
            snippets_list = [
                {
                    "corpus_id": cid,
                    "text": snippet,
                    "score": score,
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
    ) -> List[Dict[str, Any]]:
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
        done, curr_feedback = False, None
        responses = []

        self.update_task_state(task_id, "retrieving relevant snippets from 40M papers")
        retrieved_candidates = self.retrieve(query, task_id)

        # generate response
        self.update_task_state(task_id, "Generating the intial draft")
        initial_response = self.generate_response(query, retrieved_candidates)
        print(initial_response)
        responses.append(
            {
                "text": initial_response,
                "feedback": None,
                "citations": retrieved_candidates,
            }
        )

        # iteratiive feedback loop

        self.update_task_state(task_id, "Generating feedback on the initial draft.")
        feedbacks = self.get_feedback(
            query=query, ctxs=retrieved_candidates, initial_response=initial_response
        )[: self.n_feedback]

        print(feedbacks)
        previous_response = initial_response
        for feedback_idx, feedback in enumerate(feedbacks):
            self.update_task_state(
                task_id, "Incorporating feedback {}.".format(feedback_idx)
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
                    responses.append(
                        {
                            "text": edited_answer,
                            "feedback": feedback[0],
                            "citations": retrieved_candidates,
                        }
                    )
                    print(edited_answer)
                else:
                    print("skipping as edited answers got too short")
            else:
                new_papers = []
                # FIXME: Fix API endpoint
                new_papers = self.retrieve(feedback[1], task_id)
                print("additional retrieval results: {}".format(len(new_papers)))
                print("Pes2O searched papers: {}".format(len(new_papers)))
                if self.ss_retriever is True:
                    new_keywords = self.retrieve_keywords(feedback[1])
                    paper_list = {}
                    if len(new_keywords) > 0:
                        for keyword in new_keywords:
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
                    passages_start_index = len(retrieved_candidates)

                    edited_answer = self.edit_with_feedback_retrieval(
                        query=query,
                        ctxs=new_papers,
                        previous_response=previous_response,
                        feedback=feedback[0],
                        passage_start_index=passages_start_index,
                    )

                    if (len(edited_answer) / len(previous_response)) > 0.9:
                        retrieved_candidates += new_papers[: self.top_n]
                        previous_response = edited_answer
                        responses.append(
                            {
                                "text": edited_answer,
                                "feedback": feedback[0],
                                "citations": retrieved_candidates,
                            }
                        )
                    else:
                        print("skipping as edited answers got too short")

        # n_feedback = self.n_feedback if feedback_toggle else 1
        # for feedback_round in range(n_feedback):
        #     curr_response = dict()
        #     self.update_task_state(
        #         task_id, "retrieving relevant snippets from 40M papers"
        #     )
        #     # TODO: Incorporate feedback into query
        #     retrieved_candidates = self.retrieve(query, task_id)
        #     # TODO: re-ranker if using Semantic Scholar vespa api for retrieval

        #     # response, gen_feedback = self.modal_engine
        #     # curr_response["text"] = response
        #     # curr_response["feedback"] = curr_feedback
        #     # curr_feedback = gen_feedback
        #     responses.append(curr_response)
        # TODO: Format references in the response
        return responses
