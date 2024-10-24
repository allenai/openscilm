from typing import Dict, Any, List
from tool.modal_engine import ModalEngine
from nora_lib.tasks.state import StateManager
import requests

RETRIEVAL_API = "'http://tricycle.cs.washington.edu:5004/search"


class OpenScholar:
    def __init__(self, task_mgr: StateManager, n_retrieval: int = 100, n_rerank: int = 20, n_feedback: int = 5):
        # TODO: Initialize retriever and re-ranker clients here
        self.n_retrieval = n_retrieval
        self.n_rerank = n_rerank
        self.n_feedback = n_feedback
        self.modal_engine = ModalEngine()
        self.task_mgr = task_mgr

    def update_task_state(self, task_id: str, status: str, estimated_time: str = None):
        if task_id:
            task_state = self.task_mgr.read_state(task_id)
            task_state.task_status = status
            if estimated_time:
                task_state.estimated_time = estimated_time
            self.task_mgr.write_state(task_state)

    def retrieve(self, query: str, task_id: str) -> List[Dict[str, Any]]:
        json_data = {
            "query": query,
            "n_docs": self.n_rerank,
            "domains": "pes2o"
        }
        headers = {"Content-Type": "application/json"}
        response = requests.post(RETRIEVAL_API, json=json_data, headers=headers)
        if response.status_code != 200:
            print(f"Error in retrieving snippets from url: {RETRIEVAL_API}")
            raise Exception(f"Failed to retrieve snippets. Status code: {response.status_code}")
        else:
            res_contents = response.json()
            results = res_contents["results"]
            status_str = f'{len(results["passages"])} snippets retrieved successfully'
            self.update_task_state(task_id, status_str)
            snippets_list = [{"corpus_id": cid, "snippet": snippet, "score": score} for cid, snippet, score in
                             zip(results["pes2o IDs"], results["passages"], results["scores"])]
            return snippets_list

    def answer_query(self, query: str, feedback_toggle: bool, task_id: str) -> List[Dict[str, Any]]:
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
        n_feedback = self.n_feedback if feedback_toggle else 1
        for feedback_round in range(n_feedback):
            curr_response = dict()
            self.update_task_state(task_id, "retrieving relevant snippets from 40M papers")
            # TODO: Incorporate feedback into query
            retrieved_candidates = self.retrieve(query, task_id)
            # TODO: re-ranker if using Semantic Scholar vespa api for retrieval

            # response, gen_feedback = self.modal_engine
            # curr_response["text"] = response
            # curr_response["feedback"] = curr_feedback
            # curr_feedback = gen_feedback
            responses.append(curr_response)
        #TODO: Format references in the response
        return []
