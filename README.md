# Dexixz-Style Crypto Trading Platform

A complete, full-stack crypto trading platform featuring Spot Trading, Binary Options, Loans, Mining, and Wallet Management. Built with **NestJS**, **Next.js**, **Prisma**, and **PostgreSQL**.

## 🚀 Features

- **Authentication**: Secure Login, Signup, JWT Auth, KYC Stub.
- **Wallet System**: Multi-currency support, Deposit/Withdrawal, Transaction Ledger, Fund Locking.
- **Spot Trading**: Order Book, Limit/Market Orders, Matching Engine.
- **Binary Options**: Time-based betting (30s/60s), Automated Payouts, WebSocket Updates.
- **Loans**: Application flow, Admin Approval, Instant Disbursement.
- **Mining**: Investment Plans, Daily Yield Distribution, Subscription Management.
- **Conversion**: Instant Coin Swaps with Admin Rate Management.
- **Admin Dashboard**: User Management, Wallet Control, Trade Overrides.

## 🛠️ Tech Stack

- **Backend**: NestJS (Node.js), TypeScript, WebSocket Gateway, Schedule (Cron).
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons.
- **Database**: PostgreSQL (via Prisma ORM).
- **Cache**: Redis (for Session/Queue management - *Ready for implementation*).
- **Infrastructure**: Docker, Docker Compose.

## 📦 Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+) & npm (if running locally without Docker)

### 1. Quick Start (Docker)

This will spin up the Backend, Frontend, Postgres, and Redis.

```bash
# Clone the repository
git clone <repo-url>
cd dexi-style

# Start services
docker-compose up -d --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

### 2. Manual Setup (Local Development)

#### Backend
```bash
cd backend
npm install

# Setup Env
cp .env.example .env
# Update DATABASE_URL in .env to point to your local Postgres

# Database Migration
npx prisma generate
npx prisma db push

# Start Server
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install

# Start Server
npm run dev
```

## 🔑 Environment Variables

Create a `.env` file in the root (or `backend/` for local dev) based on `.env.example`:

```ini
# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/dexi_db?schema=public"

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Auth
PORT=3002
JWT_SECRET=supersecretkey
```

## 📚 Module Overview

### 1. Wallet Module (`/backend/src/wallet`)
Handles all financial transactions. Uses `lockFunds` to reserve money for trades and `deductLockedFunds` to settle them. All actions are recorded in the `Ledger` table.

### 2. Spot Module (`/backend/src/spot`)
Implements a standard order book. Orders are matched against opposing open orders. Funds are locked upon order placement and settled immediately upon match.

### 3. Binary Module (`/backend/src/binary`)
Users bet on price direction over a fixed time. A Cron job checks for expired positions every second. Wins credit the wallet automatically.

### 4. Mining Module (`/backend/src/mining`)
Users subscribe to plans (e.g., "30 Day Lockup"). A daily Cron job distributes yield to their wallet.

## 🛡️ Admin Controls

Access the Admin Dashboard at `/dashboard/admin` (Frontend).
- **Credit User**: Manually add funds to any user.
- **Force Binary Result**: Override win/loss for testing or risk management.
- **Update Rates**: Set conversion rates for the Swap feature.

## 📝 API Documentation

(Swagger integration pending - endpoints are available at `/api`)

---

**Built with ❤️ by Trae AI Team**
