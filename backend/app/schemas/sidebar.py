from pydantic import BaseModel, field_validator
from typing import Optional, List

class SidebarNode(BaseModel):
    id: str
    type: str                    # "category" or "page"
    label: str
    slug: Optional[str] = None
    children: List['SidebarNode'] = []

    @field_validator('label')
    @classmethod
    def label_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Sidebar node label cannot be empty')
        return v.strip()

    @field_validator('type')
    @classmethod
    def type_must_be_valid(cls, v):
        if v not in ('category', 'page'):
            raise ValueError('type must be "category" or "page"')
        return v

SidebarNode.model_rebuild()

class SidebarUpdateRequest(BaseModel):
    tree: List[SidebarNode]
