# Skräddarsytt program: skörd → Y CRM

Underlag för en schemalagd uppgift i claude.ai som hittar bolag för **skräddarsydda ledarskapsprogram**. Ett sådant program byggs från modulbanken kring bolagets mål och kultur. Ett typiskt upplägg är ca 11 deltagare och 4 tillfällen, och prisindikationen är 190–220 tkr. Ingången är ofta ledarskapsanalysen för 15 000 kr, som dras av om bolaget går vidare med programmet.

Uppgiften skriver till samma inkorg med `radar = 'skraddarsytt'`. Föreslagen frekvens är en gång i månaden.

## Vilka bolag

| Kriterium | Gräns | Hur CRM:et bedömer |
|---|---|---|
| **30+ ledare** | Publicerat antal chefer på minst 30, annars minst 250 anställda | `antal_chefer` eller `anstallda` |
| **I målområdet** | Västra Götaland, Halland eller Jönköpings län. Programmet kan hållas på plats hos kunden, så avståndet till Göteborg är inget hårt krav | `region`, annars avståndet från `ort` |

Ekonomi är inget krav, men den får gärna anges med samma kolumner som för Öppet program. Bolag under 30 ledare passar bättre i Öppet program.

## Signaltyper

| typ | När | Bästa läge |
|---|---|---|
| `Passar profilen` | Grundposten: rätt storlek i målområdet. **En per bolag** | Löpande |
| `Ny VD / ledningsgrupp` | Ny VD eller ny ledningsgrupp som vill sätta sin prägel på ledarskapet | 3–9 månader efter tillträdet |
| `Ny chefsnivå / omorganisation` | Ny struktur, fler chefsnivåer, ny matrisorganisation | När organisationen är på plats |
| `Sammanslagning` | Två eller flera bolag går ihop, och cheferna behöver en gemensam syn på ledarskap | 3–12 månader efter |
| `Nya ledarprinciper` | Bolaget lanserar ledarskapsmodell, ledarprinciper eller ny värdegrund och behöver få cheferna att leva den | Direkt |
| `Rekryterar många chefer` | Flera chefsannonser samtidigt eller en ny anläggning | När cheferna har börjat |
| `Ny HR-/People-chef` | Nytillsatt HR-chef som startar egna initiativ | Inom 100 dagar |
| `Kraftig tillväxt` | Snabb tillväxt där nya chefer utses internt | Direkt |

## Kontaktperson

VD, HR-chef eller People & Culture-chef. Samma regler som för Värdegrund: endast uppgifter som bolaget självt publicerat, aldrig upplysningssajter och aldrig gissade adresser.

## Exempel

```sql
insert into radar_inbox (radar, typ, bolag, orgnr, ort, region, anstallda, signal, kalla, url, vinkel, tillagd)
values
  ('skraddarsytt', 'Nya ledarprinciper', 'Exempel Gruppen AB', '556000-0000', 'Borås', 'Västra Götaland', '620',
   'Lanserade nya ledarprinciper för 45 chefer i september.', 'Mynewsdesk', 'https://...',
   'Hjälp dem få principerna att leva i vardagen – börja med ledarskapsanalysen.', '2026-10-19');
```
