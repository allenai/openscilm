from typing import Any, Dict, List, Optional

from nora_lib.tasks.models import AsyncTaskState as BaseAsyncTaskState

from pydantic import BaseModel, Field


# TODO: define your request data
class ToolRequest(BaseModel):
    task_id: Optional[str] = Field(default=None, description=(
        "Reference to a long-running task. Provide this argument to receive an update on its"
        "status and possibly its result."
    ))
    query: str = Field(default=None, description=(
        "A scientific query posed to nora by a user"
    ))
    feedback_toggle: Optional[bool] = Field(default=False, description=("Flag to indicate whether to run feedback aware"
                                                                        " iterations on the generated output"))


class Citation(BaseModel):
    id: str = Field(default=None, description=(
        "The id of the citation which is of the format (index, author_ref_string, year)"
    ))
    corpus_id: int = Field(allow_none=False, description=(
        "The Semantic Scholar id of the cited paper"))
    n_citations: Optional[int] = Field(default=0, description=(
        "The number of times the source paper has been cited"
    ))
    snippet: str = Field(description=(
        "A relevant snippet from the cited paper"
    ))
    score: float = Field(description=("Relevance score of the snippet for the query"))


class GeneratedIteration(BaseModel):
    text: str = Field(default=None, description=(
        "The generated section text"
    ))

    feedback: Optional[str] = Field(default=None, description=(
        "Feedback from the generator LLM on the answer"
    ))

    citations: List[Citation] = Field(default=None, description=(
        "The citations used in the generated section"
    ))


# TODO: define your result data
class TaskResult(BaseModel):
    """The outcome of running a Task to completion"""
    iterations: List[GeneratedIteration] = Field(
        description="The generated iterations of the answer"
    )


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
