from typing import Any, Dict, List, Optional

from nora_lib.tasks.models import AsyncTaskState as BaseAsyncTaskState

from pydantic import BaseModel, Field


class Papers(BaseModel):
    corpus_ids: List[int] = Field(description="List of corpus ids of the papers")
    fields: Optional[List[str]] = Field(description="List of fields to be fetched from the papers")


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
    opt_in: Optional[bool] = Field(default=True, description=(
        "Flag to indicate whether to include the query and response in public release"))
    user_id: Optional[str] = Field(default=None, description="The user id of the user who posed the query")


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
    usage: Dict[str, Any]


class ToolResponse(BaseModel):
    task_id: str = Field(description="Unique identifiers for the invocation of the tool.")
    query: str = Field(description="The query that was posed to the tool.")
    task_result: TaskResult


class AsyncTaskState(BaseAsyncTaskState[TaskResult]):
    query: str = Field(description="The query that was posed to the tool.")


class AsyncToolResponse(BaseModel):
    task_id: str = Field(
        "Identifies the long-running task so that its status and eventual result"
        "can be checked in follow-up calls."
    )
    query: str = Field(description="The query that was posed to the tool.")
    estimated_time: str = Field(description="How long we expect this task to take from start to finish")
    task_status: str = Field(description="Current human-readable status of the task.")
    task_result: Optional[TaskResult] = Field(description="Final result of the task.")
