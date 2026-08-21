<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🦅 NEPSE Terminal Pro — Agent Instructions & Specifications

## 1. Git Author Guidelines
- **ALWAYS** commit changes using the Git author name **"Your Zara"**.
- Ensure `git config user.name "Your Zara"` is preserved across all commits.

---

## 2. Core Architecture & Tech Stack
- **Framework**: Next.js 16.3 (App Router with Turbopack)
- **UI & Components**: React 19, Tailwind CSS v4, Lucide React, Recharts
- **Database**: Neon Serverless PostgreSQL (`postgresql://...neon.tech/neondb`)
- **ORM**: Prisma ORM 6.3 with `@neondatabase/serverless` & `@prisma/adapter-neon`
- **State & Data Pipeline**: Server-side pre-fetching on `page.tsx` + client optimistic state in `AppShell.tsx`
- **Market Data Feed**: Chukul NEPSE API (`https://chukul.com/api/data/market`) with staggered 50/60/70m TTL

---

## 3. Complete Database Schema (`prisma/schema.prisma`)

```prisma
// Prisma Schema for NEPSE Terminal Pro
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. Portfolio Trade Execution Ledger (FIFO Tax-Lot Accounting)
model Portfolio {
  id              Int      @id @default(autoincrement())
  date            DateTime
  symbol          String
  qty             Float
  price           Float
  transactionType String   @map("transaction_type") // BUY or SELL
  remarks         String?
  netAmount       Float    @map("net_amount")        // Total payable / receivable after fees
  totalInvested   Float    @default(0) @map("total_invested")
  totalReceived   Float    @default(0) @map("total_received")
  tmsCommission   Float?   @map("tms_commission")
  cgt             Float?
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("portfolio")
}

// 2. Broker Cash Flow & Collateral Ledger
model TmsTransaction {
  id        Int      @id @default(autoincrement())
  date      DateTime
  stock     String?
  type      String   // Deposit, Withdrawal, Buy, Sell, Charges, Collateral Load
  medium    String   // ConnectIPS, Collateral, NABIL Bank, GLOBAL IME, etc.
  amount    Float    // Positive for deposit/sell, negative for buy/withdrawal
  charge    Float    @default(0)
  remark    String?
  status    String   // Settled, Pending
  reference String?

  @@map("tms_trx")
}

// 3. Live Market Price Cache (347+ NEPSE Tickers)
model MarketCache {
  symbol        String   @id                      // Primary Key: Symbol Ticker (e.g., 'ULHC', 'NHPC')
  ltp           Float
  changePercent Float    @default(0) @map("change_percent")
  volume        Int      @default(0)
  dayHigh       Float    @default(0) @map("day_high")
  dayLow        Float    @default(0) @map("day_low")
  lastUpdated   DateTime @default(now()) @map("last_updated")

  @@map("cache")
}

// 4. Net Worth & Historical Equity Trajectory
model WealthSnapshot {
  snapshotDate    DateTime @id @map("snapshot_date") // Primary Key: Date of snapshot
  totalInvestment Float    @map("total_investment")
  currentValue    Float    @map("current_value")

  @@map("wealth")
}

// 5. Psychological Mindset & Trading Journal
model TradingJournal {
  id            Int      @id @default(autoincrement())
  dateTimeStamp DateTime @default(now()) @map("date_time_stamp")
  symbol        String
  topic         String
  feeling       String   // Systematic, FOMO, Anxious, Neutral, Greedy
  star          Int      // Setup rating (1 to 10)
  tradeThesis   String   @map("trade_thesis")
  finalRemark   String?  @map("final_remark")

  @@map("trading_journal")
}

// 6. Target Price, Stop Loss & Entry Radar
model Watchlist {
  id          Int      @id @default(autoincrement())
  symbol      String   @unique
  targetPrice Float    @default(0) @map("target_price")
  stopLoss    Float    @default(0) @map("stop_loss")
  hardTarget  Float    @default(0) @map("hard_target")
  hardSl      Float    @default(0) @map("hard_sl")
  entry1      Float    @default(0) @map("entry_1")
  entryMust   Float    @default(0) @map("entry_must")
  notes       String?

  @@map("watchlist")
}

// 7. System Audit Trail
model AuditLog {
  id        Int      @id @default(autoincrement())
  timestamp DateTime @default(now())
  action    String
  symbol    String?
  details   String

  @@map("audit_log")
}
```

---

## 4. Financial Calculation Engine Rules (`src/lib/nepse-math.ts`)
1. **Tiered Broker Commission**:
   - Order $\le$ 50k: $0.36\%$ (Min Rs 10)
   - 50k – 500k: $0.33\%$
   - 500k – 20 Lakh: $0.31\%$
   - 20 Lakh – 1 Crore: $0.27\%$
   - $>$ 1 Crore: $0.24\%$
