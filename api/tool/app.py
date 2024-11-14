import logging
import multiprocessing
import os
import re
import uuid
from typing import Union

from fastapi import FastAPI, HTTPException
from nora_lib.tasks.models import TASK_STATUSES
from nora_lib.tasks.state import NoSuchTaskException, StateManager

from tool import glog
from tool.modal_engine import ModalEngine
from tool.models import (
    AsyncTaskState,
    AsyncToolResponse,
    Papers,
    TaskResult,
    ToolRequest,
    ToolResponse,
)
from tool.open_scholar import OpenScholar
from tool.retrieval import get_vespa_index
from tool.utils import query_s2_api

# If LOG_FORMAT is "google:json" emit log message as JSON in a format Google Cloud can parse.
fmt = os.getenv("LOG_FORMAT")
handlers = [glog.Handler()] if fmt == "google:json" else [logging.StreamHandler()]
level = os.environ.get("LOG_LEVEL", default=logging.INFO)

logging.basicConfig(level=level, handlers=handlers)

logger = logging.getLogger(__name__)

ASYNC_STATE_DIR = os.getenv("ASYNC_STATE_DIR", "/async-state")

if not os.path.exists(ASYNC_STATE_DIR):
    os.makedirs(ASYNC_STATE_DIR)

task_state_manager = StateManager(AsyncTaskState, ASYNC_STATE_DIR)
async_context = multiprocessing.get_context("fork")
open_scholar = OpenScholar(task_state_manager, llm_model="os_8b")
wildguard_engine = ModalEngine(
    model_id="wildguard", api_name="wildguard_api", gen_options=dict()
)


def _starts_with_who_is(question: str):
    # Regular expression to match "Who is" at the beginning of the question
    pattern = r"^who is\b"
    # Perform case-insensitive match
    return bool(re.match(pattern, question.lower(), re.IGNORECASE))


def _do_task(tool_request: ToolRequest, task_id: str) -> TaskResult:
    """
    TODO: BYO logic here. Don't forget to define `ToolRequest` and `TaskResult`
    in `models.py`!

    The meat of whatever it is your tool or task agent actually
    does should be kicked off in here. This will be run synchonrously
    unless `_needs_to_be_async()` above returns True, in which case
    it will be run in a background process.

    If you need to update state for an asynchronously running task, you can
    use `task_state_manager.read_state(task_id)` to retrieve, and `.write_state()`
    to write back.
    """
    open_scholar.update_task_state(task_id, "Validating the query")
    logger.info(f"{task_id}: Checking query for malicious content with wildguard...")
    wildguard_out = wildguard_engine.generate(
        (tool_request.query,), streaming=True
    ).pop()
    if wildguard_out and "request_harmful" in wildguard_out:
        if wildguard_out["request_harmful"] == "yes":
            raise Exception(
                "The input query contains harmful content. Please try again with a different query"
            )
    if _starts_with_who_is(tool_request.query):
        raise Exception(
            "We cannot answer questions about people. Please try again with a different query"
        )
    return open_scholar.answer_query(
        tool_request, task_id
    )


def _estimate_task_length(tool_request: ToolRequest) -> str:
    """

    For telling the user how long to wait before asking for a status
    update on async tasks. This can just be a static guess, but you
    have access to the request if you want to do something fancier.
    """
    return (
        "1 minute"
        if not tool_request.feedback_toggle
        else f"{1 + open_scholar.n_feedback} minutes"
    )


###########################################################################
### BELOW THIS LINE IS ALL TEMPLATE CODE THAT SHOULD NOT NEED TO CHANGE ###
###########################################################################


