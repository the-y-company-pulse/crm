// Y CRM — seed script (full Pipedrive history import)
// Usage: npm run seed
//
// Reads CSVs from ./data/ and seeds:
//   - users (Nicklas, Malin)
//   - stages (6 active + Vunnen + Förlorad)
//   - all deals owned by Nicklas (skips Kristian Andersson)
//   - all activities and notes linked to those deals
//
// Re-runs are safe for users/stages (upsert). Deals are wiped and re-imported
// on each run to avoid duplicates — comment out `wipeDeals()` if you've added
// new activities in the app since the last import.

import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

// --- Configuration ---
const SKIP_OWNERS = new Set(["Kristian Andersson"]);

const USERS = [
  { email: "nicklas@ycompany.se", name: "Nicklas", color: "#deff00", initial: "N" },
  { email: "malin@ycompany.se", name: "Malin", color: "#1D9E75", initial: "M" },
];

const STAGES = [
  { name: "Kontakt tagen", order: 1, status: null },
  { name: "Behov identifierat", order: 2, status: null },
  { name: "Möte / Presentation bokat", order: 3, status: null },
  { name: "Offert lämnad", order: 4, status: null },
  { name: "Senarelagd", order: 5, status: null },
  { name: "Väntar besked", order: 6, status: null },
  { name: "Vunnen", order: 7, status: "won" },
  { name: "Förlorad", order: 8, status: "lost" },
];

// Maps Pipedrive owner names → our user email. Pipedrive may use full or short names.
const OWNER_TO_EMAIL: Record<string, string> = {
  "Nicklas Gustafsson": "nicklas@ycompany.se",
  "Nicklas": "nicklas@ycompany.se",
  "Malin": "malin@ycompany.se",
};

// Maps Pipedrive activity type → our schema type
const ACTIVITY_TYPE: Record<string, "note" | "call" | "email" | "meeting"> = {
  "Telefonsamtal": "call",
  "Möte": "meeting",
  "E-post": "email",
  "Uppgift": "note",
  "Deadline": "note",
  "Lunch": "meeting",
};

// --- Helpers ---
function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

