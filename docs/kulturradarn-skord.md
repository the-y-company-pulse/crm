# Kulturradarn: veckoskörd → Y CRM

Underlag för att skriva om den schemalagda uppgiften "Kulturradarn veckoskörd" i claude.ai så att den skriver till CRM:ets Supabase-databas i stället för artifacten.

## Princip

Skörden **lägger bara in nya rader** i tabellen `radar_inbox`. Den gör aldrig `UPDATE` eller `DELETE` och skriver aldrig till andra tabeller.

CRM:et läser inkorgen nästa gång någon öppnar Radar-vyn, eller när någon klickar "Läs in nya signaler". Då händer följande:

- **Bolaget matchas** mot befintliga företag: först på organisationsnummer, sedan på namn. Ett befintligt bolag får en ny signal. Det skapas aldrig en dubblett.
- **Kontaktpersonen** läggs in eller kompletteras. Fält som redan har ett värde skrivs aldrig över.
- **En signal skapas** med status `Ny`.
- **Samma händelse rapporterad igen** (samma bolag, signaltyp och käll-URL) uppdaterar bara signaltexten. Status ändras aldrig.

## Geografisk avgränsning

Sök **bara** efter bolag med huvudkontor eller tydlig verksamhet i:

- **Västra Götaland**, inklusive Bohuslän, Göteborgsregionen, Sjuhärad, Skaraborg, Fyrbodal och Dalsland
- **Halland**, t.ex. Kungsbacka, Varberg, Falkenberg, Halmstad och Laholm
- **Jönköpings län**, t.ex. Jönköping, Huskvarna, Värnamo, Gislaved och Nässjö

Ersätter tidigare upplägget med "Västra Götaland först, i andra hand övriga Sverige". Bolag i till exempel Stockholm, Skåne, Dalarna eller Norrland ska inte skördas.

Gränsfall: ett bolag med huvudkontor utanför området men ett större kontor inom det tas med, med kontorsorten i `ort` och en kommentar i `vinkel`. Bolag utanför området som ändå hamnar i inkorgen döljs som standard i Radar-vyn.

## Signaltyper

| typ | Vad det betyder | Bästa läge att höra av sig | Källor |
|---|---|---|---|
| `Ny strategi / nya mål` | Ny tillväxtplan, nya finansiella mål (t.ex. "fördubbla till 2030"), ny affärsmodell eller nya marknader. **Kärnan i erbjudandet:** när målen ändras måste kulturen följa med | Direkt | VD-ord i årsredovisning, pressmeddelanden, VD-intervjuer. Sätt gärna `ambition` (1–3) |
| `Tidigare kontakt på ny post` | Någon vi redan känner (se frågan nedan) har blivit VD, HR-chef eller ledningsgruppsmedlem på ett nytt bolag. **Varmaste ingången** | Inom 1–3 månader | Pressmeddelanden om utnämningar, Mynewsdesk, Cision, branschpress |
| `Kulturskav i media` | Skav i ledningen, chefsavgångar, dålig arbetsmiljö, misslyckad omorganisation | Bevaka, ofta efter att det lagt sig | Media |
| `Sammanslagning` | Fusion eller förvärv slutfört för 6–12 månader sedan, två kulturer ska integreras | 6–12 månader efter | Pressmeddelanden, MFN |
| `Förvärvar bolag` | **Köparen** som integrerar flera bolag på kort tid (2+ förvärv på 18 månader). Oftast den som betalar | Efter andra förvärvet | Pressmeddelanden, MFN |
| `Kraftig tillväxt` | Omsättning ungefär fördubblad på cirka 3 år, Gasell-listor | Direkt | Bolagens egna Gasell-inlägg, branschpress |
| `Ny VD i ägarlett bolag` | Tidigare ägar- eller grundarlett bolag som rekryterat extern VD | 3–9 månader efter tillträdet | Pressmeddelanden |
| `Generationsskifte` | Nästa generation tar över ett familjeföretag | 3–12 månader efter | Lokalpress, pressmeddelanden |
| `Första HR-chef` | Bolaget rekryterar sin första HR- eller People & Culture-chef | När personen tillträtt | Platsannonser, utnämningar |
| `Ny HR-/People-chef` | Ny HR-chef, även om rollen funnits tidigare. Nytillsatta startar egna initiativ under de första 100 dagarna | Inom de första 100 dagarna | Utnämningar, LinkedIn-nyheter från bolaget |
| `Ny ägare / PE` | Ny huvudägare, private equity eller serieförvärvare | 3–9 månader efter | MFN, PE-bolagens nyheter |
| `Nytt varumärke / namnbyte` | Nytt namn eller ny varumärkesplattform, t.ex. efter sammanslagning. Värderingarna behöver fyllas med innehåll | Direkt | Pressmeddelanden, branschpress |

### Tidigare kontakter att bevaka

Hämta namnen från CRM:et i början av varje körning och sök efter dem i utnämningsnyheter. Gör det bara för personer vi faktiskt haft en relation med. Spara aldrig privata uppgifter: bara den nya rollen och bolaget, enligt kontaktreglerna.

```sql
-- Deltagare i program och kontakter på vunna affärer
select distinct ct."fullName", co.name as tidigare_bolag
from contacts ct
left join companies co on co.id = ct."companyId"
where exists (select 1 from participants p where p."contactId" = ct.id)
   or exists (select 1 from deals d where d."contactId" = ct.id and d.status = 'won');
```

Ange i `signal` vem personen är och vad relationen var, t.ex. "Anna Andersson (deltog i The Y Leadership Program HT-25) blir VD för Exempel AB."

## Tabell: `public.radar_inbox`

| Kolumn | Typ | Obligatorisk | Innehåll |
|---|---|---|---|
| `bolag` | text | **ja** | Bolagsnamn |
| `typ` | text | **ja** | Exakt en av signaltyperna nedan |
| `signal` | text | **ja** | 1–2 meningar om vad som hänt |
| `slug` | text | | Bolagsnamnet som slug, t.ex. `xl-bygg-herrljunga` |
| `orgnr` | text | | Organisationsnummer `XXXXXX-XXXX`. **Viktigaste fältet för dubblettskydd.** Ange det när det går att hitta i bolagets egna publiceringar eller i årsredovisningen |
| `ort`, `bransch` | text | | |
| `region` | text | | `Västra Götaland` / `Halland` / `Jönköpings län` / `Övriga Sverige` / `Okänd`. Bohuslän räknas som `Västra Götaland` |
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
