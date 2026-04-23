# Y CRM

Ett enkelt, eget CRM för The Y Company. Pipedrive-ersättare med drag-and-drop kanban, färgkodade ägare och aktivitetslogg per affär.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Prisma · Postgres (Supabase) · @dnd-kit
**Design:** Mörkt navy-tema med neon-accent (matchar The Y Analytics). Bricolage Grotesque för rubriker, DM Sans för brödtext.
**Tänkt drift:** Vercel + Supabase (gratis-tier räcker för en två-personers pipeline)

---

## Snabbstart (lokalt)

### 1. Installera

```bash
npm install
```

### 2. Sätt upp Supabase

1. Gå till [supabase.com](https://supabase.com) och skapa ett nytt projekt (gratis)
2. Vänta tills databasen är redo (~2 min)
3. Gå till **Project Settings → Database → Connection string**
4. Kopiera "URI" (med ditt lösenord ifyllt)

### 3. Konfigurera miljövariabler

```bash
cp .env.example .env
```

Klistra in din Supabase-URL i både `DATABASE_URL` och `DIRECT_URL`.

### 4. Skapa tabellerna och seeda data

```bash
npx prisma db push      # skapar tabellerna i Supabase
npm run seed            # seedar users + stages (och deals om CSV finns)
```

### 5. Starta dev-servern

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

---

## Pipedrive-data (medskickad)

Mappen `data/` innehåller din senaste Pipedrive-export:

- `pipedrive-deals.csv` (149 affärer)
- `pipedrive-activities.csv` (667 aktiviteter)
- `pipedrive-notes.csv` (126 anteckningar)
- `pipedrive-people.csv` (160 personer för e-post/telefon)

Seed-skriptet importerar **all historik** automatiskt:

- Affärer ägda av Kristian Andersson **filtreras bort** (sätts via `SKIP_OWNERS` i `prisma/seed.ts`)
- Vunna affärer hamnar i stage "Vunnen", förlorade i "Förlorad"
- Pipedrives aktivitetstyper mappas till våra: `Telefonsamtal → call`, `Möte → meeting`, `E-post → email`, övriga → `note`
- Anteckningar importeras som `note`-aktiviteter med HTML-stripping
- E-post och telefon från `people.csv` matchas in på respektive deal via kontaktpersonens ID

Vill du köra om importen senare (t.ex. efter ny export från Pipedrive): byt CSV-filerna i `data/` och kör `npm run seed`. Skriptet wipear deals + activities först, så det blir en clean re-import.

---

## Deploy till Vercel + crm.ycompany.se

1. Pusha repot till GitHub
2. På [vercel.com](https://vercel.com): Add New → Project → välj repot
3. Lägg till miljövariablerna `DATABASE_URL` och `DIRECT_URL` (samma som lokalt)
4. Deploy
5. Lägg till custom domain: **Settings → Domains → Add `crm.ycompany.se`**
6. På Wix DNS (där `ycompany.se` ligger): lägg till en CNAME-post för `crm` som pekar på `cname.vercel-dns.com`

---

## Projektstruktur

```
y-crm/
├── prisma/
│   ├── schema.prisma         # User, Stage, Deal, Activity
│   └── seed.ts               # Seedar users/stages + importerar Pipedrive CSV
├── src/
│   ├── app/
│   │   ├── page.tsx          # Server-renderad startsida (kanban)
│   │   ├── layout.tsx
│   │   ├── globals.css       # Tailwind + Y Company-branding
│   │   └── api/
│   │       ├── deals/        # GET (lista) · POST (ny)
│   │       ├── deals/[id]/   # PATCH (flytta/redigera) · DELETE
│   │       └── deals/[id]/activities/  # POST (logga aktivitet)
│   ├── components/
│   │   ├── Kanban.tsx        # Huvudkomponenten — DndContext + state
│   │   ├── StageColumn.tsx   # En kolumn (droppable)
│   │   ├── DealCard.tsx      # Ett kort (draggable)
│   │   ├── DealDetail.tsx    # Sidopanel med aktivitetslogg
│   │   ├── Toolbar.tsx       # Topp-bar med filter + ny affär
│   │   └── NewDealModal.tsx
│   └── lib/
│       ├── prisma.ts         # Prisma-klient (singleton)
│       └── types.ts          # Delade typer
└── tailwind.config.ts        # Y Company-färger (neon, navy, steel...)
```

---

## Roadmap (när vi vill ta nästa steg)

**v0.3 — Statistik / Försäljningsdashboard (BYGGD)** ✓
Sidan `/statistik` visar YTD vs föregående år, månadsvis stapeldiagram med mållinje, kvartalsfördelning och per-konsult-uppdelning. Mål sätts för nu via `POST /api/targets` (UI för mål-editor är nästa steg).

**v0.4 — Mål-editor i UI**
En modal eller egen sida (`/mal`) där man kan sätta/ändra årsmål och månadsmål per konsult och företag. API:t (`/api/targets`) finns redan.

**v0.5 — CRUD-knappar i UI:t**
Redigera + ta bort affär. "Markera vunnen / förlorad"-knapp i DealDetail som sätter status och `wonAt`/`lostAt` automatiskt. Sökfält i toolbaren.

**v0.6 — Auth**
Lägg till NextAuth med Google OAuth så ni loggar in med era ycompany.se-konton istället för "Inloggad: …"-dropdown.

**v0.7 — Mailintegration**
Forwarda mail till `inbox+<dealId>@ycompany.se` och låt en webhook skapa automatiska Activity-poster. Eller: koppla mot Gmail API.

**v0.8 — Påminnelser & nästa steg**
`Activity` får ett `dueAt` fält. Visa "förfallna" och "kommande" aktiviteter i toolbar. Daglig sammanställning via mail.

**v0.9 — Y Pulse-koppling**
Koppla Deal → Organization i Y Pulse. När en kulturanalys finns för företaget, visa länk i DealDetail.

---

## Vanliga kommandon

```bash
npm run dev              # Starta lokalt
npm run build            # Bygg produktion
npm run db:push          # Synka schema → Supabase
npm run db:studio        # Öppna Prisma Studio (visuell DB-browser)
npm run seed             # Seeda users/stages + importera CSV
```

---

Byggt för Nicklas, för att slippa 210 USD/år på Pipedrive och äga sin egen affärsdata.
