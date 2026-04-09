import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
  {
    type: "category",
    label: "General",
    collapsible: true,
    collapsed: false,
    items: [
    "migration-from-old-docs",
    "separation-guide",
    "structure-guide",
    "documentation-analysis",
    "system-requirements"
    ]
  },
  {
    type: "category",
    label: "01-overview",
    collapsible: true,
    collapsed: false,
    items: [
    "overview/project-analysis",
    "overview/project-analysis",
    "overview/project-analysis",
    "overview/project-analysis",
    "overview/project-analysis",
    "overview/project-analysis",
    "overview/project-analysis"
    ]
  },
  {
    type: "category",
    label: "architecture-decisions",
    collapsible: true,
    collapsed: false,
    items: [
    "architecture-decisions/adr-0001-tech-stack",
    "architecture-decisions/adr-0002-auth-approach",
    "architecture-decisions/adr-0003-ai-model-selection"
    ]
  },
  {
    type: "category",
    label: "implementation-rules",
    collapsible: true,
    collapsed: false,
    items: [
    "implementation-rules/frontend-structure",
    "implementation-rules/backend-structure",
    "implementation-rules/ai-structure"
    ]
  },
  {
    type: "category",
    label: "structures",
    collapsible: true,
    collapsed: false,
    items: [
    "structures/delta-labs-backend-structure",
    "structures/delta-labs-frontend-structure",
    "structures/delta-labs-ai-structure"
    ]
  }
  ],
};

export default sidebars;
