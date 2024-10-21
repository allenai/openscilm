from typing import Any, Dict, List, Optional

from nora_lib.tasks.models import AsyncTaskState as BaseAsyncTaskState

from pydantic import BaseModel, Field


# TODO: define your request data
class ToolRequest(BaseModel):
    task_id: Optional[str] = Field(default=None, description=(
    "Reference to a long-running task. Provide this argument to receive an update on its"
    "status and possibly its result."
    ))
    # your task-specific fields below
    # foos: List[int] = Field("a list of important input ints")
    # bars: List[str] = Field("a list of important input strings")


# TODO: define your result data
class TaskResult(BaseModel):
    """The outcome of running a Task to completion"""
    # foo: int = Field("Some output field")
    # bar: str = Field("Some other output field")


class ToolResponse(BaseModel):
    task_id: str = Field(description="Unique identifiers for the invocation of the tool.")
    task_result: TaskResult


class AsyncTaskState(BaseAsyncTaskState[TaskResult]):
    pass


class AsyncToolResponse(BaseModel):
    task_id: str = Field(
        "Identifies the long-running task so that its status and eventual result"
        "can be checked in follow-up calls."
    )
    estimated_time: str = Field(description="How long we expect this task to take from start to finish")
    task_status: str = Field(description="Current human-readable status of the task.")
    task_result: Optional[TaskResult] = Field(description="Final result of the task.")




