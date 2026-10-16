# Kulturradarn: veckoskörd → Y CRM

Underlag för att skriva om den schemalagda uppgiften "Kulturradarn veckoskörd" i claude.ai så att den skriver till CRM:ets Supabase-databas i stället för artifacten.

## Princip

Skörden **lägger bara in nya rader** i tabellen `radar_inbox`. Den gör aldrig `UPDATE` eller `DELETE` och skriver aldrig till andra tabeller.

CRM:et läser inkorgen nästa gång någon öppnar Radar-vyn, eller när någon klickar "Läs in nya signaler". Då händer följande:

- **Bolaget matchas** mot befintliga företag: först på organisationsnummer, sedan på namn. Ett befintligt bolag får en ny signal. Det skapas aldrig en dubblett.
- **Kontaktpersonen** läggs in eller kompletteras. Fält som redan har ett värde skrivs aldrig över.
- **En signal skapas** med status `Ny`.
- **Samma händelse rapporterad igen** (samma bolag, signaltyp och käll-URL) uppdaterar bara signaltexten. Status ändras aldrig.

## Tabell: `public.radar_inbox`

| Kolumn | Typ | Obligatorisk | Innehåll |
|---|---|---|---|
| `bolag` | text | **ja** | Bolagsnamn |
| `typ` | text | **ja** | Exakt en av: `Kulturskav i media`, `Sammanslagning`, `Kraftig tillväxt`, `Ny VD i ägarlett bolag`, `Generationsskifte`, `Första HR-chef`, `Ny ägare / PE` |
| `signal` | text | **ja** | 1–2 meningar om vad som hänt |
| `slug` | text | | Bolagsnamnet som slug, t.ex. `xl-bygg-herrljunga` |
| `orgnr` | text | | Organisationsnummer `XXXXXX-XXXX`. **Viktigaste fältet för dubblettskydd.** Ange det när det går att hitta i bolagets egna publiceringar eller i årsredovisningen |
| `ort`, `bransch` | text | | |
| `region` | text | | `Västra Götaland` / `Övriga Sverige` / `Okänd` |
| `anstallda` | text | | Siffra som text eller `okänt` |
| `datum` | text | | `ÅÅÅÅ-MM` för händelsen |
| `kalla`, `url` | text | | Källans namn och länk |
| `styrka` | text | | `Hög` / `Medel` / `Låg` |
| `vinkel` | text | | Förslag på ingång |
| `kontakt`, `kontakt_roll` | text | | Rekommenderad person och roll. Lämna tomt om ingen hittas |
| `telefon` | text | | Personens publicerade direktnummer eller mobil |
| `vaxel` | text | | Bolagets växel |
| `epost` | text | | Publicerad adress, personlig eller allmän |
| `epost_monster` | text | | Mönster, t.ex. `fornamn.efternamn@bolag.se`. Inte en adress |
| `kontakt_kalla` | text | | URL där kontaktuppgiften står |
| `kontakt_kommentar` | text | | Förbehåll |
| `ambition`, `drivkraft` | integer 1–3 | | Glappanalys, när den byggs |
| `glapp_motivering` | text | | Kort motivering till glappoängen |
| `tillagd` | text | | `ÅÅÅÅ-MM-DD` |

Kolumnerna `id`, `created_at`, `processed_at` och `process_error` sätts av databasen och CRM:et. Skörden ska inte ange dem.

Det finns **ingen** `status`-kolumn. Status sätts bara av människor i CRM:et.

## Läs befintligt först (steg 1 i skörden)

```sql
-- Bolag som redan finns i CRM:et, med deras signaler
select c.name, c."orgNr", s.type, s."sourceUrl", s."createdAt"::date
from companies c
join signals s on s."companyId" = c.id
order by s."createdAt" desc;

-- Rader som skörden lagt in men som CRM:et inte bearbetat ännu
select bolag, typ, url, process_error from radar_inbox where processed_at is null;
```

## Skriv nya rader (steg 4 i skörden)

```sql
insert into radar_inbox
  (slug, typ, bolag, orgnr, ort, bransch, region, anstallda, signal, datum, kalla, url,
   styrka, vinkel, kontakt, kontakt_roll, telefon, vaxel, epost, epost_monster,
   kontakt_kalla, kontakt_kommentar, tillagd)
values
  ('xl-bygg-herrljunga', 'Generationsskifte', 'XL-BYGG Herrljunga & Vårgårda', null,
   'Herrljunga/Vårgårda', 'Bygghandel', 'Västra Götaland', 'okänt',
   'Fjärde generationen tar vid; ny VD, vice VD och ny organisation.', '2026-03',
   'Mynewsdesk', 'https://...', 'Hög', 'Ny generation + ny organisation',
   'Patrik Samuelsson', 'VD', '0322-65 10 11', '0513-250 50', 'info@herrljunga.xlbygg.se', null,
   'https://www.xlbygg.se/herrljunga', 'Vice VD Maria Samuelsson.', '2026-10-19');
```

Rader med ogiltig `typ` eller tomt `bolag` eller `signal` bearbetas inte. De syns som fel i Radar-vyn.

## Regler som följer med oförändrade

- Kontaktpersonsreglerna i överlämningen (avsnitt 2) gäller: vem som ska kontaktas, telefon före mejl, endast uppgifter som bolaget själv publicerat, aldrig upplysningssajter och aldrig gissade adresser.
- Skörden får bara göra `INSERT INTO radar_inbox` och `SELECT`. Den får aldrig göra `UPDATE`, `DELETE`, ändra tabeller eller köra migreringar.
