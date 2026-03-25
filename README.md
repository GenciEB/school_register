# School Register

Full-stack school register app. React frontend + Node/Express backend + PostgreSQL.

## Structure

```
school-register/
├── client/   → Deploy to Vercel
└── server/   → Deploy to Render
```

---

## Local Development

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# Fill in your DATABASE_URL and JWT_SECRET in .env
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
# Create .env with:
# VITE_API_URL=http://localhost:4000
npm run dev
```

---

## Deploy

### Backend → Render

1. Go to render.com → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `server`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables:
   - `DATABASE_URL` → your Render PostgreSQL URL
   - `JWT_SECRET` → any long random string
   - `CLIENT_URL` → your Vercel frontend URL
   - `NODE_ENV` → `production`

### Frontend → Vercel

1. Go to vercel.com → New Project
2. Connect your GitHub repo
3. Set **Root Directory** to `client`
4. Add environment variable:
   - `VITE_API_URL` → your Render backend URL (e.g. https://school-register.onrender.com)
5. Deploy

---

## Database

The schema auto-runs on server start. No manual migration needed.
