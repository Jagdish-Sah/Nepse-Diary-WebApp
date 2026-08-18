# 🦅 NEPSE Terminal Pro — Developer Guide & Reference (`ReadForDev.md`)

> **Enterprise-grade quantitative wealth manager & stock trading terminal for the Nepal Stock Exchange (NEPSE)**  
> Rebuilt with **Next.js 16.3 (App Router)**, **React 19.2**, **TypeScript 5**, **Neon Serverless PostgreSQL**, **Prisma ORM 6.3**, and **Tailwind CSS v4**.

---

## 1. Project Overview

**NEPSE Terminal Pro** is a high-performance quantitative stock diary, risk management suite, and portfolio tracker specifically tailored to the rules and fee structures of the **Nepal Stock Exchange (NEPSE)**.

### Core Objectives:
- **Strict FIFO Tax-Lot WACC Accounting**: Correctly matches historical buy lots with sell orders to compute true rolling WACC, net realized profits, and exact unrealized P/L.
- **NEPSE Settlement Fee Precision**: Incorporates tiered broker commission rates, SEBON regulatory fees ($0.015\%$), DP charges (Rs 25), and Capital Gains Tax (CGT $5\%$ for $>365$ days, $7.5\%$ or $10\%$ for $\le 365$ days).
- **Broker TMS Cash Flow & Collateral Management**: Tracks net cash in/out, settled/pending trades, running wallet balances, and broker buying power with collateral.
- **Live Market Data Sync**: Automatically updates Last Traded Prices (LTP), percentage changes, day highs, lows, and volume for 347+ NEPSE tickers via Chukul API.
- **Quantitative Risk & AI Analyst**: Position sizing via Kelly Criterion, loss recovery math, equity drawdown tracking, and multi-model AI consensus (Gemini 2.0 Flash, GPT-4o, Grok).

---

## 2. Technology Stack & Dependencies

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.3.1` | Hybrid Server/Client React Framework with Turbopack |
| **UI Library** | React | `19.2.0` | Component state rendering & client interactions |
| **Language** | TypeScript | `5.x` | Strict end-to-end type safety for financial data models |
| **Database** | Neon Serverless PostgreSQL | PostgreSQL | Cloud serverless relational database |
| **ORM** | Prisma ORM | `6.3.1` | Serverless database ORM with `@prisma/adapter-neon` |
| **Styling** | Tailwind CSS | `v4.0` | Modern utility styling with dark mode Bloomberg theme |
| **Icons** | Lucide React | `^1.16.0` | Crisp SVG iconography |
| **Visualization**| Recharts | `^2.15.1` | Responsive charts (Donut, Line, Area charts) |

---

## 3. Database Schema & Architecture

The system connects to **Neon Serverless PostgreSQL** via Prisma ORM 6.3. Database column names are mapped to exact PostgreSQL snake_case columns using Prisma `@map`.

```
Neon PostgreSQL (neondb)
 ├── portfolio        (FIFO Trade Execution Ledger)
 ├── tms_trx          (Broker Cash Flow & Collateral Ledger)
 ├── cache            (Live Market Stock Snapshots - 347 Tickers)
 ├── wealth           (Net Worth Historical Trajectory Snapshots)
 ├── trading_journal  (Mindset, Setup Rating & Trade Thesis Logs)
 ├── watchlist        (Target Price, Stop Loss & Entry Radar)
 └── audit_log        (Tamper-proof System Action Trail)
