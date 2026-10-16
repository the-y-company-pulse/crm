# Ledarskapsradarn: månadsskörd → Y CRM

Underlag för en schemalagd uppgift i claude.ai som hittar bolag som passar **The Y Leadership Program**, det öppna ledarskapsprogrammet i Göteborg. Uppgiften skriver till samma inkorg som Kulturradarn, men med `radar = 'ledarskap'`.

## Vilka bolag vi letar efter

| Kriterium | Gräns | Hur CRM:et bedömer |
|---|---|---|
| **Lönsamt** | Positivt rörelseresultat båda de två senaste åren och rörelsemarginal på minst 5 % i **snitt** för de två åren. Ett enstaka svagare år är okej | `rorelseresultat_msek`, `rorelseresultat_fg_msek`, `omsattning_msek` |
| **Bra kassaflöde** | Kassalikviditet på minst 100 % och soliditet på minst 30 % | `kassalikviditet`, `soliditet` |
| **7–30 ledare** | Publicerat antal chefer, annars 60–300 anställda. Bolag med 60–80 anställda har ofta en ledningsgrupp plus teamledare och är för små för ett eget internt program, så de passar bra. Över 300 anställda passar bättre för ett skräddarsytt program | `antal_chefer` eller `anstallda` |
| **Nära Göteborg** | Högst 10 mil fågelvägen | Räknas ut från `ort`. Ange en ort som tätort eller kommun, t.ex. `Alingsås`, inte `Västsverige` |

Uteslut bolag som ingår i en stor koncern med egna interna ledarprogram, och bolag med utländsk ledning. Gränsfall tas med, men förklara dem i `vinkel`.

**Ungefärligt område inom 10 mil:** Göteborgsregionen, Kungälv, Stenungsund, Uddevalla, Trollhättan, Vänersborg, Lilla Edet, Alingsås, Vårgårda, Herrljunga, Borås, Ulricehamn, Mark, Kungsbacka, Varberg och Falkenberg. Skövde, Halmstad och Jönköping ligger utanför.

## Signaltyper

| typ | När |
|---|---|
| `Passar profilen` | Grundposten: bolaget uppfyller profilen. **En per bolag.** Om den skrivs igen uppdateras texten och ekonomin, men det skapas aldrig en dubblett |
| `Rekryterar chefer` | Platsannonser för flera chefsroller eller första gången en ny chefsnivå rekryteras |
| `Ny chefsnivå / omorganisation` | Bolaget har infört teamledare, avdelningschefer eller en ny struktur |
| `Ny VD / ledningsgrupp` | Ny VD eller ny ledningsgrupp som vill bygga ledarskapet |
| `Kraftig tillväxt` | Bolaget växer, till exempel som Gasell eller med fler anställda, och chefer utses internt |

Bolag som redan har skickat deltagare till programmet märks automatiskt "Tidigare deltagare" i CRM:et. De behöver inte uteslutas.

## Kolumner (utöver dem i `kulturradarn-skord.md`)

| Kolumn | Typ | Innehåll |
|---|---|---|
| `radar` | text | **`'ledarskap'`**. Utan det värdet hamnar raden i Kulturradarn |
| `bokslutsar` | integer | Året siffrorna avser, t.ex. `2025`. **Krävs för att ekonomin ska sparas** |
| `omsattning_msek` | numeric | Nettoomsättning i MSEK |
| `rorelseresultat_msek` | numeric | Rörelseresultat i MSEK för bokslutsåret |
| `rorelseresultat_fg_msek` | numeric | Rörelseresultat i MSEK för året innan |
| `rorelsemarginal` | numeric | Rörelsemarginal i % (frivillig) |
| `soliditet` | numeric | Soliditet i % |
| `kassalikviditet` | numeric | Kassalikviditet i % |
| `antal_chefer` | integer | Bara om antalet är publicerat |
| `avstand_km` | integer | Frivillig. Ange bara om orten är ovanlig. Annars räknar CRM:et ut avståndet |

Ekonomin byts ut när ett nyare bokslutsår kommer in. Antalet chefer och avståndet skrivs aldrig över om de redan har ett värde.

## Källor

- **Ekonomi:** bolagets årsredovisning (Bolagsverket eller bolagets webbplats), eller sammanställningar av den. Ange källan i `kalla` och `url`. Allabolag och liknande sajter får användas för **bolagets** nyckeltal men aldrig för personuppgifter.
- **Signaler om chefer:** platsannonser (Platsbanken, Teamtailor, LinkedIn Jobs, bolagets karriärsida), pressmeddelanden och lokalpress.
- **Kontaktperson:** VD, eller HR-chef om en sådan finns. I övrigt gäller samma regler som för Kulturradarn: endast uppgifter som bolaget självt publicerat, aldrig upplysningssajter och aldrig gissade adresser.

## Upplägg

- **Första körningen:** en bred sökning efter 30–50 bolag som uppfyller profilen, med fokus på Göteborgsregionen, Sjuhärad och Trollhättan/Uddevalla.
- **Därefter en gång i månaden:** nya bolag samt nya händelser för bolag som redan finns. Läs först vad som redan finns:

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
   'För litet för ett eget internt program – skicka 2–3 chefer till VT-27.',
   'Anna Andersson', 'VD', '0322-00 00 00', 'https://exempel.se/kontakt', '2026-10-19');
```
