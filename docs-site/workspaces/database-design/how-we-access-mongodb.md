---
title: Ws:Database Design:How We Access Mongodb
sidebar_label: Ws:Database Design:How We Access Mongodb
id: how-we-access-mongodb
---

Everything goes through \*\*\`app/infra/database.py\`\*\* and domain \*\*repositories\*\*.  
  
| Step | What happens |  
|------|----------------|  
| \*\*1. Settings\*\* | \`app/core/config.py\` (\`Settings\`) reads \*\*\`mongodb\_uri\`\*\* and \*\*\`mongodb\_db\_name\`\*\* from the environment (default database name is typically \`deltalabs\`). Pool and timeout settings are also there. |  
| \*\*2. Startup\*\* | In \`app/main.py\`, the FastAPI \*\*lifespan\*\* calls \*\*\`connect\_mongodb()\`\*\* once per process. That creates a single shared \*\*\`AsyncIOMotorClient\`\*\* (Motor — the official async driver for MongoDB in Python) with the configured pool size. |  
| \*\*3. Database handle\*\* | \*\*\`get\_database()\`\*\* returns \*\*\`AsyncIOMotorDatabase\`\*\* for the configured database name — that is the object routes use as “the database”. |  
| \*\*4. Requests\*\* | \*\*\`get\_db()\`\*\* is a FastAPI dependency that \*\*yields\*\* that same database object to endpoints and nested dependencies (\`Depends(get\_db)\` in \`app/api/deps.py\`). |  
| \*\*5. Reads and writes\*\* | Domain code uses \*\*\`app/domain/<area>/repository.py\`\*\*. Each repository receives the database object and uses \*\*\`db\["collection\_name"\]\`\*\* for \`find\_one\`, \`insert\_one\`, \`update\_one\`, \`create\_index\`, etc. |  
| \*\*6. Indexes\*\* | Repositories expose \*\*\`ensure\_indexes()\`\*\* (or services call \*\*\`bootstrap\_indexes()\`\*\*) so required indexes exist after deploy. This is \*\*runtime\*\* index creation, not a separate migration CLI. |  
| \*\*7. Shutdown\*\* | \*\*\`disconnect\_mongodb()\`\*\* closes the Motor client when the app stops. |
