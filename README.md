<div align="center">

# 🦅 NEPSE Terminal Pro

### *Enterprise Quantitative Stock Trading Terminal & FIFO Wealth Manager for NEPSE*

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Neon Database](https://img.shields.io/badge/Neon-Serverless_PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma-6.3.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJagdish-Sah%2FNepse-Diary-WebApp)

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-local-development-setup">Local Setup</a> •
  <a href="#-deploying-to-vercel">Vercel Deployment</a> •
  <a href="#-database-schema">Database Schema</a> •
  <a href="#-nepse-financial-math-engine">Math Engine</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

</div>

---

## 🌟 Overview

**NEPSE Terminal Pro** is a high-performance, dark-themed quantitative trading terminal engineered specifically for the **Nepal Stock Exchange (NEPSE)**.

Designed for serious swing traders, positional investors, and quantitative analysts, it eliminates manual spreadsheets by offering exact **FIFO Tax-Lot Accounting**, **Automated NEPSE Fee Deductions**, **Broker Collateral Tracking**, **Staggered Market Cache TTL**, and **Multi-Model AI Market Intelligence**.

---

## ⚡ Key Features

| Feature | Description |
| :--- | :--- |
| 🧮 **Strict FIFO WACC Engine** | Exact tax-lot matching consuming oldest buy lots first on sales. Computes true rolling WACC and net realized gains. |
| 🇳🇵 **NEPSE Regulatory Precision** | Built-in tiered broker commission ($0.36\% - $0.24\%$), SEBON fees ($0.015\%$), flat DP fees (Rs 25), and Capital Gains Tax ($5\% / 7.5\% / 10\%$). |
| 📊 **Bloomberg-Inspired Executive Dashboard** | Real-time Net Worth KPIs, Asset Allocation Donut, Lifetime Capital Turnover, and Drawdown Analytics via Recharts. |
| 🔄 **Intelligent Staggered Market Cache** | 347+ NEPSE tickers with dynamic **50, 60, 70-minute staggered TTL** (10-minute jitter) and 1-hour periodic auto-refresh from the Chukul API. |
| 🏦 **Broker TMS & Collateral Ledger** | Track cash deposits (ConnectIPS), withdrawals, trade settlements, and running wallet balances. |
| 🎯 **Target & Stop-Loss Radar** | Automated visual radar monitoring active holdings against entry zones, stop losses, and target price levels. |
| 🧠 **Trading Psychology & Journal** | Log trade setups with star ratings ($1-10\star$), emotional mindset reflections (FOMO, Systematic, Anxious), and trade thesis notes. |
| 🤖 **AI Multi-Model Intelligence** | Contextual portfolio risk analysis powered by Google Gemini, OpenAI GPT-4o, and Grok. |
| 🔐 **Role-Based Security** | Built-in JWT session authorization with segregated **Admin** (Read/Write) and **Viewer** (Read-Only) roles. |

---

## 🛠️ Tech Stack

```
Frontend:   Next.js 16.3 (Turbopack, App Router) + React 19 + Tailwind CSS v4 + Recharts + Lucide
Backend:    Next.js Server Actions & Route Handlers + TypeScript 5
Database:   Neon Serverless PostgreSQL (WebSocket pooled)
ORM:        Prisma ORM 6.3 with @prisma/adapter-neon
Auth:       Stateless Signed JWT Cookies with Role Permissions
Market API: Live Chukul Market Feed (https://chukul.com/api/data/market)
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x` (Recommended: Node 22 LTS)
- **npm**: `v10.x` or higher
- **PostgreSQL Database**: Free cloud database from [Neon](https://neon.tech)

### 2. Clone the Repository
```bash
git clone https://github.com/Jagdish-Sah/Nepse-Diary-WebApp.git
cd Nepse-Diary-WebApp
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Neon Serverless PostgreSQL Database Connection
DATABASE_URL="postgresql://<user>:<password>@<neon-endpoint>.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://<user>:<password>@<neon-endpoint>.aws.neon.tech/neondb?sslmode=require"

# System Authentication Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="password123"
VIEWER_USERNAME="viewer"
VIEWER_PASSWORD="viewer123"

# JWT Session Secret
SESSION_SECRET="nepse_terminal_pro_super_secure_jwt_secret_key_2026_983749817234"

# Optional AI Analyst API Keys
GEMINI_API_KEY=""
OPENAI_API_KEY=""
GROK_API_KEY=""
```

### 5. Generate Prisma Client & Sync Database
```bash
npx prisma generate
npx prisma db push
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Default Admin Login: `admin` / `password123`.

---

## ☁️ Deploying to Vercel

Deploying NEPSE Terminal Pro to [Vercel](https://vercel.com) takes less than 2 minutes:

### Option A: One-Click Deploy Button
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJagdish-Sah%2FNepse-Diary-WebApp)

### Option B: Manual Vercel Git Import
1. Push your repository to GitHub.
2. Log in to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. Select your GitHub repository: `Nepse-Diary-WebApp`.
4. In the **Environment Variables** section, add the required keys:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled URL with SSL | `postgresql://...@...neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Direct database connection URL | `postgresql://...@...neon.tech/neondb?sslmode=require` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | Strong admin password | `your_secure_password` |
| `VIEWER_USERNAME` | View-only login username | `viewer` |
| `VIEWER_PASSWORD` | View-only password | `viewer123` |
| `SESSION_SECRET` | 32+ character random string for JWT | `a8f9c2d1e4b7...` |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API Key | `AIzaSy...` |
| `OPENAI_API_KEY` | *(Optional)* OpenAI API Key | `sk-proj-...` |
| `GROK_API_KEY` | *(Optional)* xAI Grok API Key | `xai-...` |

5. Click **"Deploy"**. Vercel will automatically build the Next.js project with Turbopack and deploy to an edge network.

---

## 🗄️ Database Schema

The database runs on **Neon Serverless PostgreSQL** with exact mapping via Prisma ORM:

```
Neon PostgreSQL (neondb)
 ├── portfolio        -> FIFO Trade Execution Ledger (id SERIAL PK)
 ├── tms_trx          -> Broker Cash Flow & Collateral Ledger (id SERIAL PK)
 ├── cache            -> Live Market Cache - 347 Tickers (symbol PK)
 ├── wealth           -> Historical Equity Curve Snapshots (snapshot_date PK)
 ├── trading_journal  -> Psychology, Star Ratings & Theses (id SERIAL PK)
 ├── watchlist        -> Stop Loss & Target Radar (id SERIAL PK, symbol UNIQUE)
 └── audit_log        -> Immutable System Action Trail (id SERIAL PK)
```

```prisma
// Sample Model: FIFO Trade Execution Ledger
model Portfolio {
  id              Int      @id @default(autoincrement())
  date            DateTime
  symbol          String
  qty             Float
  price           Float
  transactionType String   @map("transaction_type") // BUY or SELL
  remarks         String?
  netAmount       Float    @map("net_amount")
  totalInvested   Float    @default(0) @map("total_invested")
  totalReceived   Float    @default(0) @map("total_received")
  tmsCommission   Float?   @map("tms_commission")
  cgt             Float?
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("portfolio")
}
```

---

## 📐 NEPSE Financial Math Engine

All financial calculations follow official **SEBON & NEPSE** regulatory guidelines:

### 1. Tiered Broker Commission
$$\text{Order Value } (V) = \text{Qty} \times \text{Price}$$

- $V \le \text{Rs } 50,000$: **$0.36\%$** (Min Rs 10.0)
- $50,000 < V \le 500,000$: **$0.33\%$**
- $500,000 < V \le 2,000,000$: **$0.31\%$**
- $2,000,000 < V \le 10,000,000$: **$0.27\%$**
- $V > 10,000,000$: **$0.24\%$**

### 2. Regulatory & Depository Fees
- **SEBON Regulatory Fee**: $0.015\%$ ($V \times 0.00015$)
- **DP Charge**: Flat Rs 25 per trade

### 3. Exact Breakeven Formula
$$\text{Target Sell Base} = \frac{\text{BUY Total Payable} + \text{DP Fee}}{1.0 - \text{Broker Rate} - 0.00015}$$
$$\text{Breakeven Price} = \frac{\text{Target Sell Base}}{\text{Qty}}$$

---

## 🗺️ Strategic Roadmap

- [x] **Phase 1: Core Foundation & Stability**
  - Neon Serverless PostgreSQL with FIFO Tax-Lot accounting engine.
  - Staggered Market Cache TTL (**50/60/70 min**) with 1-hour auto-refresh.
  - Dark mode Bloomberg executive dashboard with Recharts.
- [ ] **Phase 2: Live Market & Multi-Account Operations**
  - Live SSE / WebSocket price streaming during NEPSE hours (11:00 AM – 3:00 PM NST).
  - Multi-portfolio & family sub-account segregation under unified login.
  - Real-time indicator overlays (RSI 14, 20/50/200 EMA, MACD, Volume Spikes).
  - Broker TMS statement PDF/CSV smart importer.
- [ ] **Phase 3: Quantitative Analytics & Tax Optimization**
  - Floor Sheet & Broker 58 institutional accumulation tracker.
  - Tax-loss harvesting radar and 365-day CGT maturity tracker.
  - Webhook alerts (Telegram & Discord) for Stop-Loss and Target hits.
- [ ] **Phase 4: Autonomous AI & Strategy Backtesting**
  - Quantitative backtesting engine over 10+ years of historical NEPSE EOD data.
  - AI Multi-Agent Analyst 2.0 with Financial RAG.
  - Offline-first PWA with biometric authentication.

---

## 👥 Authors & Contribution Guidelines

- **Project Creator & Maintainer**: [Jagdish Sah](https://github.com/Jagdish-Sah)
- **Git Commit Author**: **Your Zara**

### Contributing:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes with author name **Your Zara** (`git commit -m 'Add AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ for Nepalese stock traders and quantitative investors.</sub>
</div>