def create_app() -> FastAPI:
    app = FastAPI(root_path="/api")

    @app.get("/")
    def root():
        return "nothing to see here :)"

    # This tells the machinery that powers Skiff (Kubernetes) that your application
    # is ready to receive traffic. Returning a non 200 response code will prevent the
    # application from receiving live requests.
    @app.get("/health", status_code=204)
    def health():
        return "OK"

    @app.get("/retrieve")
    def retrieve(query: str, topk: int, version="v2", filter_open_access: bool = True):
        return get_vespa_index(version).retrieve_s2_index(query, topk, filter_open_access)

    @app.post("/query_open_scholar")
    def use_tool(
            tool_request: ToolRequest,
    ) -> Union[AsyncToolResponse, ToolResponse]:

        # Caller is asking for a status update of long-running request
        if tool_request.task_id:
            return _handle_async_task_check_in(tool_request.task_id)

        # New task
        task_id = str(uuid.uuid4())

        logger.info(f"{task_id}: New task")
        estimated_time = _start_async_task(task_id, tool_request)

        return AsyncToolResponse(
            task_id=task_id,
            query=tool_request.query,
            estimated_time=estimated_time,
            task_status=TASK_STATUSES["STARTED"],
            task_result=None,
        )

    @app.post("/paper_details")
    def paper_details(papers: Papers):  # pyright: ignore reportUnusedFunction
        fieldstring = "authors,title,year"
        if papers.fields:
            fieldstring = ",".join(papers.fields)
        data = query_s2_api(
            end_pt="paper/batch",
            method="post",
            params={"fields": fieldstring},
            payload={"ids": [f"CorpusId:{cid}" for cid in papers.corpus_ids]},
        )
        return data

    return app


def _start_async_task(task_id: str, tool_request: ToolRequest) -> str:
    estimated_time = _estimate_task_length(tool_request)

    task_state = AsyncTaskState(
        task_id=task_id,
        query=tool_request.query,
        estimated_time=estimated_time,
        task_status=TASK_STATUSES["STARTED"],
        task_result=None,
        extra_state={},
    )
    task_state_manager.write_state(task_state)

    def _do_task_and_write_result():
        extra_state = {}
        try:
            task_result = _do_task(tool_request, task_id)
            task_status = TASK_STATUSES["COMPLETED"]
        except Exception as e:
            task_result = None
            task_status = TASK_STATUSES["FAILED"]
            extra_state["error"] = str(e)

        state = task_state_manager.read_state(task_id)
        state.task_result = task_result
        state.task_status = task_status
        state.extra_state = extra_state
        task_state_manager.write_state(state)

    async_context.Process(
        target=_do_task_and_write_result,
        name=f"Async Task {task_id}",
        args=(),
    ).start()

    return estimated_time


def _handle_async_task_check_in(
        task_id: str,
) -> Union[ToolResponse | AsyncToolResponse]:
    """
    For tasks that will take a while to complete, we issue a task id
    that can be used to request status updates and eventually, results.

    This helper function is responsible for checking the state store
    and returning either the current state of the given task id, or its
    final result.
    """

    try:
        task_state = task_state_manager.read_state(task_id)
    except NoSuchTaskException:
        raise HTTPException(
            status_code=404, detail=f"Referenced task {task_id} does not exist."
        )

    # Retrieve data, which is just on local disk for now
    if task_state.task_status == TASK_STATUSES["FAILED"]:
        msg = f"Referenced task {task_id} failed."
        if task_state.extra_state:
            msg += f" Error: {task_state.extra_state['error']}"
            logger.exception(msg)
        raise HTTPException(status_code=500, detail=f"{msg}")

    if task_state.task_status == TASK_STATUSES["COMPLETED"]:
        if not task_state.task_result:
            msg = f"Task {task_id} marked completed but has no result."
            logger.error(msg)
            raise HTTPException(
                status_code=500,
                detail=msg,
            )

        return ToolResponse(
            task_id=task_state.task_id,
            query=task_state.query,
            task_result=task_state.task_result,
        )

    return AsyncToolResponse(
        task_id=task_state.task_id,
        query=task_state.query,
        estimated_time=task_state.estimated_time,
        task_status=task_state.task_status,
        task_result=task_state.task_result,
    )
