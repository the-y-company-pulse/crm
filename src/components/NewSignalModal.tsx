"use client"

import { useMemo, useState } from "react"
import { RADAR_REGIONS, RADAR_STRENGTHS, RADARS, type RadarKey } from "@/lib/radar-constants"

type Row = Record<string, string>

type Props = {
  radar: RadarKey
  onClose: () => void
  onCreated: (result: { processed: number; failed: { bolag: string; error: string }[] }) => void
}

// Pasted column headers (case/accents-insensitive) → inbox field
const HEADER_ALIASES: Record<string, string> = {
  bolag: "bolag", foretag: "bolag", foretagsnamn: "bolag", namn: "bolag",
  typ: "typ", signaltyp: "typ",
  signal: "signal", beskrivning: "signal", handelse: "signal",
  orgnr: "orgnr", organisationsnummer: "orgnr",
  ort: "ort", stad: "ort",
  bransch: "bransch",
  webbplats: "webbplats", hemsida: "webbplats", webb: "webbplats", website: "webbplats",
  region: "region", lan: "region",
  anstallda: "anstallda",
  datum: "datum",
  kalla: "kalla",
  url: "url", lank: "url",
  styrka: "styrka",
  vinkel: "vinkel",
  kontakt: "kontakt", kontaktperson: "kontakt",
  kontaktroll: "kontaktRoll", roll: "kontaktRoll", titel: "kontaktRoll",
  telefon: "telefon",
  vaxel: "vaxel",
  epost: "epost", mejl: "epost", mail: "epost",
  epostmonster: "epostMonster",
  kontaktkalla: "kontaktKalla",
  kontaktkommentar: "kontaktKommentar", kommentar: "kontaktKommentar",
  bokslutsar: "bokslutsar", ar: "bokslutsar",
  omsattning: "omsattningMsek", omsattningmsek: "omsattningMsek", oms: "omsattningMsek",
  rorelseresultat: "rorelseresultatMsek", resultat: "rorelseresultatMsek", rorelseresultatmsek: "rorelseresultatMsek",
  rorelseresultatfg: "rorelseresultatFgMsek", resultatfg: "rorelseresultatFgMsek", foregaenderesultat: "rorelseresultatFgMsek",
  rorelsemarginal: "rorelsemarginal", marginal: "rorelsemarginal",
  soliditet: "soliditet",
  kassalikviditet: "kassalikviditet",
  chefer: "antalChefer", antalchefer: "antalChefer", ledare: "antalChefer",
  avstand: "avstandKm", avstandkm: "avstandKm",
}

// Numeric inbox fields and how to read Swedish-formatted numbers ("12,5", "1 234", "18 %")
const INT_FIELDS = ["bokslutsar", "antalChefer", "avstandKm"]
const FLOAT_FIELDS = [
  "omsattningMsek", "rorelseresultatMsek", "rorelseresultatFgMsek",
  "rorelsemarginal", "soliditet", "kassalikviditet",
]

const NUMBER_LABELS: Record<string, string> = {
  bokslutsar: "Bokslutsår", antalChefer: "Chefer", avstandKm: "Avstånd",
  omsattningMsek: "Omsättning", rorelseresultatMsek: "Rörelseresultat", rorelseresultatFgMsek: "Resultat fg",
  rorelsemarginal: "Marginal", soliditet: "Soliditet", kassalikviditet: "Kassalikviditet",
}

function toNumber(v: string) {
  const n = Number(v.replace(/\s|%|msek|mkr/gi, "").replace(/−/g, "-").replace(",", "."))
  return Number.isFinite(n) ? n : null
}

function toPayload(r: Row, radar: RadarKey) {
  const out: Record<string, string | number | null> = { radar }
  for (const [k, v] of Object.entries(r)) {
    if (!v?.trim()) continue
    if (INT_FIELDS.includes(k)) out[k] = toNumber(v) != null ? Math.round(toNumber(v)!) : null
    else if (FLOAT_FIELDS.includes(k)) out[k] = toNumber(v)
    else out[k] = v
  }
  return out
}

function headerKey(h: string) {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "")
}

