from typing import Any, Dict, List

import requests

import tool.instructions

from httpx import get
from nora_lib.tasks.state import StateManager
from openai import OpenAI
from tool.modal_engine import ModalEngine
from tool.use_search_apis import get_paper_data, search_youcom_non_restricted

RETRIEVAL_API = "http://tricycle.cs.washington.edu:5000/search"


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
        self.client = OpenAI(api_key="YOUR_API_KEY")
        self.model_name = "gpt-4o"

        self.top_n = n_rerank
        # FIXME: replace this with reranker API
        self.reranker = None
        self.min_citation = None
        self.norm_cite = False
        self.ss_retriever = True
        self.use_contexts = True

    ############################ OpenScholar Functions
    def generate_response(
        self,
        query,
        retrieved_ctxs,
        max_tokens=3000,
    ):
        ctxs = ""
        for doc_idx, doc in enumerate(retrieved_ctxs[: self.top_n]):
            if "title" in doc and len(doc["title"]) > 0:
                ctxs += "[{0}] Title: {1} Text: {2}\n".format(
                    doc_idx, doc["title"], doc["text"]
                )
            else:
                ctxs += "[{0}] {1}\n".format(doc_idx, doc["text"])

        input_query = (
            tool.instructions.generation_instance_prompts_w_references.format_map(
                {"context": ctxs, "input": query}
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

    ############################ Code for API
    def update_task_state(self, task_id: str, status: str, estimated_time: str = None):
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
                    "snippet": snippet,
                    "score": score,
                    "text": snippet,
                }
                for cid, snippet, score in zip(
                    results["pes2o IDs"],
                    results["passages"],
                    results["scores"],
                )
            ]
            return snippets_list
        # you_result = search_youcom_non_restricted(query)
        # print(you_result)
        # return you_result

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
        response = self.generate_response(query, retrieved_candidates)
        print(response)
        responses.append(
            {"text": response, "feedback": None, "citations": retrieved_candidates}
        )

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
