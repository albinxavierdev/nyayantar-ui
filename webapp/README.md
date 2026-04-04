Nyayantar Webapp

Setup
1) Install deps
   npm install

2) Environment
   Create webapp/.env.local with:
   - DATABASE_URL="file:./prisma/dev.db" (for dev)
   - NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"

3) Prisma
   - npx prisma generate
   - npx prisma migrate dev --name init
   - npx prisma studio (optional)

4) Run
   npm run dev

Notes
- Switch Prisma datasource to postgresql and set DATABASE_URL for production.
- The app DB is separate from the Python SQLite FTS index. Use the FastAPI /query endpoint for retrieval.*** End Patch```}>>json_error code_invalid***{}{
