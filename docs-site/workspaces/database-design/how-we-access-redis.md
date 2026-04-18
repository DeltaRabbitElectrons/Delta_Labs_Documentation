---
title: Ws:Database Design:How We Access Redis
sidebar_label: Ws:Database Design:How We Access Redis
id: how-we-access-redis
---

Same lifecycle pattern in \*\*\`app/infra/redis\_client.py\`\*\*:  
  
| Step | What happens |  
|------|----------------|  
| \*\*1. Settings\*\* | \*\*\`redis\_url\`\*\* and \*\*\`redis\_max\_connections\`\*\* from \`Settings\`. |  
| \*\*2. Startup\*\* | \*\*\`connect\_redis()\`\*\* builds one shared \*\*\`redis.asyncio\`\*\* client (\`decode\_responses=True\`). |  
| \*\*3. Requests / jobs\*\* | \*\*\`get\_redis()\`\*\* yields the client for FastAPI routes; \*\*\`get\_redis\_client()\`\*\* is used where a dependency context is not available (for example some middleware-style code). |  
| \*\*4. Shutdown\*\* | \*\*\`disconnect\_redis()\`\*\* closes the pool. |