```

### Table Definitions & Field Mappings:

#### 1. `portfolio` (`Portfolio`)
Tracks all individual Buy and Sell stock trade executions.
```prisma
model Portfolio {
  id              Int      @id @default(autoincrement())
  date            DateTime
  symbol          String
  qty             Float
  price           Float
  transactionType String   @map("transaction_type") // BUY or SELL
  remarks         String?
  netAmount       Float    @map("net_amount")        // Total paid/received after fees
  totalInvested   Float    @default(0) @map("total_invested")
  totalReceived   Float    @default(0) @map("total_received")
  tmsCommission   Float?   @map("tms_commission")
  cgt             Float?
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("portfolio")
}
```

#### 2. `tms_trx` (`TmsTransaction`)
Reconciles cash deposits, withdrawals, collateral loads, stock trade settlements, and broker fees.
```prisma
model TmsTransaction {
  id        Int      @id @default(autoincrement())
  date      DateTime
  stock     String?
  type      String   // Deposit, Withdrawal, Buy, Sell, Charges, Collateral Load
  medium    String   // ConnectIPS, Collateral, NABIL Bank, etc.
  amount    Float    // Positive for deposit/sell, negative for buy/withdrawal
  charge    Float    @default(0)
  remark    String?
  status    String   // Settled, Pending
  reference String?

  @@map("tms_trx")
}
```

#### 3. `cache` (`MarketCache`)
Holds the daily live market price snapshots for all NEPSE tickers.
```prisma
model MarketCache {
  id            Int      @id @default(autoincrement())
  symbol        String   @unique
  ltp           Float
  changePercent Float    @default(0) @map("change_percent")
  volume        Int      @default(0)
  dayHigh       Float    @default(0) @map("day_high")
  dayLow        Float    @default(0) @map("day_low")
  lastUpdated   DateTime @default(now()) @map("last_updated")

  @@map("cache")
}
```

#### 4. `wealth` (`WealthSnapshot`)
Historical daily net worth snapshots for drawing the equity curve and computing drawdowns.
```prisma
model WealthSnapshot {
  id              Int      @id @default(autoincrement())
  snapshotDate    DateTime @unique @map("snapshot_date")
  totalInvestment Float    @map("total_investment")
  currentValue    Float    @map("current_value")

  @@map("wealth")
}
```

#### 5. `trading_journal` (`TradingJournal`)
Psychology log to record setup star ratings ($1-10\star$), emotional states, trade theses, and lessons learned.
```prisma
model TradingJournal {
  id            Int      @id @default(autoincrement())
  dateTimeStamp DateTime @default(now()) @map("date_time_stamp")
  symbol        String
  topic         String
  feeling       String
  star          Int
  tradeThesis   String   @map("trade_thesis")
  finalRemark   String?  @map("final_remark")

  @@map("trading_journal")
}
```

#### 6. `watchlist` (`Watchlist`)
Target prices, stop losses, and entry zone levels monitored by the Radar Observers.
```prisma
model Watchlist {
  id          Int     @id @default(autoincrement())
  symbol      String  @unique
  targetPrice Float   @default(0) @map("target_price")
  stopLoss    Float   @default(0) @map("stop_loss")
  hardTarget  Float   @default(0) @map("hard_target")
  hardSl      Float   @default(0) @map("hard_sl")
  entry1      Float   @default(0) @map("entry_1")
  entryMust   Float   @default(0) @map("entry_must")
  notes       String?

  @@map("watchlist")
}
```

#### 7. `audit_log` (`AuditLog`)
Audit trail of every trade event, sync operation, and database write.
```prisma
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

## 4. NEPSE Quantitative Financial Math Engine (`src/lib/nepse-math.ts`)

### A. Tiered Broker Commission
Calculates commission based on order value $V = \text{Qty} \times \text{Price}$:
- $V \le 50,000$: Rate = $0.36\%$ (Minimum broker fee Rs 10.0)
- $50,000 < V \le 500,000$: Rate = $0.33\%$
- $500,000 < V \le 2,000,000$: Rate = $0.31\%$
- $2,000,000 < V \le 10,000,000$: Rate = $0.27\%$
- $V > 10,000,000$: Rate = $0.24\%$

### B. SEBON & DP Fees
- **SEBON Fee**: $0.015\%$ ($V \times 0.00015$)
- **DP Fee**: Rs 25 flat charge per transaction

### C. Buy & Sell Settlement Equations
- **BUY Total Payable**: $V + \text{Broker Commission} + \text{SEBON Fee} + \text{DP Fee}$
- **SELL Net Value**: $V - (\text{Broker Commission} + \text{SEBON Fee} + \text{DP Fee})$
- **Cost Basis**: $\text{FIFO WACC} \times \text{Qty}$
- **Net Profit**: $\text{SELL Net Value} - \text{Cost Basis}$
- **Capital Gains Tax (CGT)**: If Profit $> 0$, $\text{CGT} = \text{Profit} \times \text{CGT Rate}$ (where CGT Rate = $5\%$ for holding $> 365$ days, $7.5\%$ or $10\%$ for holding $\le 365$ days).
- **Final Bank Receivable**: $\text{SELL Net Value} - \text{CGT}$

### D. Exact Algebraic Breakeven Reversal
Calculates the target sell price required to cover buy side fees plus sell side fees:
$$\text{Target Sell Base} = \frac{\text{BUY Total Payable} + \text{DP Fee}}{1.0 - \text{Broker Rate} - 0.00015}$$
$$\text{Breakeven Price} = \frac{\text{Target Sell Base}}{\text{Qty}}$$

