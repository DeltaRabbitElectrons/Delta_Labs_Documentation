import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
  {
    "type": "category",
    "label": "Getting Started",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "getting-started/introduction",
        "label": "Introduction"
      },
      {
        "type": "doc",
        "id": "getting-started/system-requirements",
        "label": "System Requirements"
      },
      {
        "type": "doc",
        "id": "getting-started/local-setup",
        "label": "Local Setup"
      },
      {
        "type": "doc",
        "id": "getting-started/first-run",
        "label": "First Run"
      },
      {
        "type": "doc",
        "id": "getting-started/repo-overview",
        "label": "Repo Overview"
      },
      {
        "type": "doc",
        "id": "getting-started/contributor-workflow",
        "label": "Contributor Workflow"
      }
    ]
  },
  {
    "type": "category",
    "label": "Overview",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "overview/overview",
        "label": "Overview"
      },
      {
        "type": "doc",
        "id": "overview/project-analysis",
        "label": "Project Analysis"
      }
    ]
  },
  {
    "type": "category",
    "label": "Explanation",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "explanation/system-overview",
        "label": "System Overview"
      },
      {
        "type": "doc",
        "id": "explanation/design-philosophy",
        "label": "Design Philosophy"
      },
      {
        "type": "doc",
        "id": "explanation/product-vision",
        "label": "Product Vision"
      },
      {
        "type": "doc",
        "id": "explanation/project-analysis",
        "label": "Project Analysis"
      },
      {
        "type": "doc",
        "id": "explanation/scalability-strategy",
        "label": "Scalability Strategy"
      },
      {
        "type": "doc",
        "id": "explanation/tradeoffs-and-constraints",
        "label": "Tradeoffs and Constraints"
      }
    ]
  },
  {
    "type": "category",
    "label": "Architecture",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "architecture/architecture-intro",
        "label": "Architecture Intro"
      },
      {
        "type": "doc",
        "id": "architecture/full-system-architecture",
        "label": "Full System Architecture"
      },
      {
        "type": "doc",
        "id": "architecture/ai-architecture",
        "label": "AI Architecture"
      },
      {
        "type": "doc",
        "id": "architecture/data-flow",
        "label": "Data Flow"
      },
      {
        "type": "doc",
        "id": "architecture/data-model",
        "label": "Data Model"
      },
      {
        "type": "doc",
        "id": "architecture/service-boundaries",
        "label": "Service Boundaries"
      },
      {
        "type": "doc",
        "id": "architecture/integration-points",
        "label": "Integration Points"
      },
      {
        "type": "doc",
        "id": "architecture/deployment-architecture",
        "label": "Deployment Architecture"
      },
      {
        "type": "doc",
        "id": "architecture/use-cases",
        "label": "Use Cases"
      }
    ]
  },
  {
    "type": "category",
    "label": "Design System",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "design-system/design-intro",
        "label": "Design Intro"
      },
      {
        "type": "doc",
        "id": "design-system/design-principles",
        "label": "Design Principles"
      },
      {
        "type": "doc",
        "id": "design-system/design-tokens",
        "label": "Design Tokens"
      },
      {
        "type": "doc",
        "id": "design-system/design-system",
        "label": "Design System"
      },
      {
        "type": "doc",
        "id": "design-system/api-standards",
        "label": "API Standards"
      },
      {
        "type": "category",
        "label": "Components",
        "collapsible": true,
        "collapsed": false,
        "items": [
          {
            "type": "doc",
            "id": "design-system/components/component-catalog",
            "label": "Component Catalog"
          },
          {
            "type": "doc",
            "id": "design-system/components/component-doc-template",
            "label": "Component Doc Template"
          }
        ]
      }
    ]
  },
  {
    "type": "category",
    "label": "Development Standards",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "coding-standards/standards-intro",
        "label": "Standards Intro"
      },
      {
        "type": "doc",
        "id": "development-standards/coding-standards",
        "label": "Coding Standards"
      },
      {
        "type": "doc",
        "id": "development-standards/naming-conventions",
        "label": "Naming Conventions"
      },
      {
        "type": "doc",
        "id": "development-standards/documentation-rules",
        "label": "Documentation Rules"
      },
      {
        "type": "doc",
        "id": "development-standards/error-handling",
        "label": "Error Handling"
      },
      {
        "type": "doc",
        "id": "development-standards/logging-standards",
        "label": "Logging Standards"
      }
    ]
  },
  {
    "type": "category",
    "label": "How-To Guides",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "how-to-guides/add-new-api",
        "label": "Add New API"
      },
      {
        "type": "doc",
        "id": "how-to-guides/add-new-component",
        "label": "Add New Component"
      },
      {
        "type": "doc",
        "id": "how-to-guides/add-ai-model",
        "label": "Add AI Model"
      },
      {
        "type": "doc",
        "id": "how-to-guides/extend-backend-service",
        "label": "Extend Backend Service"
      },
      {
        "type": "doc",
        "id": "how-to-guides/handle-migration",
        "label": "Handle Migration"
      },
      {
        "type": "doc",
        "id": "how-to-guides/debug-production-issue",
        "label": "Debug Production Issue"
      }
    ]
  },
  {
    "type": "category",
    "label": "API Reference",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "api-reference/api-reference",
        "label": "API Reference"
      }
    ]
  },
  {
    "type": "category",
    "label": "Reference",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "reference/config-reference",
        "label": "Config Reference"
      },
      {
        "type": "doc",
        "id": "reference/environment-variables",
        "label": "Environment Variables"
      },
      {
        "type": "doc",
        "id": "reference/error-codes",
        "label": "Error Codes"
      }
    ]
  },
  {
    "type": "category",
    "label": "Best Practices",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "best-practices/best-practices-intro",
        "label": "Best Practices Intro"
      },
      {
        "type": "doc",
        "id": "best-practices/best-practices",
        "label": "Best Practices"
      }
    ]
  },
  {
    "type": "category",
    "label": "Security",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "security/security-overview",
        "label": "Security Overview"
      },
      {
        "type": "doc",
        "id": "security/authentication",
        "label": "Authentication"
      },
      {
        "type": "doc",
        "id": "security/authorization",
        "label": "Authorization"
      },
      {
        "type": "doc",
        "id": "security/data-privacy",
        "label": "Data Privacy"
      },
      {
        "type": "doc",
        "id": "security/secrets-management",
        "label": "Secrets Management"
      },
      {
        "type": "doc",
        "id": "security/threat-model",
        "label": "Threat Model"
      }
    ]
  },
  {
    "type": "category",
    "label": "Operations",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "operations/environments",
        "label": "Environments"
      },
      {
        "type": "doc",
        "id": "operations/ci-cd",
        "label": "CI/CD"
      },
      {
        "type": "doc",
        "id": "operations/monitoring-logging",
        "label": "Monitoring & Logging"
      },
      {
        "type": "doc",
        "id": "operations/alerting",
        "label": "Alerting"
      },
      {
        "type": "doc",
        "id": "operations/incident-response",
        "label": "Incident Response"
      },
      {
        "type": "doc",
        "id": "operations/backup-recovery",
        "label": "Backup & Recovery"
      }
    ]
  },
  {
    "type": "category",
    "label": "Testing & Quality",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "testing-quality/testing-strategy",
        "label": "Testing Strategy"
      },
      {
        "type": "doc",
        "id": "testing-quality/unit-testing",
        "label": "Unit Testing"
      },
      {
        "type": "doc",
        "id": "testing-quality/integration-testing",
        "label": "Integration Testing"
      },
      {
        "type": "doc",
        "id": "testing-quality/e2e-testing",
        "label": "E2E Testing"
      },
      {
        "type": "doc",
        "id": "testing-quality/quality-gates",
        "label": "Quality Gates"
      }
    ]
  },
  {
    "type": "category",
    "label": "Process",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "process/process-intro",
        "label": "Process Intro"
      },
      {
        "type": "doc",
        "id": "process/cicd-branch-pr",
        "label": "CI/CD Branch & PR"
      }
    ]
  },
  {
    "type": "category",
    "label": "Release Management",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "release-management/versioning",
        "label": "Versioning"
      },
      {
        "type": "doc",
        "id": "release-management/release-process",
        "label": "Release Process"
      },
      {
        "type": "doc",
        "id": "release-management/rollback-strategy",
        "label": "Rollback Strategy"
      },
      {
        "type": "doc",
        "id": "release-management/deprecation-policy",
        "label": "Deprecation Policy"
      }
    ]
  },
  {
    "type": "category",
    "label": "Templates",
    "collapsible": true,
    "collapsed": false,
    "items": [
      {
        "type": "doc",
        "id": "templates/templates",
        "label": "Templates"
      },
      {
        "type": "doc",
        "id": "templates/adr-template",
        "label": "ADR Template"
      },
      {
        "type": "doc",
        "id": "templates/api-doc-template",
        "label": "API Doc Template"
      },
      {
        "type": "doc",
        "id": "templates/component-doc-template",
        "label": "Component Doc Template"
      },
      {
        "type": "doc",
        "id": "templates/how-to-template",
        "label": "How-To Template"
      }
    ]
  }
]
};

export default sidebars;
