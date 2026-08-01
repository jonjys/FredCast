# FredCast — MVP-backlogg (v1)

> Bryter ner MVP-scopet från `docs/PRODUCT_PLAN.md` (avsnitt 10) till epics och
> user stories med acceptanskriterier, så nästa steg (design-fidelity → kod)
> har ett konkret underlag. Fortfarande ingen kod i detta dokument.

Prioritetsordning: **P0** = krävs för att MVP:t ska hålla löftet
("Välj/Dela → Välj skärm → Klart"), **P1** = stärker upplevelsen men kan
skjutas till strax efter lansering utan att kärnlöftet bryts.

---

## Epic 1 — Discovery-motorn (Cast-motor + adapters)
*Grunden allt annat bygger på (avsnitt 8 i produktplanen).*

- **P0** Som användare vill jag att appen automatiskt hittar Chromecast/
  Google Cast-enheter på mitt nätverk, så jag aldrig behöver ange en adress.
  - AC: mDNS-scan (`_googlecast._tcp`) startar inom 1s efter beviljad
    nätverksbehörighet; hittade enheter dyker upp i listan inom 3s typiskt.
- **P0** Som användare vill jag att appen hittar DLNA/UPnP-mediarenderare
  (många Smart TV-märken), så fler TV-typer än bara Chromecast fungerar.
  - AC: SSDP M-SEARCH-broadcast + parsing av enhetsbeskrivning (`friendlyName`,
    `deviceType`) mappas till samma interna enhetsmodell som Cast-adaptern.
- **P0** Som användare vill jag att alla hittade enheter, oavsett protokoll,
  visas i **en** sammanslagen lista utan dubbletter.
  - AC: en fysisk TV som annonserar både Cast och DLNA slås ihop till ett
    kort (dedupe på MAC/IP + friendly name-likhet).
- **P0** Som utvecklare vill jag ha ett enhetligt internt gränssnitt
  (`discover/connect/sendMedia/control/disconnect`) så UI aldrig behöver
  veta vilket protokoll som används.
  - AC: switchar man ut en adapter (t.ex. lägger till Miracast senare)
    kräver det noll ändringar i UI-lagret.
- **P1** FredCast Receiver (PWA) som fallback-mottagare för skärmar utan
  Cast/AirPlay/DLNA.
  - AC: en webbläsare som öppnar receiver-URL:en annonserar sig själv och
    kan ta emot `sendMedia`-kommandon via WebSocket.

## Epic 2 — Enhetslista & rumsgruppering
- **P0** Enheter grupperas efter rum (manuellt satt namn > enhetens eget
  friendly-name > "Övriga skärmar"), aldrig efter protokoll.
  - AC: se avsnitt 5 i produktplanen; ingen sträng i UI får innehålla
    "Chromecast"/"DLNA"/"AirPlay" som primärtext.
- **P0** Live statusindikator per enhet: Redo / Ansluter / Upptagen /
  Otillgänglig.
- **P0** Favoritmarkering, favoriter alltid överst oavsett rumsgruppering.
- **P1** Signalstyrka/anslutningskvalitet-indikator på enhetskort.

## Epic 3 — Dela-flödet (Share Extension / Share Target)
*Det primära vardagsflödet (Flöde B) — se motivering i produktplanens
sammanfattning.*

- **P0** FredCast syns i iOS Share Sheet och Android Share Target för bild,
  video och dokument.
  - AC: från Foton/Filer/Safari → Dela → FredCast → kompakt bottom sheet
    (ingen full appöppning) inom 1s.
- **P0** Kompakta bladet visar innehållsförhandsvisning + favoriter/senast
  använda skärmar + "Fler skärmar".
- **P0** Ett tryck på en skärm startar castning och stänger delningsarket.

## Epic 4 — Eget galleri (Flöde A)
- **P0** Bläddra i systemets bild- och videobibliotek i rutnät.
- **P0** Just-in-time-behörighet: fotobehörighet begärs först när
  användaren trycker på "Bilder", inte i onboarding.
- **P1** Filhanterare med lokala filer + minst en molnkälla (iCloud eller
  Drive) som källa.

## Epic 5 — Cast-upplevelsen (overlay, laddning, fel)
- **P0** Bottom sheet vid tryck på ett objekt, med "Visa på [skärm]" som
  enda primärhandling när en skärm redan är vald.
- **P0** Lokala filer strömmas via inbäddad HTTP-server på avsändarenheten
  (se avsnitt 8) så Cast/DLNA-mottagaren kan hämta dem.
- **P0** Tydlig progressindikator vid faktisk filöverföring, kontra ren
  handskakning för redan molnhostat innehåll.
- **P0** Enhetlig felhantering enligt tabellen i avsnitt 6: otillgänglig
  enhet, fel nätverk, tappad anslutning (auto-reconnect + manuell retry).
- **P1** Kryptiskt-fel → format-inte-stöds-meddelande med tydlig
  handlingsknapp.

## Epic 6 — Uppspelningskontroller (Now Playing)
- **P0** Play/paus/nästa/föregående/skrubb för video.
- **P0** Grundläggande bildspel: hastighet (2/5/10s), manuell
  nästa/föregående.
- **P0** Persistent cast-bubbla synlig på alla flikar under aktiv castning.
- **P1** Volymkommando där mottagaren stödjer det.

## Epic 7 — QR-anslutning (nätverksfallback)
- **P0** "Inga skärmar hittade"-läge med konkret felsökningstext + knapp
  till QR/kod-anslutning.
- **P0** QR/kod-parkoppling fungerar även när avsändare och mottagare är på
  olika subnät (kräver relay-signalering, se avsnitt 8).

## Epic 8 — Historik & grundinställningar
- **P0** Lokal historik (senaste 20 castningar), ingen molnsynk krävs i MVP.
- **P0** Inställningar: konto (valfritt), nätverksstatus, auto-kvalitet,
  notiser, och en tydlig av/på-toggle för molnrelä-fallback (default:
  **av**, LAN-first — se integritetsresonemang i avsnitt 9).
- **P1** Enkelt kontosystem (Sign in with Apple/Google) — endast för att
  synka favoriter/historik mellan användarens egna enheter.

---

## Explicit utanför MVP (bekräftat i produktplanen, avsnitt 10)
AirPlay-sändning, musikbibliotek/spellistor, multi-cast till flera skärmar
samtidigt, delade album/länkar till andra personer, serverstödd omkodning,
widgetar, skärmspegling, desktop-appar. Dessa ligger i backloggen för v2–v4
(se roadmap) och ska **inte** plockas in i v1-scope utan ett medvetet beslut.

## Definition of Done för MVP
- Alla P0-punkter ovan implementerade och manuellt testade mot minst:
  1 riktig Chromecast/Google TV, 1 DLNA-kompatibel Smart TV, samt
  FredCast Receiver i en vanlig TV-webbläsare.
- Tid från appstart (kall start) till första bilden på TV: **under 20
  sekunder**, max 6 tryck (Flöde A) — mätt, inte antaget.
- Dela-flödet (Flöde B): under 3 sekunder, 2 tryck, från en tredjepartsapp.
- Ingen sträng i produktions-UI:t nämner protokollnamn som primärtext.