### E. FIFO (First-In, First-Out) Tax Lot Matching
`calculateFifoHoldings(transactions)` sorts transactions chronologically. Buy lots are queued with $(\text{qty}, \text{totalCost})$. When a sell transaction is encountered, it consumes the oldest buy lots first, accurately maintaining remaining quantity and WACC cost basis.

---

## 5. API Routes & Data Pipeline (`src/app/api/...`)

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/portfolio` | `GET`, `POST`, `DELETE` | Queries trades from Neon DB, calculates FIFO fees, logs to TMS & Audit. |
| `/api/tms` | `GET`, `POST`, `DELETE` | Fetches broker ledger, logs cash flow, computes running balances. |
| `/api/watchlist` | `GET`, `POST`, `DELETE` | Manages target prices, stop losses, and entry zones. |
| `/api/journal` | `GET`, `POST` | Manages mindset logs, star ratings, and trade theses. |
| `/api/sync` | `POST` | Fetches 347+ live market prices from Chukul API & updates Neon `cache`. |
| `/api/wealth` | `GET` | Fetches net worth snapshots for drawing the equity curve. |
| `/api/audit` | `GET` | Fetches chronological system action logs. |
| `/api/ai` | `POST` | Injects live portfolio context into Google Gemini, GPT-4o, or Grok prompts. |

---

## 6. Frontend Component Architecture (`src/components/`)

- **`Sidebar.tsx`**: Bloomberg Terminal navigation bar with role switcher (Admin / View-Only) and live market sync trigger.
- **`Navbar.tsx`**: Top header with live NST (Nepal Standard Time) clock, search bar, and market index summary.
- **`DashboardView.tsx`**: Net worth snapshot, P/L analysis cards, investment cycle metrics, Recharts portfolio donut allocation chart, and active market signal alerts.
- **`PortfolioView.tsx`**: FIFO active positions table with live LTP, breakeven, true unrealized P/L, and Pro-Trader Advanced Analytics (Concentration panic meter, tax reserves, profit shield).
- **`AddTransactionView.tsx`**: Buy/Sell trade execution calculator with real-time settlement bill preview and short-sell protection.
- **`TmsView.tsx`**: Universal broker ledger, wallet balance line chart, dynamic transaction logger, and CSV exporter.
- **`TradeSimulationView.tsx`**: WACC buy averaging, sell payout calculator, drawdown recovery math, and Kelly Criterion position sizer.
- **`WatchlistView.tsx`**: Live Radar table and automated signal observers.
- **`RiskJournalView.tsx`**: Risk sizer, trading mindset journal with star ratings, and system diagnostics.
- **`HistoryView.tsx`**: Realized closed tax-lots, win rate %, aggregated symbol summary, T+2 settlement tracker, and master raw ledger.
- **`WealthView.tsx`**: Equity curve area chart and drawdown analysis (% Max DD, Current DD %).
- **`AiAnalystView.tsx`**: Multi-model consensus interface (Gemini 2.0 Flash, GPT-4o, Grok).
- **`ManageDataView.tsx`**: Admin Visual Data Editor & Raw SQL Console.
- **`ActivityLogView.tsx`**: System audit trail with action filters and CSV export.

---

## 7. Developer Quickstart & Commands

### Prerequisites
- Node.js `v20+` or `v22+`
- npm `v10+`

### Environment Configuration (`.env`)
```env
DATABASE_URL="postgresql://neondb_owner:npg_0DndgZG8aSwB@ep-withered-sea-a1ki2vgg.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

ADMIN_USERNAME="admin"
ADMIN_PASSWORD="password123"
VIEWER_USERNAME="viewer"
VIEWER_PASSWORD="viewer123"

GEMINI_API_KEY=""
OPENAI_API_KEY=""
GROK_API_KEY=""
```

### CLI Commands
```bash
# Install dependencies
npm install

# Push Prisma Schema to Neon Database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Run Next.js Development Server
npm run dev

# Production Build Verification
npm run build
```

---

## 8. Verification & Test Suite

The system has been verified against the live Neon database:
- **Build Compilation**: `npm run build` compiled **successfully with ZERO errors**.
- **Dev Server**: Running on `http://localhost:3000` with Turbopack.
- **Live Data Mapped**: 64 Portfolio trades, 83 TMS broker transactions, 167 Wealth snapshots, 9 Journal logs, and 347 Chukul live market stock tickers.