2. **Regulatory & DP Fees**:
   - SEBON Fee: $0.015\%$ ($0.00015$)
   - DP Fee: Flat Rs 25 per trade
3. **FIFO WACC Calculation**:
   - Consume oldest buy lots first upon sell execution.
   - Capital Gains Tax (CGT) is computed on net profit exceeding cost basis.

---

## 5. Strategic Development Roadmap & Plans

```
   ┌───────────────────────────────────────────────────────────────────────────┐
   │                       NEPSE TERMINAL PRO ROADMAP                          │
   └───────────────────────────────────────────────────────────────────────────┘
                                      │
     ┌────────────────────────────────┴────────────────────────────────┐
     ▼                                                                 ▼
[PHASE 1: FOUNDATION]                                       [PHASE 2: REAL-TIME & OPS]
 • Neon PostgreSQL Integration (Done)                        • SSE/WebSocket Live Market Feed
 • FIFO Rolling WACC Engine (Done)                           • Multi-Portfolio & Sub-Accounts
 • Staggered Cache 50-70m TTL (Done)                         • Auto-Signal Engine (RSI/EMA/MACD)
 • Dark Bloomberg Terminal UI (Done)                         • TMS PDF/CSV Statement Importer
     │                                                                 │
     └────────────────────────────────┬────────────────────────────────┘
                                      │
     ┌────────────────────────────────┴────────────────────────────────┐
     ▼                                                                 ▼
[PHASE 3: ADVANCED QUANT]                                   [PHASE 4: AUTONOMOUS AI]
 • Broker 58 Floor Sheet Concentration                       • Historical Strategy Backtesting Engine
 • Tax-Loss Harvesting Optimization                          • AI Multi-Model Analyst 2.0 (RAG)
 • Webhook/Telegram/Discord Trade Alerts                     • PWA & Mobile Native Optimization
```

### Phase 1: Core Foundation & Stability (✅ Completed)
- [x] Full migration to **Neon Serverless PostgreSQL** with zero schema mismatch.
- [x] Exact FIFO Tax-Lot WACC accounting engine with NEPSE broker tiers and DP/SEBON fees.
- [x] Staggered Market Cache TTL (**50, 60, 70 min**) with automatic 1-hour periodic refresh.
- [x] Responsive dark mode Bloomberg-inspired executive dashboard with Recharts visualizations.

### Phase 2: Real-time Live Market & Multi-Account Operations (🚧 In Progress / Next)
- [ ] **Live Market Streaming via SSE/WebSocket**:
  - Push live price ticks and index movements during NEPSE market hours (11:00 AM – 3:00 PM NST) with zero polling overhead.
- [ ] **Multi-Portfolio & Family Accounts**:
  - Support multiple segregated portfolios (e.g., *Core Long-Term*, *Swing Trading*, *Family Portfolio*) under unified login.
- [ ] **Automated Technical Indicators & Signal Alerts**:
  - Real-time indicator overlays (RSI 14, 20/50/200 EMA crossovers, MACD, Volume Spikes) on Watchlist and Active holdings.
- [ ] **TMS Statement Smart Import**:
  - Drag-and-drop parser for broker PDF/CSV statements to automatically backfill trade executions and cash collateral logs.

### Phase 3: Broker Analytics & Tax Optimization (🔮 Planned)
- [ ] **Floor Sheet & Broker 58 Concentration Tracker**:
  - Monitor institutional broker accumulation/distribution patterns in real time.
- [ ] **Tax-Loss Harvesting & CGT Maturity Radar**:
  - Highlight tax-loss harvesting opportunities before fiscal year-end and track 365-day holding transitions from $7.5\%$ to $5\%$ CGT.
- [ ] **Instant Notification Dispatcher**:
  - Webhook integration to dispatch instant Stop-Loss and Target-Hit alerts via Telegram / Discord.

### Phase 4: Autonomous Quantitative AI & Backtesting (🚀 Long-Term Vision)
- [ ] **Quantitative Strategy Backtesting Engine**:
  - Test custom rules (Breakout, Demand Zone, Moving Average bounce) against 10+ years of historical NEPSE EOD data.
- [ ] **AI Multi-Agent Analyst 2.0**:
  - Retrieval-Augmented Generation (RAG) over trading journal history to detect trader cognitive biases and recommend portfolio rebalancing.
- [ ] **Progressive Web App (PWA) & Biometric Auth**:
  - Offline-first caching with WebAuthn fingerprint/FaceID quick unlock.

---

## 6. Coding & Contribution Rules for AI Agents
1. **Preserve Comments & Formatting**: Never strip architectural comments or user-defined instructions.
2. **Strict TypeScript & Schema Integrity**: Always keep `schema.prisma`, `storage.ts`, and API route types strictly synchronized.
3. **Safe Database Operations**: Use atomic transactions (`prisma.$transaction`) for simultaneous portfolio and TMS ledger updates.
4. **Git Commits**: Author must always be set to **"Your Zara"**.

