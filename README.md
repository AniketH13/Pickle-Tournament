# 🏓 Pickleball Tournament Manager

A full-stack **Next.js + Prisma ORM** web application for managing round-robin pickleball tournaments with knockout promotion.

---

## 🚀 Quick Start

The project uses **SQLite via Prisma ORM** by default, requiring **zero external dependencies or Docker** to run locally.

### 1. Synchronize the Database

```bash
npx prisma db push
```

> This automatically creates the local SQLite database (`prisma/dev.db`) with all relational tables.

### 2. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📋 Features

- **Round Robin Groups** — Each group has exactly **3 teams** (3 matches per group)
- **Live Standings** — W/L/Point-differential updated after each match
- **3 Score Formats**: 11 Points | 15 Points (Rally) | 21 Points
- **Win-By-2 Rule** — Score validation enforced
- **Singles & Doubles** — Match type selection per match
- **Player Name Tracking** — Optional player names per match
- **Knockout Bracket** — Top 1 team from each group auto-promoted
- **Auto-advance** — Bracket winner auto-populates next round

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Home — tournament list
│   ├── tournament/[id]/page.tsx          # Tournament — groups + knockout
│   └── api/
│       ├── tournaments/route.ts          # GET list, POST create
│       ├── tournaments/[id]/route.ts     # GET tournament detail
│       ├── tournaments/[id]/advance/     # POST advance to knockout
│       ├── matches/[id]/route.ts         # PATCH/DELETE group match
│       └── knockout-matches/[id]/route.ts # PATCH/DELETE knockout match
├── components/
│   ├── CreateTournamentModal.tsx
│   ├── GroupView.tsx
│   ├── MatchModal.tsx
│   ├── StandingsTable.tsx
│   └── KnockoutBracket.tsx
└── lib/
    ├── prisma.ts      # Prisma singleton
    └── scoring.ts     # Validation & standings logic
```

---

## 🏆 Tournament Flow

```
1. Create Tournament → choose groups (2/3/4/6/8) + enter 3 team names each
2. Group Stage → click matches to enter Singles/Doubles results
3. Advance → click "Start Knockout Stage" when all group matches done  
4. Knockout → click bracket matches to enter results, winners auto-advance
5. Champion crowned! 🏆
```

---

## 🛠️ Environment Variables

Copy `.env` and update if needed:

```env
DATABASE_URL="postgresql://pickleball:pickleball123@localhost:5432/pickleball_tournament"
```

---

## 🐳 Docker Services

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5432 | user: `pickleball` / pass: `pickleball123` |
