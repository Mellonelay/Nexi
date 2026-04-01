# 🚀 Dexixz Project Migration Guide

This guide will help you transfer your work from your Desktop to your Surface Laptop 7.

## 📦 Phase 1: Save Your Work Online (On Desktop)

Since you are already using Git locally, the best way to save your work online is to push it to a private repository on GitHub, GitLab, or Bitbucket.

### Step 1: Create a Remote Repository
1. Go to [GitHub.com](https://github.com) (or your preferred provider).
2. Click **New Repository**.
3. Name it `dexi-style-platform` (or similar).
4. **Important:** Set visibility to **Private** (since this contains proprietary logic).
5. Do **not** initialize with README, .gitignore, or License (you already have them).
6. Click **Create repository**.

### Step 2: Push Your Code
Open your terminal in the project folder and run:

```bash
# Link your local repo to the remote one
git remote add origin <YOUR_GITHUB_REPO_URL>
# Example: git remote add origin https://github.com/yourusername/dexi-style-platform.git

# Rename branch to main if necessary (optional, usually 'master' or 'main')
git branch -M main

# Push your code
git push -u origin main
```

*(If you are already on `master` branch, replace `main` with `master` in the commands above)*

---

## 💻 Phase 2: Setup Surface Laptop 7

Before you travel, install these tools on your Surface Laptop 7 to ensure a smooth workflow.

### 1. Install Essential Tools
*   **Node.js (LTS Version)**: Download "LTS" from [nodejs.org](https://nodejs.org/). (Version 18 or 20 recommended).
*   **Git**: Download from [git-scm.com](https://git-scm.com/).
*   **Visual Studio Code** (or Trae): Your code editor.
*   **PostgreSQL (Database)**:
    *   *Option A (Recommended):* Install **Docker Desktop**. This allows you to run Postgres without messing up your system.
    *   *Option B:* Install **PostgreSQL** directly from [postgresql.org](https://www.postgresql.org/download/).

### 2. Clone Your Project
Open your terminal (PowerShell or Git Bash) on the Surface Laptop:

```bash
# Navigate to where you want to save the project
cd Documents

# Clone the repo
git clone <YOUR_GITHUB_REPO_URL>
cd dexi-style-platform
```

### 3. Install Dependencies
You need to install libraries for both Backend and Frontend.

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Install Frontend Dependencies
cd ../frontend
npm install
```

### 4. Configure Environment Variables
You need to set up your secrets (API keys, DB URL) again.

*   **Backend:** Create a `.env` file in the `backend/` folder.
    ```env
    DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/dexi_db?schema=public"
    JWT_SECRET="your-secret-key"
    PORT=3001
    ```
*   **Frontend:** Create a `.env.local` file in the `frontend/` folder.
    ```env
    NEXT_PUBLIC_API_URL="http://localhost:3001"
    ```

### 5. Start the Database
*   **If using Docker:**
    ```bash
    # Inside the project root (where docker-compose.yml is)
    docker-compose up -d db redis
    ```
*   **If using Local Postgres:**
    *   Open pgAdmin or psql.
    *   Create a database named `dexi_db`.
    *   Update `DATABASE_URL` in `backend/.env` with your password if it's not `postgres`.

### 6. Initialize Database Schema & Data
Now, apply your "Hidden DNA" schema and seed the initial data (Contracts, Plans, etc.).

```bash
cd backend

# Push Schema to DB
npx prisma db push

# Seed Initial Data (Mining Plans, Contract Pairs)
npx tsx prisma/seed.ts
```

### 7. Start the Development Servers
Open two terminal tabs:

**Terminal 1 (Backend):**
```bash
cd backend
npm run start:dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 🛠️ Troubleshooting on the Go

*   **Database Errors?** Check if Postgres is running (`docker ps` or check Services). Ensure `.env` credentials match.
*   **Missing Modules?** Run `npm install` again in the respective folder.
*   **"Address in use"?** Make sure you aren't running another server on port 3001 or 3000.

## ✅ Checklist Before You Leave
- [ ] Code pushed to GitHub/GitLab?
- [ ] Surface Laptop has Node.js & Git installed?
- [ ] You remember your GitHub password/token?
- [ ] (Optional) Copy the `dexi-style-platform` folder to a USB drive as a backup "just in case" internet is bad.

Safe travels! ✈️
