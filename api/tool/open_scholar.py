from typing import Dict, Any, List
from modal_engine import ModalEngine


class OpenScholar:
    def __init__(self, n_retrieval: int = 100, n_rerank: int = 20, n_feedback: int = 5):
        # TODO: Initialize retriever and re-ranker clients here
        self.n_retrieval = n_retrieval
        self.n_rerank = n_rerank
        self.n_feedback = n_feedback
        self.modal_engine = ModalEngine()
        pass

    def answer_query(self, query: str) -> List[Dict[str, Any]]:
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

        #candidates = self.retriever.retrieve(query, self.n_retrieval)
        #reranked_candidates = self.reranker.rerank(query, candidates, self.n_rerank)
        #response, feedback = self.modal_engine
        return []
