# Öppet program: månadsskörd → Y CRM

Underlag för en schemalagd uppgift i claude.ai som hittar köpare till **The Y Leadership Program**, det öppna ledarskapsprogrammet i Göteborg. Uppgiften skriver till samma inkorg som de andra radarerna, med `radar = 'ledarskap'` (databasnyckeln för Öppet program).

Det öppna programmet säljs till **enskilda ledare i en övergång**, från bolag av alla storlekar. NCC och Lindex skickar deltagare lika väl som bolag med 80 anställda. Därför finns tre segment.

## Segment

| Segment | Vilka | Krav som CRM:et bedömer |
|---|---|---|
| **A – mindre bolag** | 60–300 anställda (7–30 chefer), för små för egna interna program | Lönsamt: båda åren positiva och snittmarginal på minst 5 %. Kassaflöde: kassalikviditet minst 100 % och soliditet minst 30 %. Högst 10 mil från Göteborg |
| **B – större bolag** | Fler än 300 anställda eller fler än 30 chefer, med **kontor i Göteborgsregionen**, som skickar enskilda ledare | Bara avståndet. Ange ortens **lokala kontor** i `ort`, inte huvudkontoret |
| **Offentlig sektor** | Kommuner, kommunalförbund (t.ex. räddningstjänst), regioner, myndigheter. Org.nr börjar på 2 | Bara avståndet. En plats på 43 000 kr ryms i direktupphandling |

Segmentet räknas ut automatiskt från `anstallda`/`antal_chefer` och `orgnr`. Ange alltid org.nr för offentliga organisationer.

**Ungefärligt område inom 10 mil:** Göteborgsregionen, Kungälv, Stenungsund, Orust, Tjörn, Uddevalla, Trollhättan, Vänersborg, Lilla Edet, Alingsås, Vårgårda, Herrljunga, Borås, Ulricehamn, Mark, Kungsbacka, Varberg och Falkenberg. Skövde, Halmstad och Jönköping ligger utanför.

## Signaltyper

| typ | När | Bästa läge | Källor |
|---|---|---|---|
| `Passar profilen` | Grundposten för segment A: bolaget uppfyller profilen. **En per bolag.** Om den skrivs igen uppdateras texten och ekonomin | Inför varje säljfönster | Årsredovisningar |
| `Nyutnämnda chefer` | Utnämningar och befordringar, t.ex. "ny avdelningschef", "ny platschef", "utsedd till teamledare". **Förstagångschefer är kärnmålgruppen** | 1–6 månader efter | Pressmeddelanden, bolagens nyhetssidor och LinkedIn-sidor, lokalpress |
| `Rekryterar förstalinjechefer` | Platsannonser för teamledare, arbetsledare, gruppchef, produktionsledare och liknande. Om några månader finns en ny ledare att utveckla | När tjänsten är tillsatt | Platsbanken, Teamtailor, LinkedIn Jobs, karriärsidor |
| `Ny HR-/L&D-ansvarig` | Ny HR-chef, L&D-ansvarig eller Talent Manager, främst i segment B. De köper platser åt enskilda chefer | Inom 100 dagar | Utnämningar, platsannonser |
| `Lovar ledarutveckling i annonser` | Platsannonser som utlovar "ledarskapsutveckling" eller "ledarprogram" utan att bolaget har ett eget. De har lovat något de behöver köpa | Direkt | Platsannonser |
| `Kraftig tillväxt` | Bolaget växer och utser chefer internt | Direkt | Gasell-listor, branschpress |
| `Återkommande köpare` | **Skapas av CRM:et självt**, 6 månader efter att ett bolag skickat deltagare till ett program. Skörden ska inte skriva denna typ | – | CRM:ets deltagardata |

## Säljfönster

Programmen startar i februari och oktober. Platser säljs bäst när budgeten sätts: **oktober–december** inför vårterminen och **maj–juni** inför hösten. Radar-vyn visar nästa programstart och markerar "säljfönster nu" när det är högst 4 månader kvar. Lägg den breda sökningen i skörden strax före varje fönster.