function stripHtml(s: string): string {
  if (!s) return "";
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function parseSwedishDate(s: string): Date | null {
  if (!s) return null;
  // Pipedrive format: "2025-04-22 07:14:30" or "2025-04-22 07:14" or "2025-04-22".
  // We treat the timestamp as UTC for consistency with analytics queries
  // (which use getUTCMonth/UTC-bucketing). This is an approximation —
  // a deal won at 23:30 Swedish time near a month boundary may shift,
  // but during normal business hours bucketing is reliable.
  let iso: string;
  if (s.includes(" ")) {
    // Replace space with T and add Z
    iso = s.replace(" ", "T") + "Z";
  } else {
    iso = s + "T00:00:00Z";
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function loadCsv(filename: string): Record<string, string>[] {
  const path = resolve(process.cwd(), "data", filename);
  if (!existsSync(path)) {
    console.log(`  (skipping ${filename} — not found)`);
    return [];
  }
  const txt = readFileSync(path, "utf-8");
  return parse(txt, { columns: true, skip_empty_lines: true, trim: true, bom: true });
}

async function wipeDeals() {
  // Activities have onDelete: Cascade so they go with the deals
  await prisma.deal.deleteMany();
}

// --- Main ---
async function main() {
  console.log("\n→ Seeding users…");
  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, color: u.color, initial: u.initial },
        create: u,
      })
    )
  );
  const usersByEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  console.log(`  ✓ ${users.length} users`);

  console.log("→ Seeding stages…");
  const stages = await Promise.all(
    STAGES.map((s) =>
      prisma.stage.upsert({
        where: { order: s.order },
        update: { name: s.name, status: s.status },
        create: s,
      })
    )
  );
  const stagesByName = Object.fromEntries(stages.map((s) => [s.name, s]));
  const wonStage = stagesByName["Vunnen"];
  const lostStage = stagesByName["Förlorad"];
  console.log(`  ✓ ${stages.length} stages`);

  // --- Load Pipedrive CSVs ---
  console.log("\n→ Loading Pipedrive CSVs…");
  const dealRows = loadCsv("pipedrive-deals.csv");
  const activityRows = loadCsv("pipedrive-activities.csv");
  const noteRows = loadCsv("pipedrive-notes.csv");
  const peopleRows = loadCsv("pipedrive-people.csv");
  console.log(`  Deals: ${dealRows.length} · Activities: ${activityRows.length} · Notes: ${noteRows.length} · People: ${peopleRows.length}`);

  if (dealRows.length === 0) {
    console.log("\n  No deals to import. Drop pipedrive-deals.csv into data/ and re-run.\n");
    return;
  }

  // Build a person → contact lookup (for email/phone enrichment)
  const peopleById: Record<string, { email: string; phone: string }> = {};
  for (const p of peopleRows) {
    const id = pick(p, ["ID"]);
    if (!id) continue;
    peopleById[id] = {
      email: pick(p, ["E-post - Arbete", "E-post - Hem", "E-post - Annan"]),
      phone: pick(p, ["Telefon - Mobil", "Telefon - Arbete", "Telefon - Hem", "Telefon - Annan"]),
    };
  }

  // --- Wipe and re-import deals ---
  console.log("\n→ Wiping existing deals (and their activities)…");
  await wipeDeals();
  console.log("  ✓ Cleared");

  console.log("\n→ Importing deals…");
  const defaultOwner = usersByEmail["nicklas@ycompany.se"];
  const dealIdMap: Record<string, string> = {}; // Pipedrive ID → our cuid
  let imported = 0, skippedKristian = 0, skippedNoTitle = 0;

  for (const row of dealRows) {
    const ownerName = pick(row, ["Ägare", "Owner"]);
    if (SKIP_OWNERS.has(ownerName)) { skippedKristian++; continue; }

    const title = pick(row, ["Namn", "Title", "Deal title"]);
    if (!title) { skippedNoTitle++; continue; }

    const pipedriveId = pick(row, ["ID"]);
    const status = pick(row, ["Status"]);
    const stageName = pick(row, ["Fas", "Stage"]);

    // Won/lost deals go to the terminal stage; otherwise use the listed stage
    let stage;
    let dealStatus: "open" | "won" | "lost" = "open";
    if (status === "Vunnen") { stage = wonStage; dealStatus = "won"; }
    else if (status === "Förlorad") { stage = lostStage; dealStatus = "lost"; }
    else { stage = stagesByName[stageName] ?? stagesByName["Kontakt tagen"]; }

    const ownerEmail = OWNER_TO_EMAIL[ownerName];
    const owner = (ownerEmail && usersByEmail[ownerEmail]) ?? defaultOwner;

    const valueStr = pick(row, ["Värde", "Value"]);
    const value = Math.round(parseFloat(valueStr.replace(/[^\d.,-]/g, "").replace(",", ".")) || 0);

    const company = pick(row, ["Organisation", "Organization"]);
    const contact = pick(row, ["Kontaktperson", "Person"]);
    const contactId = pick(row, ["Kontaktpersonens id"]);
    const person = contactId ? peopleById[contactId] : undefined;

    const wonAtStr = pick(row, ["Tidpunkt för vunnen affär"]);
    const lostAtStr = pick(row, ["Tidpunkt för förlorad affär"]);
    const expectedStr = pick(row, ["Förväntat datum för avslut"]);

    const created = await prisma.deal.create({
      data: {
        title,
        company: company || null,
        contact: contact || null,
        email: person?.email || null,
        phone: person?.phone || null,
        value,
        stageId: stage.id,
        ownerId: owner.id,
        status: dealStatus,
        source: "pipedrive-import",
        sourceId: pipedriveId || null,
        wonAt: wonAtStr ? parseSwedishDate(wonAtStr) : null,
        lostAt: lostAtStr ? parseSwedishDate(lostAtStr) : null,
        expectedCloseDate: expectedStr ? parseSwedishDate(expectedStr) : null,
      },
    });
    if (pipedriveId) dealIdMap[pipedriveId] = created.id;
    imported++;
  }
  console.log(`  ✓ ${imported} deals imported (${skippedKristian} Kristian-deals skipped, ${skippedNoTitle} without title)`);

  // --- Import activities ---
  console.log("\n→ Importing activities…");
  let actImported = 0, actSkipped = 0;
  for (const row of activityRows) {
    const dealPipedriveId = pick(row, ["Affärs-id", "Deal ID"]);
    if (!dealPipedriveId) { actSkipped++; continue; }
    const dealId = dealIdMap[dealPipedriveId];
    if (!dealId) { actSkipped++; continue; } // belonged to Kristian or no matching deal

    const typeRaw = pick(row, ["Typ", "Type"]);
    const type = ACTIVITY_TYPE[typeRaw] ?? "note";
    const subject = pick(row, ["Ämne", "Subject"]);
    const note = stripHtml(pick(row, ["Anteckning", "Note"]));
    const content = [subject, note].filter(Boolean).join(subject && note ? " — " : "");
    if (!content) { actSkipped++; continue; }

    const occurredAtStr = pick(row, ["Markerad som färdig klockan", "Klart senast den", "Lagts till kl."]);
    const occurredAt = parseSwedishDate(occurredAtStr);

    await prisma.activity.create({
      data: {
        type,
        content,
        occurredAt,
        dealId,
        userId: defaultOwner.id, // Default to Nicklas (Pipedrive owner field varies)
      },
    });
    actImported++;
  }
  console.log(`  ✓ ${actImported} activities imported (${actSkipped} skipped — orphaned or empty)`);

  // --- Import notes ---
  console.log("\n→ Importing notes…");
  let notesImported = 0, notesSkipped = 0;
  for (const row of noteRows) {
    const dealPipedriveId = pick(row, ["Affärs-id", "Deal ID"]);
    if (!dealPipedriveId) { notesSkipped++; continue; }
    const dealId = dealIdMap[dealPipedriveId];
    if (!dealId) { notesSkipped++; continue; }

    const content = stripHtml(pick(row, ["Innehåll", "Content"]));
    if (!content) { notesSkipped++; continue; }

    const occurredAt = parseSwedishDate(pick(row, ["Lagts till kl.", "Added"]));

    await prisma.activity.create({
      data: {
        type: "note",
        content,
        occurredAt,
        dealId,
        userId: defaultOwner.id,
      },
    });
    notesImported++;
  }
  console.log(`  ✓ ${notesImported} notes imported (${notesSkipped} skipped — orphaned)`);

  // --- Final summary ---
  const dealCount = await prisma.deal.count();
  const openCount = await prisma.deal.count({ where: { status: "open" } });
  const activityCount = await prisma.activity.count();
  console.log(`\n✓ Done. ${dealCount} deals (${openCount} open) and ${activityCount} activities now in Y CRM.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