function parsePaste(text: string): { rows: Row[]; unknown: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { rows: [], unknown: [] }
  const sep = lines[0].includes("\t") ? "\t" : ";"
  const headers = lines[0].split(sep).map((h) => h.trim())
  const fields = headers.map((h) => HEADER_ALIASES[headerKey(h)] ?? null)
  const unknown = headers.filter((_, i) => !fields[i])
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(sep)
    const row: Row = {}
    fields.forEach((f, i) => {
      if (f && cells[i]?.trim()) row[f] = cells[i].trim()
    })
    return row
  })
  return { rows, unknown }
}

function rowError(r: Row, radar: RadarKey) {
  if (!r.bolag) return "Bolag saknas"
  if (!r.typ) return "Signaltyp saknas"
  if (!RADARS[radar].types.includes(r.typ)) return `Okänd signaltyp "${r.typ}"`
  if (!r.signal) return "Signaltext saknas"
  for (const k of [...INT_FIELDS, ...FLOAT_FIELDS]) {
    if (r[k]?.trim() && toNumber(r[k]) == null) return `Ogiltigt tal i ${NUMBER_LABELS[k]}: "${r[k]}"`
  }
  return null
}

export default function NewSignalModal({ radar, onClose, onCreated }: Props) {
  const isLeadership = radar === "ledarskap"
  const types = RADARS[radar].types
  const EMPTY: Row = { typ: radar === "kultur" ? "Kraftig tillväxt" : "Passar profilen", region: "Västra Götaland" }
  const [mode, setMode] = useState<"single" | "paste">("single")
  const [form, setForm] = useState<Row>(EMPTY)
  const [showContact, setShowContact] = useState(false)
  const [paste, setPaste] = useState("")
  const [defaults, setDefaults] = useState<Row>({ typ: EMPTY.typ, kalla: "", region: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsed = useMemo(() => parsePaste(paste), [paste])
  // Defaults fill columns the pasted list doesn't have (e.g. typ/källa for a whole Gasell list)
  const pasteRows = useMemo(
    () =>
      parsed.rows.map((r) => {
        const merged = { ...r }
        for (const [k, v] of Object.entries(defaults)) if (v && !merged[k]) merged[k] = v
        return merged
      }),
    [parsed, defaults]
  )
  const pasteErrors = pasteRows.map((r) => rowError(r, radar))
  const validPasteRows = pasteRows.filter((_, i) => !pasteErrors[i])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  async function submit(rows: Row[]) {
    if (!rows.length || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/radar/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rows.map((r) => toPayload(r, radar)) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError("Kunde inte spara. Kontrollera fälten.")
        return
      }
      onCreated(data)
    } finally {
      setSubmitting(false)
    }
  }

  const singleError = rowError(form, radar)

  return (
    <>
      <div className="fixed inset-0 bg-ink-950/90 md:bg-ink-950/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 pointer-events-none">
        <div className="bg-ink-900 border-0 md:border md:border-white/[0.10] rounded-none md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl p-4 md:p-6 overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg md:text-xl text-white">Lägg till i {RADARS[radar].label}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white text-3xl leading-none px-2" aria-label="Stäng">
              ×
            </button>
          </div>

          <div className="flex gap-2 mb-5">
            {(["single", "paste"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  mode === m
                    ? "bg-neon text-ink-950 border-neon font-semibold"
                    : "bg-white/[0.03] text-white/60 border-white/[0.10] hover:border-white/30"
                }`}
              >
                {m === "single" ? "En signal" : "Klistra in lista"}
              </button>
            ))}
          </div>

          {mode === "single" ? (
            <div className="flex flex-col gap-3">
              <Field label="Bolag *" hint="Matchas mot befintliga företag på org.nr och namn">
                <input className="input" value={form.bolag ?? ""} onChange={set("bolag")} autoFocus />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Signaltyp *">
                  <select className="input" value={form.typ ?? ""} onChange={set("typ")}>
                    {types.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Styrka">
                  <select className="input" value={form.styrka ?? ""} onChange={set("styrka")}>
                    <option value="">—</option>
                    {RADAR_STRENGTHS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={radar !== "kultur" ? "Varför passar de? *" : "Vad har hänt? *"}>
                <textarea
                  className="input min-h-[80px] text-sm"
                  value={form.signal ?? ""}
                  onChange={set("signal")}
                  placeholder={radar !== "kultur" ? "Varför passar de? T.ex. 'Lönsamt familjeföretag, ca 15 chefer, växer.'" : "1–2 meningar, t.ex. 'Gasell 2026, +240 % på tre år.'"}
                />
              </Field>
              <Field label="Vinkel">
                <input className="input" value={form.vinkel ?? ""} onChange={set("vinkel")} placeholder="Förslag på ingång" />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Källa"><input className="input" value={form.kalla ?? ""} onChange={set("kalla")} placeholder="t.ex. DI Gasell" /></Field>
                <Field label="Länk"><input className="input" value={form.url ?? ""} onChange={set("url")} placeholder="https://..." /></Field>
                <Field label="Datum (ÅÅÅÅ-MM)"><input className="input" value={form.datum ?? ""} onChange={set("datum")} placeholder="2026-11" /></Field>
                <Field label="Org.nr"><input className="input" value={form.orgnr ?? ""} onChange={set("orgnr")} placeholder="556012-5790" /></Field>
                <Field label="Ort"><input className="input" value={form.ort ?? ""} onChange={set("ort")} /></Field>
                <Field label="Region">
                  <select className="input" value={form.region ?? ""} onChange={set("region")}>
                    {RADAR_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Bransch"><input className="input" value={form.bransch ?? ""} onChange={set("bransch")} /></Field>
                <Field label="Webbplats"><input className="input" value={form.webbplats ?? ""} onChange={set("webbplats")} placeholder="www.bolag.se" /></Field>
                <Field label="Anställda"><input className="input" value={form.anstallda ?? ""} onChange={set("anstallda")} placeholder="t.ex. 120" /></Field>
              </div>

              {isLeadership && (
                <>
                  <div className="text-[11px] uppercase tracking-wider text-white/40 mt-2">Ekonomi (senaste årsredovisningen)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Field label="Bokslutsår"><input className="input" value={form.bokslutsar ?? ""} onChange={set("bokslutsar")} placeholder="2025" /></Field>
                    <Field label="Omsättning MSEK"><input className="input" value={form.omsattningMsek ?? ""} onChange={set("omsattningMsek")} /></Field>
                    <Field label="Rörelseres. MSEK"><input className="input" value={form.rorelseresultatMsek ?? ""} onChange={set("rorelseresultatMsek")} /></Field>
                    <Field label="Föreg. år MSEK"><input className="input" value={form.rorelseresultatFgMsek ?? ""} onChange={set("rorelseresultatFgMsek")} /></Field>
                    <Field label="Soliditet %"><input className="input" value={form.soliditet ?? ""} onChange={set("soliditet")} /></Field>
                    <Field label="Kassalikv. %"><input className="input" value={form.kassalikviditet ?? ""} onChange={set("kassalikviditet")} /></Field>
                    <Field label="Antal chefer"><input className="input" value={form.antalChefer ?? ""} onChange={set("antalChefer")} /></Field>
                    <Field label="Avstånd km"><input className="input" value={form.avstandKm ?? ""} onChange={set("avstandKm")} placeholder="räknas ut" /></Field>
                  </div>
                  <p className="text-[11px] text-white/35 -mt-1">Ekonomin sparas bara om bokslutsår är ifyllt. Avståndet räknas ut från orten om det lämnas tomt.</p>
                </>
              )}

              <button onClick={() => setShowContact(!showContact)} className="text-sm text-neon hover:underline self-start mt-1">
                {showContact ? "− Dölj kontaktperson" : "+ Lägg till kontaktperson"}
              </button>
              {showContact && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Namn"><input className="input" value={form.kontakt ?? ""} onChange={set("kontakt")} /></Field>
                  <Field label="Roll"><input className="input" value={form.kontaktRoll ?? ""} onChange={set("kontaktRoll")} placeholder="VD" /></Field>
                  <Field label="Telefon"><input className="input" value={form.telefon ?? ""} onChange={set("telefon")} /></Field>
                  <Field label="E-post"><input className="input" value={form.epost ?? ""} onChange={set("epost")} /></Field>
                  <Field label="Växel"><input className="input" value={form.vaxel ?? ""} onChange={set("vaxel")} /></Field>
                  <Field label="Var uppgiften står (länk)"><input className="input" value={form.kontaktKalla ?? ""} onChange={set("kontaktKalla")} /></Field>
                </div>
              )}

              {error && <div className="text-sm text-[rgb(var(--c-lost))]">{error}</div>}
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={onClose} className="btn text-sm py-2">Avbryt</button>
                <button onClick={() => submit([form])} disabled={!!singleError || submitting} className="btn btn-primary text-sm py-2 disabled:opacity-40">
                  {submitting ? "Sparar..." : "Spara signal"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-white/60">
                Klistra in från Excel eller Google Sheets med rubrikrad. Kolumner som känns igen:
                <span className="text-white/80"> Bolag, Typ, Signal, Org.nr, Ort, Region, Bransch, Webbplats, Anställda, Datum, Källa, Länk, Styrka, Vinkel, Kontakt, Roll, Telefon, Växel, E-post</span>
                {isLeadership && <span className="text-white/80">, Bokslutsår, Omsättning, Rörelseresultat, Resultat fg, Marginal, Soliditet, Kassalikviditet, Chefer</span>}.
                Bolag och Signal krävs.
              </p>
              <textarea
                className="input min-h-[160px] text-xs font-mono"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder={"Bolag\tOrt\tSignal\nExempel AB\tBorås\tGasell 2026, +210 % på tre år"}
                autoFocus
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Typ om kolumn saknas">
                  <select className="input" value={defaults.typ} onChange={(e) => setDefaults({ ...defaults, typ: e.target.value })}>
                    {types.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Källa om kolumn saknas">
                  <input className="input" value={defaults.kalla} onChange={(e) => setDefaults({ ...defaults, kalla: e.target.value })} placeholder="t.ex. DI Gasell 2026" />
                </Field>
                <Field label="Region om kolumn saknas">
                  <select className="input" value={defaults.region} onChange={(e) => setDefaults({ ...defaults, region: e.target.value })}>
                    <option value="">—</option>
                    {RADAR_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              </div>

              {parsed.unknown.length > 0 && (
                <div className="text-xs text-white/50">Ignoreras (okänd kolumn): {parsed.unknown.join(", ")}</div>
              )}

              {pasteRows.length > 0 && (
                <div className="rounded-lg border border-white/[0.08] max-h-56 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/[0.04] sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-white/60 font-semibold">Bolag</th>
                        <th className="text-left px-3 py-2 text-white/60 font-semibold">Typ</th>
                        <th className="text-left px-3 py-2 text-white/60 font-semibold">Signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pasteRows.map((r, i) => (
                        <tr key={i} className="border-t border-white/[0.05]">
                          <td className="px-3 py-1.5 text-white/85">{r.bolag ?? "—"}</td>
                          <td className="px-3 py-1.5 text-white/60">{r.typ ?? "—"}</td>
                          <td className="px-3 py-1.5">
                            {pasteErrors[i] ? (
                              <span className="text-[rgb(var(--c-lost))]">{pasteErrors[i]}</span>
                            ) : (
                              <span className="text-white/70 line-clamp-1">{r.signal}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {error && <div className="text-sm text-[rgb(var(--c-lost))]">{error}</div>}
              <div className="flex gap-2 justify-end items-center mt-2">
                {pasteRows.length > 0 && (
                  <span className="text-xs text-white/50 mr-auto">
                    {validPasteRows.length} av {pasteRows.length} rader kan läggas till
                  </span>
                )}
                <button onClick={onClose} className="btn text-sm py-2">Avbryt</button>
                <button onClick={() => submit(validPasteRows)} disabled={!validPasteRows.length || submitting} className="btn btn-primary text-sm py-2 disabled:opacity-40">
                  {submitting ? "Sparar..." : `Lägg till ${validPasteRows.length || ""}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-white/35 mt-1">{hint}</p>}
    </div>
  )
}
