from pydantic import BaseModel
from typing import Optional

class RevertRequest(BaseModel):
    slug: str
    commit_sha: str        # full SHA of the commit to revert to
    commit_message: str    # shown in confirmation dialog
    is_sidebar: Optional[bool] = False

class ContentSaveRequest(BaseModel):
    slug: str
    content: Optional[str] = None
    newValue: Optional[str] = None  # Added for compatibility with frontend payload
    title: Optional[str] = None
    sidebar_label: Optional[str] = None
    workspace: Optional[str] = "docs"