## Kolumner (utöver dem i `kulturradarn-skord.md`)

| Kolumn | Typ | Innehåll |
|---|---|---|
| `radar` | text | **`'ledarskap'`**. Utan det värdet hamnar raden i Värdegrund |
| `bokslutsar` | integer | Året siffrorna avser, t.ex. `2025`. **Krävs för att ekonomin ska sparas** (segment A) |
| `omsattning_msek` | numeric | Nettoomsättning i MSEK |
| `rorelseresultat_msek` | numeric | Rörelseresultat i MSEK för bokslutsåret |
| `rorelseresultat_fg_msek` | numeric | Rörelseresultat i MSEK för året innan |
| `rorelsemarginal` | numeric | Rörelsemarginal i % (frivillig) |
| `soliditet` | numeric | Soliditet i % |
| `kassalikviditet` | numeric | Kassalikviditet i % |
| `antal_chefer` | integer | Bara om antalet är publicerat |
| `avstand_km` | integer | Frivillig. Ange bara om orten är ovanlig. Annars räknar CRM:et ut avståndet |

Ekonomin byts ut när ett nyare bokslutsår kommer in. Antalet chefer och avståndet skrivs aldrig över om de redan har ett värde.

## Källor och metod

- **Ekonomi (segment A):** sök **per kommun** i bolagsregistret (t.ex. Allabolags områdessökning) och kontrollera bokslutet för varje bolag. Allmänna webbsökningar ger nästan inget, och listor över de största bolagen per kommun gynnar handelsbolag med få anställda. Ange källan i `kalla` och `url`. Allabolag och liknande sajter får användas för **bolagets** nyckeltal men aldrig för personuppgifter.
- **Kontaktperson:** VD, eller HR-chef om en sådan finns. I segment B är HR-, L&D- eller Talent-ansvarig i regionen rätt person. I övrigt gäller samma regler som för Värdegrund: endast uppgifter som bolaget självt publicerat, aldrig upplysningssajter och aldrig gissade adresser. Bekräfta VD-namn från registret på bolagets egen webbplats.
- **Uteslut:** bolag i stora koncerner som tydligt har egna interna ledarprogram (gäller segment A), samt bolag med utländsk ledning utan svensk lokal ledning.

Läs först vad som redan finns:

```sql
select c.name, c."orgNr", c."fiscalYear", s.type, s."createdAt"::date
from companies c join signals s on s."companyId" = c.id
where s.radar = 'ledarskap'
order by c.name;
```

## Exempel

```sql
insert into radar_inbox
  (radar, typ, bolag, orgnr, ort, bransch, anstallda, signal, kalla, url,
   bokslutsar, omsattning_msek, rorelseresultat_msek, rorelseresultat_fg_msek,
   soliditet, kassalikviditet, vinkel, kontakt, kontakt_roll, telefon, kontakt_kalla, tillagd)
values
  ('ledarskap', 'Passar profilen', 'Exempel Industri AB', '556000-0000', 'Alingsås', 'Tillverkning', '140',
   'Familjeägt, lönsamt sedan många år, ca 15 chefer i produktion och sälj.', 'Årsredovisning 2025', 'https://...',
   2025, 210, 18, 12, 42, 130,
   'För litet för ett eget internt program – skicka 2–3 chefer till nästa start.',
   'Anna Andersson', 'VD', '0322-00 00 00', 'https://exempel.se/kontakt', '2026-10-19');

insert into radar_inbox (radar, typ, bolag, ort, anstallda, signal, kalla, url, tillagd)
values
  ('ledarskap', 'Nyutnämnda chefer', 'Exempel Logistik AB', 'Göteborg', '450',
   'Tre nya teamledare utsedda på terminalen i Göteborg i september.', 'Exempel Logistik (nyheter)', 'https://...', '2026-10-19');
```
