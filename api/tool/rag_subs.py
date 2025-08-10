from typing import Dict, Any, List

from scholarqa import ModalReranker, PaperFinderWithReranker
from logging import getLogger

logger = getLogger(__name__)


class ModalRerankerNoBatch(ModalReranker):
    def __init__(self, app_name: str, api_name: str, gen_options: Dict[str, Any] = None):
        super().__init__(app_name, api_name, batch_size=-1, gen_options=gen_options)

    def get_scores(self, query: str, documents: List[str]):
        logger.info("Invoking the reranker deployed on Modal")
        return self.modal_engine.generate(
            (query, documents), streaming=False
        )


class PaperFinderWithRerankerThreshold(PaperFinderWithReranker):
    def rerank(self, query: str, retrieved_ctxs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sorted_snippets = super().rerank(query, retrieved_ctxs)
        return [ss for ss in sorted_snippets if ss["rerank_score"] >= self.context_threshold]
