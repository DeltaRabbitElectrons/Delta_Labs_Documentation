---
title: Ws:Database Design:What Database Architecture Deltalabs Uses
sidebar_label: Ws:Database Design:What Database Architecture Deltalabs Uses
id: what-database-architecture-deltalabs-uses
---

DeltaLabs persists most business data in \*\*MongoDB\*\*, a \*\*document database\*\*. Data is stored as \*\*BSON documents\*\* inside \*\*named collections\*\* (similar in spirit to tables, but without a fixed SQL schema enforced by the database). Links between concepts (for example a school belonging to an org) are modeled with \*\*explicit ID fields\*\* on documents (\`org\_id\`, \`user\_id\`, …) plus \*\*application logic\*\* and \*\*indexes\*\* (including \*\*unique\*\* indexes) to enforce rules where needed.  
  
We also use \*\*Redis\*\*:  
  
\- For \*\*short-lived\*\* or \*\*high-churn\*\* data (signup flows, OTP verification, password recovery state, rate-limit counters).  
\- For \*\*idempotent HTTP\*\* response caching (so retries do not double-apply side effects).  
\- For \*\*Redis Streams\*\* and \*\*pub/sub\*\* around feed engagement and optional background workers.  
  
We are \*\*not\*\* using a relational DB (PostgreSQL/MySQL) or SQL migration files in this service. There is \*\*no ORM schema migration tool\*\*; instead, indexes are \*\*created from Python\*\* when services bootstrap (\`ensure\_indexes\` / \`bootstrap\_indexes\`).  
  
| Store | Role |  
|-------|------|  
| \*\*MongoDB\*\* | Durable system of record: accounts, orgs, roles, schools, feature catalog, feed items, engagement rows, media metadata. Survives process restarts; should be backed up per your ops policy. |  
| \*\*Redis\*\* | Speed and orchestration: TTL keys, streams, pub/sub. Losing Redis is \*\*not\*\* equivalent to losing the main product database, though specific flows (signup mid-step, stream cursor) may need to degrade gracefully or rebuild from Mongo where possible. |
