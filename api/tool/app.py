import logging
import multiprocessing
import os
import uuid
from json import JSONDecodeError
from time import time
from typing import Union

from fastapi import FastAPI, HTTPException
from nora_lib.tasks.models import TASK_STATUSES
from nora_lib.tasks.state import NoSuchTaskException

from tool import glog
from tool.locked_state import LockedStateManager
from tool.models import (
    AsyncTaskState,
    AsyncToolResponse,
    Papers,
    TaskResult,
    ToolRequest,
    ToolResponse
)
from tool.open_scholar import OpenScholar
from tool.utils import query_s2_api

# If LOG_FORMAT is "google:json" emit log message as JSON in a format Google Cloud can parse.
fmt = os.getenv("LOG_FORMAT")
handlers = [glog.Handler()] if fmt == "google:json" else [logging.StreamHandler()]
level = os.environ.get("LOG_LEVEL", default=logging.INFO)

logging.basicConfig(level=level, handlers=handlers)

logger = logging.getLogger(__name__)

ASYNC_STATE_DIR = os.getenv("ASYNC_STATE_DIR", "/async-state")

TIMEOUT = 240

if not os.path.exists(ASYNC_STATE_DIR):
    os.makedirs(ASYNC_STATE_DIR)

task_state_manager = LockedStateManager(AsyncTaskState, ASYNC_STATE_DIR)
async_context = multiprocessing.get_context("fork")
open_scholar = OpenScholar(task_state_manager, llm_model="os_8b")


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
        if not (tool_request.feedback_toggle and open_scholar.n_feedback)
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
        extra_state={"start": time()},
    )
    task_state_manager.write_state(task_state)

    def _do_task_and_write_result():
        extra_state = {}
        try:
            task_result = _do_task(tool_request, task_id)
            task_status = TASK_STATUSES["COMPLETED"]
            extra_state["end"] = time()
        except Exception as e:
            task_result = None
            task_status = TASK_STATUSES["FAILED"]
            extra_state["error"] = str(e)

        state = task_state_manager.read_state(task_id)
        state.task_result = task_result
        state.task_status = task_status
        state.extra_state.update(extra_state)
        state.estimated_time = "--"
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
    except JSONDecodeError as e:
        logger.warning(f"{task_id} state file is corrupted, should be updated on next poll: {e}")
        return AsyncToolResponse(
            task_id=task_id,
            query="",
            estimated_time="1 minute",
            task_status=f"{time()}: Processing user query",
            task_result=None,
        )

    # Retrieve data, which is just on local disk for now
    if task_state.task_status == TASK_STATUSES["FAILED"]:
        msg = f"Referenced task failed."
        if task_state.extra_state and "error" in task_state.extra_state:
            msg += f" Error: {task_state.extra_state['error']}"
            logger.exception(f"{task_id}: {msg}")
        raise HTTPException(status_code=500, detail=f"{msg}")

    if task_state.task_status == TASK_STATUSES["COMPLETED"]:
        if not task_state.task_result:
            msg = f"Task marked completed but has no result."
            logger.error(f"{task_id}: {msg}")
            raise HTTPException(
                status_code=500,
                detail=msg,
            )
        if "start" in task_state.extra_state and "end" in task_state.extra_state:
            logger.info(
                f"{task_id}: completed in {task_state.extra_state['end'] - task_state.extra_state['start']} seconds.")
        return ToolResponse(
            task_id=task_state.task_id,
            query=task_state.query,
            task_result=task_state.task_result,
        )

    if task_state.task_status not in {TASK_STATUSES["COMPLETED"],
                                      TASK_STATUSES["FAILED"]} and "start" in task_state.extra_state:
        elapsed = time() - task_state.extra_state["start"]
        if elapsed > TIMEOUT:
            task_state.task_status = TASK_STATUSES["FAILED"]
            task_state.extra_state["error"] = f"Task timed out after {TIMEOUT} seconds"
            task_state_manager.write_state(task_state)
            logger.info(f"{task_id}: timed out after {time() - task_state.extra_state['start']} seconds.")
            raise HTTPException(
                status_code=500,
                detail=f"Task timed out after {TIMEOUT} seconds.")

    return AsyncToolResponse(
        task_id=task_state.task_id,
        query=task_state.query,
        estimated_time=task_state.estimated_time,
        task_status=task_state.task_status,
        task_result=task_state.task_result,
    )
