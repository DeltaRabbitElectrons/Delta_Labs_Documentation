"""
One-time script to reseed the sidebar_tree in MongoDB with correct slugs.
Replaces the old numbered-prefix slugs with correct flat slugs.
Run from backend/ directory:
    python scripts/reseed_sidebar.py
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio
from app.config import settings
import uuid

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.DATABASE_NAME]

def uid():
    return str(uuid.uuid4())

# Build the correct sidebar tree matching actual file structure
CORRECT_TREE = [
    {
        "id": uid(), "type": "category", "label": "Getting Started", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Introduction", "slug": "getting-started/introduction", "children": []},
            {"id": uid(), "type": "page", "label": "System Requirements", "slug": "getting-started/system-requirements", "children": []},
            {"id": uid(), "type": "page", "label": "Local Setup", "slug": "getting-started/local-setup", "children": []},
            {"id": uid(), "type": "page", "label": "First Run", "slug": "getting-started/first-run", "children": []},
            {"id": uid(), "type": "page", "label": "Repo Overview", "slug": "getting-started/repo-overview", "children": []},
            {"id": uid(), "type": "page", "label": "Contributor Workflow", "slug": "getting-started/contributor-workflow", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Overview", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Overview", "slug": "overview/overview", "children": []},
            {"id": uid(), "type": "page", "label": "Project Analysis", "slug": "overview/project-analysis", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Explanation", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "System Overview", "slug": "explanation/system-overview", "children": []},
            {"id": uid(), "type": "page", "label": "Design Philosophy", "slug": "explanation/design-philosophy", "children": []},
            {"id": uid(), "type": "page", "label": "Product Vision", "slug": "explanation/product-vision", "children": []},
            {"id": uid(), "type": "page", "label": "Project Analysis", "slug": "explanation/project-analysis", "children": []},
            {"id": uid(), "type": "page", "label": "Scalability Strategy", "slug": "explanation/scalability-strategy", "children": []},
            {"id": uid(), "type": "page", "label": "Tradeoffs and Constraints", "slug": "explanation/tradeoffs-and-constraints", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Architecture", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Architecture Intro", "slug": "architecture/architecture-intro", "children": []},
            {"id": uid(), "type": "page", "label": "Full System Architecture", "slug": "architecture/full-system-architecture", "children": []},
            {"id": uid(), "type": "page", "label": "AI Architecture", "slug": "architecture/ai-architecture", "children": []},
            {"id": uid(), "type": "page", "label": "Data Flow", "slug": "architecture/data-flow", "children": []},
            {"id": uid(), "type": "page", "label": "Data Model", "slug": "architecture/data-model", "children": []},
            {"id": uid(), "type": "page", "label": "Service Boundaries", "slug": "architecture/service-boundaries", "children": []},
            {"id": uid(), "type": "page", "label": "Integration Points", "slug": "architecture/integration-points", "children": []},
            {"id": uid(), "type": "page", "label": "Deployment Architecture", "slug": "architecture/deployment-architecture", "children": []},
            {"id": uid(), "type": "page", "label": "Use Cases", "slug": "architecture/use-cases", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Design System", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Design Intro", "slug": "design-system/design-intro", "children": []},
            {"id": uid(), "type": "page", "label": "Design Principles", "slug": "design-system/design-principles", "children": []},
            {"id": uid(), "type": "page", "label": "Design Tokens", "slug": "design-system/design-tokens", "children": []},
            {"id": uid(), "type": "page", "label": "Design System", "slug": "design-system/design-system", "children": []},
            {"id": uid(), "type": "page", "label": "API Standards", "slug": "design-system/api-standards", "children": []},
            {
                "id": uid(), "type": "category", "label": "Components", "slug": None,
                "children": [
                    {"id": uid(), "type": "page", "label": "Component Catalog", "slug": "design-system/components/component-catalog", "children": []},
                    {"id": uid(), "type": "page", "label": "Component Doc Template", "slug": "design-system/components/component-doc-template", "children": []},
                ]
            },
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Development Standards", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Standards Intro", "slug": "development-standards/standards-intro", "children": []},
            {"id": uid(), "type": "page", "label": "Coding Standards", "slug": "development-standards/coding-standards", "children": []},
            {"id": uid(), "type": "page", "label": "Naming Conventions", "slug": "development-standards/naming-conventions", "children": []},
            {"id": uid(), "type": "page", "label": "Documentation Rules", "slug": "development-standards/documentation-rules", "children": []},
            {"id": uid(), "type": "page", "label": "Error Handling", "slug": "development-standards/error-handling", "children": []},
            {"id": uid(), "type": "page", "label": "Logging Standards", "slug": "development-standards/logging-standards", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "How-To Guides", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Add New API", "slug": "how-to-guides/add-new-api", "children": []},
            {"id": uid(), "type": "page", "label": "Add New Component", "slug": "how-to-guides/add-new-component", "children": []},
            {"id": uid(), "type": "page", "label": "Add AI Model", "slug": "how-to-guides/add-ai-model", "children": []},
            {"id": uid(), "type": "page", "label": "Extend Backend Service", "slug": "how-to-guides/extend-backend-service", "children": []},
            {"id": uid(), "type": "page", "label": "Handle Migration", "slug": "how-to-guides/handle-migration", "children": []},
            {"id": uid(), "type": "page", "label": "Debug Production Issue", "slug": "how-to-guides/debug-production-issue", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "API Reference", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "API Reference", "slug": "api-reference/api-reference", "children": []},
            {"id": uid(), "type": "page", "label": "Index", "slug": "api-reference/index", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Reference", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Config Reference", "slug": "reference/config-reference", "children": []},
            {"id": uid(), "type": "page", "label": "Environment Variables", "slug": "reference/environment-variables", "children": []},
            {"id": uid(), "type": "page", "label": "Error Codes", "slug": "reference/error-codes", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Best Practices", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Best Practices Intro", "slug": "best-practices/best-practices-intro", "children": []},
            {"id": uid(), "type": "page", "label": "Best Practices", "slug": "best-practices/best-practices", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Security", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Security Overview", "slug": "security/security-overview", "children": []},
            {"id": uid(), "type": "page", "label": "Authentication", "slug": "security/authentication", "children": []},
            {"id": uid(), "type": "page", "label": "Authorization", "slug": "security/authorization", "children": []},
            {"id": uid(), "type": "page", "label": "Data Privacy", "slug": "security/data-privacy", "children": []},
            {"id": uid(), "type": "page", "label": "Secrets Management", "slug": "security/secrets-management", "children": []},
            {"id": uid(), "type": "page", "label": "Threat Model", "slug": "security/threat-model", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Operations", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Environments", "slug": "operations/environments", "children": []},
            {"id": uid(), "type": "page", "label": "CI/CD", "slug": "operations/ci-cd", "children": []},
            {"id": uid(), "type": "page", "label": "Monitoring & Logging", "slug": "operations/monitoring-logging", "children": []},
            {"id": uid(), "type": "page", "label": "Alerting", "slug": "operations/alerting", "children": []},
            {"id": uid(), "type": "page", "label": "Incident Response", "slug": "operations/incident-response", "children": []},
            {"id": uid(), "type": "page", "label": "Backup & Recovery", "slug": "operations/backup-recovery", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Testing & Quality", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Testing Strategy", "slug": "testing-quality/testing-strategy", "children": []},
            {"id": uid(), "type": "page", "label": "Unit Testing", "slug": "testing-quality/unit-testing", "children": []},
            {"id": uid(), "type": "page", "label": "Integration Testing", "slug": "testing-quality/integration-testing", "children": []},
            {"id": uid(), "type": "page", "label": "E2E Testing", "slug": "testing-quality/e2e-testing", "children": []},
            {"id": uid(), "type": "page", "label": "Quality Gates", "slug": "testing-quality/quality-gates", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Process", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Process Intro", "slug": "process/process-intro", "children": []},
            {"id": uid(), "type": "page", "label": "CI/CD Branch & PR", "slug": "process/cicd-branch-pr", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Release Management", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Versioning", "slug": "release-management/versioning", "children": []},
            {"id": uid(), "type": "page", "label": "Release Process", "slug": "release-management/release-process", "children": []},
            {"id": uid(), "type": "page", "label": "Rollback Strategy", "slug": "release-management/rollback-strategy", "children": []},
            {"id": uid(), "type": "page", "label": "Deprecation Policy", "slug": "release-management/deprecation-policy", "children": []},
        ]
    },
    {
        "id": uid(), "type": "category", "label": "Templates", "slug": None,
        "children": [
            {"id": uid(), "type": "page", "label": "Templates", "slug": "templates/templates", "children": []},
            {"id": uid(), "type": "page", "label": "ADR Template", "slug": "templates/adr-template", "children": []},
            {"id": uid(), "type": "page", "label": "API Doc Template", "slug": "templates/api-doc-template", "children": []},
            {"id": uid(), "type": "page", "label": "Component Doc Template", "slug": "templates/component-doc-template", "children": []},
            {"id": uid(), "type": "page", "label": "How-To Template", "slug": "templates/how-to-template", "children": []},
            {"id": uid(), "type": "page", "label": "Index", "slug": "templates/index", "children": []},
        ]
    },
]

async def reseed():
    # Completely replace the sidebar_tree document
    await db.sidebar_tree.replace_one(
        {"_id": "main"},
        {
            "_id": "main",
            "tree": CORRECT_TREE,
            "updated_at": "2025-03-09T00:00:00Z",
            "updated_by": "reseed-script"
        },
        upsert=True
    )
    print(f"Sidebar reseeded with {len(CORRECT_TREE)} root categories.")
    print("All slugs now match actual file paths in docs-site/docs/")

if __name__ == "__main__":
    asyncio.run(reseed())
