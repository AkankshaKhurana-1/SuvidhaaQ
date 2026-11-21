# 🚀 Setup & Deployment Guide

This guide walks through running the Hospital Queue Elimination System locally or via Docker.

---

## 📋 Prerequisites
- **Node.js** v20+ or v22+
- **PostgreSQL 16** (running locally or via Docker)
- **npm** v10+

---

## 🛠️ Local Development Setup

### 1. Configure Environment Variables
Copy `.env.example` or create `backend/.env` with your database credentials and a secure `JWT_SECRET`:
```env
DATABASE_URL=postgresql://<USER>@127.0.0.1:5432/hospital_queue
DIRECT_URL=postgresql://<USER>@127.0.0.1:5432/hospital_queue
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Prisma Client & Push Database Schema
```bash
npm run prisma:generate
npx prisma db push --schema=backend/src/prisma/schema.prisma
```

### 4. Seed Database with Initial Data
```bash
npm run build
node -r dotenv/config backend/dist/prisma/seed.js dotenv_config_path=./backend/.env
```
Default accounts seeded:
- **Admin**: `admin@hospital.com` / `password123`
- **Doctor**: `doctor@hospital.com` / `password123`
- **Receptionist**: `reception@hospital.com` / `password123`

### 5. Start the Server
```bash
npm run dev
# or
npm run start
```
The server will listen at `http://localhost:3001`.

---

## 🐳 Running with Docker

To run both PostgreSQL and the backend API using Docker Compose:
```bash
docker compose up -d
```
The container will launch PostgreSQL on port 5432 and the API server on port 3001.
