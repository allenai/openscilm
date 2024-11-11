from typing import List, Dict, Any
from datetime import datetime
from tool.models import ToolRequest
from tool.utils import push_to_gcs
import json

TRACE_GCS_BUCKET = "open-scholar-demo"


class EventTrace:
    def __init__(self, task_id: str, llm_model: str, n_retrieval: int, n_rerank: int, n_feedback: int,
                 req: ToolRequest):
        self.query = req.query
        self.task_id = task_id
        self.llm_model = llm_model
        self.timestamp = datetime.now().isoformat()
        self.n_retrieval = n_retrieval
        self.n_rerank = n_rerank
        self.feedback_toggle = req.feedback_toggle
        self.opt_in = req.opt_in
        self.n_feedback = n_feedback
        self.iterations = [{"retrieval": [], "rerank": [], "summary": dict()} for _ in
                           range((n_feedback+1) if req.feedback_toggle else 1)]
        self.total_cost = 0.0

    def trace_retrieval_event(self, candidates: List[Dict[str, Any]], idx: int):
        self.iterations[idx]["retrieval"] = candidates

    def trace_rerank_event(self, candidates: List[Dict[str, Any]], idx: int):
        self.iterations[idx]["rerank"] = candidates

    def trace_summary_event(self, summary: Dict[str, Any], idx: int, cost: float = 0.0):
        self.iterations[idx]["summary"] = summary
        self.iterations[idx]["summary"]["cost"] = cost

    def push_trace_to_gcs(self):
        json_str = json.dumps(self.__dict__)
        file_path = f"{self.task_id}.json"
        push_to_gcs(json_str, TRACE_GCS_BUCKET, file_path)
