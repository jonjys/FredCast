# FredCast — "Universal Cast"
### Produktplan, UX-arkitektur & prototyp (pre-build)

> Status: Konceptfas. Ingen kod ska skrivas förrän detta dokument är godkänt.
> Detta är grunden för allt kommande arbete i repot.

---

## 0. Kärnidé och positionering

**Löfte till användaren:** *Välj något → Välj skärm → Klart.*

Ingen ska någonsin behöva veta vad Chromecast, AirPlay, DLNA eller Miracast är.
FredCast är en **abstraktionsapp** — appen är "hjärnan" som avgör *hur* innehåll
skickas, användaren väljer bara *vad* och *var*.

Detta är rätt vision. Men för att den ska hålla i verkligheten (se avsnitt 9)
föreslår jag en viktig omformulering av principen:

> **"Dela något → Peka på en skärm → Klart."**

Skillnaden mellan "Välj" och "Dela" är avgörande för UX (se avsnitt 1 och 3):
om appen kräver att användaren *först importerar* sitt innehåll in i FredCasts
eget bibliotek innan man kan casta, har vi redan lagt till ett steg och ett
mentalt hinder. Den bästa versionen av produkten möter användaren där hen
redan är — i Foton, Filer, Musik-appen, webbläsaren — via **systemets
delningsfunktion (share sheet)**, med FredCasts eget galleri som ett
*alternativ*, inte det enda sättet in.

---

## 1. Användarflödet — från första öppning till första videon på TV

### Flöde A — Första gången (cold start)

1. **App-ikon tryckt.** Splash i under 1 sekund (inget onboarding-flöde med
   5 sidor att swipa — det är friktion, inte förtroende).
2. **Ett (1) skärmkort:** "FredCast hittar och visar innehåll på vilken skärm
   som helst. Låt oss hitta din TV." → knapp **"Hitta skärmar"**.
   - Ingen wall of text om protokoll. Ingen logga-in-krav ännu.
3. **Discovery-animation** startar direkt (se avsnitt 5) samtidigt som appen
   ber om nätverksbehörighet (iOS: Local Network-behörighet krävs för mDNS).
   Medan sökningen pågår visas en lekfull "radar"-animation, inte en
   spinner — det ska kännas som magi, inte laddning.
4. **Enhet hittad** → kortet växer in som en snygg "enhetskort"-cell med namn,
   ikon och rumsgissning ("Vardagsrum" — se avsnitt 5 för hur vi gissar rum).
5. Användaren trycker på skärmkortet → **"Ansluter till [namn]…"** (1–2 sek,
   riktig websocket/cast-handshake, inte fejk-fördröjning) → grön bock.
6. **Nu, och först nu**, frågar appen: "Vad vill du visa?" med tre stora
   knappar: **Bilder**, **Videor**, **Filer & dokument** (Musik separat, se
   nedan) — plus en fjärde, mindre framträdande: **"Öppna från annan app"**
   (delningsflödet).
7. Systemets behörighetsdialog (Foton/Media) triggas *precis* när användaren
   faktiskt vill använda den kategorin — **just-in-time permissions**, aldrig
   en bulk-fråga om allt i onboarding. Detta höjer beviljandegrad kraftigt
   (branschdata visar 2–3x högre acceptans vid kontextuell begäran).
8. Galleriet öppnas, användaren trycker på en bild/video.
9. **Cast-overlay** (avsnitt 6) visar miniatyr + vald skärm + en enda knapp:
   **"Visa på [Vardagsrum]"**. Ingen ny skärmvalsdialog behövs eftersom
   skärmen redan valdes i steg 5 — men man kan trycka på skärmnamnet för att
   byta.
10. Innehåll visas på TV:n. Telefonen blir fjärrkontroll (play/paus/nästa).
    **Klart.** Från appstart till första bilden på TV: målsättning **under
    20 sekunder**, max 6 tryck.

### Flöde B — Delning från en annan app (den *riktiga* vardagsanvändningen)

Detta är minst lika viktigt som flöde A, och bör vara **det primära sättet**
produkten faktiskt används på efter dag 1:

1. Användaren är i **Foton**, **Filer**, **Safari/Chrome**, **Spotify** etc.,
   trycker på systemets delaikon.
2. **FredCast** dyker upp i share sheet-listan (iOS Share Extension / Android
   Share Target).
3. Ett litet FredCast-blad glider upp underifrån: förhandsvisning av
   innehållet + en rad med senast använda/favoritskärmar + "Fler skärmar…".
4. Ett tryck på en skärm → casting startar direkt, share sheet stängs.

**Total tid: ~3 sekunder, 2 tryck, användaren lämnar aldrig sin ursprungsapp.**
Detta är den verkliga "magin" — inte gallerivyn i egna appen.

### Flöde C — Återkommande användare (dag 2+)

1. Öppna app → hemskärmen visar direkt: **"Fortsätt till [Vardagsrum-TV]"**
   som en gigantisk primär knapp (senast/vanligast använda skärm), plus
   miniatyrer av senast castat innehåll.
2. Ingen ny discovery-fördröjning behövs om enheten sågs senast under de
   senaste ~2 minuterna (cache + snabb "ping" i bakgrunden).

---

## 2. Alla skärmar (vyer)

| # | Skärm | Syfte |
|---|-------|-------|
| 1 | **Splash** | Logga, <1s, ingen interaktion |
| 2 | **Discovery-välkomst** | Ett enda värde-budskap + "Hitta skärmar" |
| 3 | **Behörighetsförklaring (kontextuell)** | Visas precis innan varje systemdialog, förklarar *varför* i en mening |
| 4 | **Hemskärm ("Idag")** | Primär cast-genväg + senaste innehåll + senaste skärm |
| 5 | **Enhetslista (Discovery)** | Alla hittade skärmar, grupperade (avsnitt 5) |
| 6 | **Enhetsdetalj** | Namn, typ, signalstyrke-indikator, "gör till favorit", byt namn |
| 7 | **Galleri — Bilder** | Systemets bildbibliotek, rutnät |
| 8 | **Galleri — Videor** | Rutnät med längd-badge |
| 9 | **Filhanterare** | Bläddra i Filer/molntjänster, dokumentikoner |
| 10 | **Musikbibliotek/spelare** | Lista, nu-spelas-kort |
| 11 | **Cast-overlay / Sändningsbekräftelse** | Bottom sheet vid varje castning (avsnitt 6) |
| 12 | **Aktiv uppspelning ("Now Playing")** | Fullskärms fjärrkontroll när något castas |
| 13 | **Bildspelskontroll** | Play/paus/hastighet/övergång, timer |
| 14 | **Kö (Queue)** | Kommande objekt, drag-to-reorder |
| 15 | **Historik** | Senast castat, per skärm och globalt |
| 16 | **Favoritenheter** | Fästa skärmar, döpta om, ordnade |
| 17 | **Inställningar** | Konto, nätverk, kvalitet, notiser, om |
| 18 | **Felskärm / Reconnect** | Enhetlig, lugn felhantering (avsnitt 6) |
| 19 | **Dela-arkbild (Share Extension UI)** | Den kompakta varianten för Flöde B |
| 20 | **QR-anslutning** | Fallback-parkoppling (avsnitt 5 & 9) |
| 21 | **Tomt tillstånd ("Inga skärmar hittade")** | Hjälp: felsökningstips, samma-nätverk-check, QR-alternativ |

Jag har medvetet **inte** designat en separat "Onboarding-flöde med flera
sidor". Ett premiumintryck skapas av att appen *funkar direkt*, inte av att
den förklarar sig själv i fem steg innan man får göra något.

---

## 3. Navigation

**Rekommendation: Bottom tabs (4 st) + kontextuell bottom sheet, inget
sidomenyn, inga flera "lägen".**

```
┌─────────────────────────────────┐
│                                  │
│           Innehåll               │
│        (aktuell vy)              │
│                                  │
│  ┌────────────────────────────┐ │
│  │  ▶ Nu castas: Vardagsrum   │ │  ← Persistent "cast-bubbla"
│  └────────────────────────────┘ │     (som Spotifys mini-player)
├──────────────────────────────────┤
│  🏠      🖼️      📺      ⚙️     │
│  Idag   Bibliotek  Skärmar  Inst │
└──────────────────────────────────┘
```

- **Idag** — hemskärm, snabb-cast, senaste
- **Bibliotek** — bilder/video/filer/musik i flikar eller segment-kontroll
  högst upp (inte egna bottentabbar — fyra mediatyper × fyra
  navigationstabbar hade blivit rörigt)
- **Skärmar** — enhetslista, favoriter, historik i undersektioner
- **Inställningar**

**Persistent "cast-bubbla":** Precis som Google Casts mini-controller eller
Spotifys "now playing"-rad — syns på *alla* skärmar i appen så fort något
castas, med mini-kontroller (paus/nästa) utan att man behöver navigera bort
från det man höll på med. Tryck på bubblan → fullskärms Now Playing.

**Floating action button:** Endast **en** — en flytande "Cast"-knapp i
Bibliotek-vyerna som dyker upp när man markerat ett eller flera objekt
(multi-select → skicka som bildspel/kö). Undvik FAB-overload.

**Inga "lägen".** Ett enda navigationsparadigm oavsett om man castar bild,
video eller musik — bara *innehållet i mitten* och *kontrollerna i
overlayen* byter utseende. Detta är kärnan i "det ska kännas enkelt": samma
mentala modell för allt.

---

## 4. Designsystem

**Känsla:** Tyst, mörk, materialrik — närmare Apple TV-appens eller Sonos
Ess-appens lugna premiumkänsla än en trafikerad verktygsapp.

### Färger
- **Bas:** Nästan-svart (`#0B0B0F`) i mörkt läge (default), varmvitt
  (`#FAFAF9`) i ljust läge — inga rena `#000`/`#FFF`, för hård kontrast
  känns billigt.
- **Accent:** En enda distinkt märkesfärg, t.ex. elektrisk indigo/violett
  (`#6C5CE7`-familjen) eller en varm koral — **en** accent, inte en
  regnbåge. Används sparsamt: primärknappar, aktiv-status, "sänder nu"-puls.
- **Semantik:** Grön = ansluten/klart, gul = ansluter/söker, röd endast för
  faktiska fel (aldrig för normal väntan).
- **Enhetstypsfärgning:** Subtil, inte skrikig — en tunn kantfärg eller ikon-
  tint per enhetstyp (se avsnitt 5), inte hela kort i olika färger.

### Typografi
- Systemets nativa typsnitt (SF Pro / Roboto) för snabbhet, läsbarhet och
  automatiskt korrekt lokalisering — **inte** ett eget inköpt typsnitt i v1.
  En premiumkänsla kommer av *rytm och whitespace*, inte av ett dyrt typsnitt.
- Tydlig hierarki: stor (28–34pt) rubrik på hemskärm, 17pt brödtext, 13pt
  metadata/tidsstämplar, allt med generöst radavstånd.

### Spacing & grid
- 8pt-grid genomgående. Generösa marginaler (20–24pt sidomarginal) —
  premiumkänsla = *luft*, inte kompakt informationsdensitet.
- Kort i rutnät med konsekvent 12–16pt gap, rundade hörn 16–20px (mjukare
  än standard-iOS 12px, ger "mjuk premium"-känsla à la Sonos/Arc Browser).

### Animationer
- **Discovery-radar:** mjuk pulserande ring, 2–3s loop, inte en spinning
  loader — kommunicerar "vi letar" snarare än "något är trasigt/långsamt".
- **Enhetskort som dyker upp:** fade + scale-in (0.95→1.0), stagger 60–80ms
  mellan varje hittad enhet — känns som att enheterna "poppar fram", inte
  att en lista bara laddas.
- **Cast-overlay:** spring-baserad bottom-sheet (inte linear ease), 300–400ms.
- **Statusövergångar** (söker→ansluten→sänder): morphing av samma ikon/prick
  snarare än att byta ut hela ikoner — kontinuitet över hopp.
- Håll animationer **under 400ms** för allt interaktivt; längre bara för
  bakgrundsdekorativa element (radar-loop).

### Kort & knappar
- Kort: subtil elevation via mjuk skugga + 1px inre highlight-kant (inte
  hård drop-shadow) — ger "glas"-känsla utan att vara en genomskinlighets-
  gimmick.
- Primärknapp: fylld, rundad (fullt pill-formad för de viktigaste CTA:erna
  som "Visa på TV"), med subtil tryck-in-skalning (0.97) vid tap.
- Sekundärt: text-only eller outline, aldrig konkurrerar visuellt med
  primärhandlingen.

### Ikoner
- En konsekvent ikonfamilj (linjebaserad, 1.5–2px stroke, likt SF Symbols/
  Phosphor) — **egna enhetsikoner** ritade specifikt för TV/Chromecast-
  puck/soundbar/dator/telefon/webbläsare snarare än generiska "skärm"-ikoner
  för allt, så användaren kan känna igen enhetstyp på en blick även utan
  text (viktigt i avsnitt 5).

---

## 5. Discovery — hur hittas och visas enheter

### Teknisk grund (se detaljer i avsnitt 8–9)
Flera protokoll skannas **parallellt och tyst i bakgrunden**:
- **mDNS/Bonjour** → hittar Chromecast/Google Cast-enheter, AirPlay-mottagare,
  och många smarta TV:s som annonserar `_googlecast._tcp` / `_airplay._tcp`.
- **SSDP/UPnP** → hittar DLNA-mediarenderare (många Smart TV, Sonos, Xbox,
  vissa Blu-ray-spelare).
- **Lokalt nätverksskann + kända fingeravtryck** för enheter som inte
  annonserar sig helt standardmässigt (vissa Fire TV/Android TV-modeller).
- **Egen FredCast-receiver (PWA)** — se avsnitt 9 — annonserar sig likaså via
  mDNS när den körs, samt kan hittas via QR/kod.

Resultatet slås samman till **en enda lista med logisk deduplicering** (en
fysisk TV som annonserar både AirPlay *och* DLNA ska visas som **ett** kort,
inte två).

### Visning & gruppering
Enhetslistan grupperas **efter rum, inte efter protokoll** — användaren ska
aldrig se "Chromecast-enheter" som en rubrik.

```
📍 Vardagsrum
   📺 Sony BRAVIA (stor TV-ikon)        ● Redo
   🔊 Sonos Arc                          ● Redo

📍 Sovrum
   📺 Chromecast med Google TV           ● Redo

📍 Andra skärmar
   💻 Fredriks MacBook (webbläsare)      ● Redo
   📺 Okänd skärm (Vardagsrum?)          ○ Ansluter…
```

- **Rumsgissning:** i) tidigare manuellt satt rumsnamn av användaren (starkast
  signal), ii) enhetens eget Bonjour/friendly-name ("Vardagsrum-TV" som
  användaren redan döpt i sin TV/Google Home-app — vi återanvänder det),
  iii) fallback: gruppera efter senaste kända Wi-Fi-BSSID/nätverkssegment,
  iv) sista fallback: "Övriga skärmar", olabelad grupp — aldrig gissa fel med
  falsk säkerhet.
- **Identifiering utan teknikprat:** varje kort visar enhetstyp-ikon (stor
  TV, soundbar, dator, mobil-webbläsare) + namn + en liten
  signal/anslutningskvalitet-indikator (fylld prick = stark, ihålig = svag)
  — **aldrig** protokollnamnet självt i UI:t. ("Chromecast" som *märkesnamn*
  kan visas diskret i finstil på detaljsidan för de som vill veta, men är
  aldrig primär text.)
- **Favoriter alltid högst upp**, med en fäst-nål-ikon, oavsett rumsgruppering.
- **Live-status:** "Redo" / "Upptagen (spelar något annat)" / "Ansluter…" /
  "Otillgänglig just nu" — så man aldrig trycker i blindo på en död enhet.

---

## 6. Cast-upplevelsen

### När man trycker på en bild/video
1. **Ingen ny sida.** En **bottom sheet** glider upp över det man redan tittar
   på (galleri förblir synligt, dimmat bakom).
2. Sheet visar: stor miniatyr av innehållet, filnamn/typ, och **rad med
   skärmar** — favoriter + senast använda överst, "Fler skärmar" expanderar.
3. Om **redan ansluten** till en skärm (vanligaste fallet): sheet visar bara
   en enda stor knapp: **"Visa på [Vardagsrum]"** — ett tryck, klart. Byt
   skärm är ett sekundärt, mindre tryck ovanför.

### Att välja TV
- Samma enhetskort-design som i Discovery (avsnitt 5), men kompakt (avatar +
  namn + status-prick), max 3–4 synliga innan "Visa fler".
- Multi-cast (samma innehåll till flera skärmar samtidigt) är en
  **v2-funktion** (checkboxar istället för radioval) — hålls utanför MVP för
  enkelhetens skull, men UI:t designas så det inte kräver omdesign senare.

### Laddning
- Sheet morphar direkt till en **"Skickar…"**-vy: miniatyren "flyger" visuellt
  mot skärmkortet (subtil rörelseriktning, inte bokstavlig animation över
  hela skärmen) + en tunn progressbar om filen faktiskt överförs (stor
  lokal fil som strömmas via inbyggd HTTP-server, se avsnitt 8) kontra en
  ren "spinner" om det bara är en snabb kommando-handshake (streaming-URL
  redan tillgänglig, t.ex. moln-video).
- Efter lyckad start: sheet stängs automatiskt, cast-bubblan (avsnitt 3)
  tar över som permanent statusindikator.

### Fel
**Lugn, konkret, alltid med en tydlig nästa handling** — aldrig en teknisk
felkod som förstasida:

| Situation | Meddelande | Handling |
|---|---|---|
| Enhet svarar inte | "Kan inte nå [namn] just nu" | "Försök igen" / "Välj annan skärm" |
| Fel nätverk | "Din telefon och TV verkar vara på olika nätverk" | "Så här löser du det" (guide) / "Anslut med QR-kod istället" |
| Filformat stöds ej av mottagaren | "Den här TV:n kan inte spela den här filtypen direkt" | "Skicka ändå (konverteras)" *(v2, se roadmap)* / "Avbryt" |
| Tappad anslutning under uppspelning | Diskret banner högst upp, inte en avbrytande dialog | "Återansluter automatiskt…" med auto-retry, manuell "Återanslut nu" om det misslyckas |

### Uppspelningskontroller (Now Playing)
- **Video/bildspel:** stor miniatyr/förhandsvisning av vad som visas på TV:n
  just nu, play/paus, föregående/nästa, volymreglage (om enheten stödjer
  volymkommando), tidslinje med skrubbning, "stäng av TV-uppspelning"-knapp
  längst ner (destruktiv, tydligt avskild).
- **Bildspel:** samma kontrollpanel + hastighetsval (2s/5s/10s per bild) och
  övergångstyp, "blanda ordning"-toggle.
- **Musik:** klassiskt musikspelar-UI (kö, shuffle, repeat) — telefonen är
  fjärrkontrollen, TV:n/högtalaren visar visualisering/albumkonst.
- Kontrollpanelen är **samma vy oavsett vilket protokoll som faktiskt
  används i bakgrunden** — det är hela poängen med produkten.

---

## 7. Funktioner

### MVP (Version 1)
- Dela från systemets share sheet → FredCast → skärm (Flöde B)
- Eget galleri för bilder/video (systembibliotek, ingen egen molnlagring)
- Automatisk discovery: Chromecast/Google Cast + DLNA/UPnP + egen PWA-
  receiver (fallback, se avsnitt 8–9)
- Enhetslista grupperad per rum, favoriter
- Bildvisning, videouppspelning, grundläggande bildspel
- Now Playing-kontroller (play/paus/nästa/volym/skrubb)
- Senast använd skärm ihågkommen, automatisk återanslutning vid appstart
- QR-kodsanslutning som universal fallback
- Historik (senaste 20 castningar)
- Grundläggande felhantering enligt avsnitt 6

### Nära framtid (Version 2)
- **AirPlay-sändning från iOS/tvOS-sidan** (nativt stöd, se avsnitt 9)
- Musikbibliotek + spellista/kö-hantering
- Multi-cast till flera skärmar samtidigt
- Dela album/spellista med annan person (länk, inte fil)
- Drag & drop (iPad/desktop) rakt in i appen eller på enhetskortet
- Automatisk bildkvalitet/nedskalning baserat på nätverkshastighet
- Filhanterare med molnkälle-koppling (Google Drive/iCloud/Dropbox som källa,
  inte egen lagring)

### Längre fram (Version 3+)
- Egen molnbackup/synk (valfritt, premiumfunktion) för att casta innehåll
  som inte finns lokalt på enheten just nu
- Skärmspegling (fullständig mirroring) där OS tillåter det programmatiskt
- Fjärrstyrning av flera personers telefoner mot samma skärm ("alla i
  familjen kan skicka bilder till TV:n på middagen" — delat kösystem)
- Smarta "scener": t.ex. bildspel som auto-startar när viss TV/tid på dygnet
- Widgetar/kontrollcenter-genvägar (iOS/Android) för "cast senaste bilden"
  utan att öppna appen
- Desktop-appar (menyradsverktyg) för att casta skärminnehåll/filer direkt
  från Mac/Windows

---

## 8. Teknisk arkitektur

### Grundprincip: **Adapterarkitektur**
En **Cast-motor** i mitten med ett gemensamt internt gränssnitt
(`discover()`, `connect()`, `sendMedia()`, `control()`, `disconnect()`), och
en adapter per faktiskt protokoll. UI:t pratar *bara* med motorn — det vet
aldrig vilket protokoll som används.

```
        ┌─────────────────────────────┐
        │        FredCast App         │
        │   (UI, galleri, kontroller) │
        └───────────┬─────────────────┘
                     │
        ┌────────────▼────────────────┐
        │        Cast-motor            │
        │  (enhetlig lista, routing,    │
        │   state machine, fallback)    │
        └──────┬───────┬───────┬───────┘
               │       │       │
     ┌─────────▼┐ ┌────▼────┐ ┌▼─────────────┐
     │ Google    │ │ DLNA/   │ │ AirPlay       │  + FredCast
     │ Cast SDK  │ │ UPnP    │ │ (endast från  │    PWA-receiver
     │ (CAF)     │ │ adapter │ │  Apple-avsändare)│  adapter
     └───────────┘ └─────────┘ └───────────────┘
```

### Frontend (mobil)
- **React Native** (eller Flutter) för iOS + Android från en kodbas —
  eftersom UI:t är listor/kort/sheets/spelare, inget som kräver tung nativ
  rendering. Nativa moduler kopplas in för:
  - iOS: `MultipeerConnectivity`/`Network.framework` för Bonjour, samt
    Apples AirPlay-API:er (endast tillgängliga nativt på Apple-plattform).
  - Android: Google Cast Android Sender SDK, NSD (Network Service
    Discovery) för mDNS/DLNA.
- **Share Extension (iOS) / Share Target (Android)** som tunna native
  moduler som öppnar det kompakta cast-arket direkt (Flöde B).

### Backend (minimalt, medvetet)
Produkten är i grunden **peer-to-peer/LAN-first** — de flesta castningar
bör *aldrig* gå via en central server, av lattens- och integritetsskäl.
Backend behövs för:
- **Kontokoppling** (favoriter/historik synkat mellan användarens egna
  enheter) — lättviktigt konto (Apple/Google Sign-In + e-post), ingen
  tvingad registrering för att använda appen lokalt.
- **Relay-server (fallback)** — när avsändare och mottagare *inte* är på
  samma LAN/subnet (vanligt problem, se avsnitt 9) förmedlas anslutnings-
  metadata (och i värsta fall själva strömmen) via en molnrelä, t.ex.
  WebRTC med TURN-server. Detta ska vara **tydligt kommunicerat** till
  användaren eftersom data då lämnar hemnätverket.
- **FredCast Receiver-tjänst**: en lättviktig webbapp (PWA) som körs i
  vilken skärms webbläsare som helst (Tizen/webOS Smart TV-webbläsare,
  Fire TV Silk-webbläsare, datorer) — den *är* i praktiken vår universella
  "protokoll" för enheter som saknar Cast/AirPlay/DLNA-stöd. Kopplas via
  QR-kod eller kort kod, kommunicerar via WebSocket/WebRTC.

### Databas
- Lättvikt: Postgres (via t.ex. Supabase/Neon) för konto, favoriter, historik,
  enhetsnamn/rum. Ingen mediafil lagras i databasen — bara metadata och
  referenser.

### API
- REST/GraphQL för kontodata + realtidskanal (WebSocket) för:
  - Relay-signalering (WebRTC-handskakning)
  - Cast-status-events till "Now Playing"-vyn
  - Multi-device-synk (t.ex. flera familjemedlemmars appar som ser samma
    delade kö)

### Autentisering
- Sign in with Apple / Google, valfritt (appen fungerar fullt ut lokalt
  utan konto — kontot krävs bara för synk mellan flera av användarens egna
  enheter och för delningslänkar).

### Realtid
- WebSocket-baserad statuskanal mellan app ↔ cast-motor ↔ (ev.) relay ↔
  mottagare, för play/paus/skrubb-kommandon och statusuppdateringar
  (buffring, klar, fel) i nästan realtid (<300ms upplevd fördröjning för
  kontroller).

### Streaming
- **Lokala filer:** en inbäddad lättviktig HTTP-server körs tillfälligt på
  avsändarens enhet (telefonen) så att Chromecast/DLNA-mottagaren kan
  *hämta* filen via en URL — detta är hur i princip alla cast-appar löser
  "jag vill visa en fil som ligger lokalt på min telefon" (samma teknik
  Chromecast-appar och DLNA-servrar alltid använder; det finns ingen annan
  standardväg).
- **Molninnehåll** (redan på nätet, t.ex. en video från en molntjänst):
  mottagaren pekas direkt på url:en, ingen proxy behövs.

---

## 9. Begränsningar — vad som faktiskt går, vad som inte gör det

Det här är den viktigaste sektionen att vara ärlig om, eftersom hela
löftet ("automatiskt, inga protokoll") lätt blir ett *marknadsföringslöfte
tekniken inte kan hålla* om vi inte designar runt begränsningarna medvetet.

| Begränsning | Verklighet | Lösning i FredCast |
|---|---|---|
| **AirPlay kan i praktiken bara *skickas* från Apple-plattformar** | Det finns inget officiellt sätt för en Android- eller Windows-app att agera AirPlay-*sändare* till en Apple TV/HomePod. Reverse-engineerade bibliotek finns men är instabila, kan sluta fungera vid Apple-uppdateringar, och är juridiskt/App Store-mässigt riskabla. | På Android/Windows: rikta Apple TV-mål via vår **PWA-receiver** istället (öppna FredCast Receiver i Apple TV:ns webbläsare/Safari om tillgängligt) eller via DLNA om Apple TV:n har ett DLNA-lager installerat (sällan default). Var ärlig i UI:t: "Apple TV kräver att du öppnar FredCast på TV:n en gång" istället för att låtsas att det bara funkar. |
| **Miracast/Wi-Fi Direct-skärmspegling är OS-nivå, inte app-nivå** | En vanlig 3:e-partsapp kan i regel inte trigga systemets Miracast-spegling programmatiskt på varken Android eller Windows. | Utelämna riktig Miracast-mirroring ur produkten; erbjud istället "skicka fil/bild" (vilket *är* möjligt) snarare än full skärmspegling. Om mirroring efterfrågas, guida användaren till OS:ets egna "Skärmspegling"-inställning (vi kan inte automatisera den delen ärligt). |
| **mDNS/Bonjour-upptäckt kan blockeras** av gäst-Wi-Fi, VLAN-isolering (vanligt i mesh-routrar/företagsnät), eller iOS Local Network-behörighet som nekats | Discovery hittar då 0 enheter trots att TV:n står i samma rum. | 1) Tydlig "Inga skärmar hittade"-vy med konkret felsökning ("Är telefon och TV på samma Wi-Fi? Har du tillåtit lokal nätverksåtkomst?"). 2) **QR/kod-fallback** som kringgår mDNS helt via en molnrelä — detta löser den vanligaste supportfrågan i castingappar. |
| **Filformat som mottagaren inte kan avkoda** (t.ex. vissa HEVC/exotiska kodekar på äldre Chromecast) | Uppspelning misslyckas tyst eller med kryptiskt fel. | Serverstödd omkodning on-the-fly är en **v2-funktion**, kräver egen kompute-kostnad — flaggas tydligt i roadmap, inte MVP. |
| **Bakgrundskörning på iOS** | iOS begränsar hårt bakgrunds-discovery och långlivade bakgrundsanslutningar. | Discovery/anslutning sker medan appen är i förgrunden eller under kort bakgrundsfönster; long-running uppspelning hanteras av mottagarenheten själv (TV:n spelar oberoende när den väl fått media-URL:en), telefonen behöver bara vara aktiv för att *skicka* kommandon. |
| **App Store-policy** kring skärminnehåll/DRM-skyddat material | Vi kan inte casta DRM-skyddat innehåll (Netflix etc.) rakt av — det är inte tekniskt tillåtet och inte heller meningen med produkten. | Positionera tydligt: FredCast är till för *eget* innehåll (foton, video, dokument, musik man äger/har rättighet till) — inte ett verktyg för streamingtjänster. |
| **Relay-fallback kostar pengar & är sämre integritet** | Om LAN-anslutning misslyckas och vi faller tillbaka på molnrelä, går faktisk mediadata via vår server. | Endast metadata/signallering går via relay som standard (WebRTC P2P efter handskakning återupprättar direktkoppling så snart det går); ren server-relay av själva mediaströmmen är sista utväg och kräver användarens uttryckliga godkännande + tydlig kostnadskontroll för oss som produktägare. |

**Slutsats:** Löftet "du behöver aldrig veta vad det heter" **håller** för
Chromecast/Google TV/Android TV/de flesta Smart TV (DLNA) och för alla
skärmar med en webbläsare (via vår PWA-receiver + QR). Det håller **delvis**
för Apple TV om avsändaren är Android (kräver ett engångssteg: öppna
receiver-appen på TV:n). Det håller **inte** för generell skärmspegling via
Miracast. Det här ska vi vara transparenta om internt i produktbesluten,
även om UI:t aldrig exponerar tekniska termer utåt.

---

## 10. MVP — minsta version som fortfarande känns fantastiskt

**Inkluderat:**
- Dela-arket (Flöde B) + eget minimalt galleri (Flöde A) för bilder & video
- Discovery: Chromecast/Google Cast + DLNA/UPnP + egen PWA-receiver
  (täcker majoriteten av verkliga hem: Chromecast, Android TV, Google TV,
  de flesta Smart TV-märken, samt "alla skärmar med webbläsare" via QR)
- Rumsgrupperad enhetslista, favoriter, senast använd skärm
- Grundläggande videouppspelning + enkelt bildspel + Now Playing-kontroller
- QR-fallback för nätverksproblem
- Historik (lokal, ingen molnsynk krävs i MVP)
- Enkel felhantering enligt avsnitt 6-tabellen

**Medvetet utanför MVP (kan vänta):**
- AirPlay-sändning (kräver Apple-specifik nativ integration, se avsnitt 9)
- Musikbibliotek/spellistor
- Multi-cast till flera skärmar
- Konto/molnsynk mellan användarens egna enheter (appen funkar 100%
  lokalt utan inloggning i MVP)
- Delade album/länkar till andra personer
- Serverstödd omkodning av ovanliga filformat
- Widgetar, skärmspegling, desktop-appar

Detta MVP är fortfarande "magiskt" eftersom det löser 90% av det verkliga
användningsfallet (skicka en bild/video från telefonen till familjens TV)
med minimal friktion, utan att vi låtsas lösa saker som Miracast-mirroring
eller AirPlay-från-Android som inte går att göra pålitligt ännu.

---

## 11. Roadmap

### Version 1 — "Det bara funkar" (MVP, ovan)
Fokus: Chromecast/DLNA/PWA-receiver, dela-flödet, rumsgrupperad discovery,
QR-fallback, video/bild-cast, grundkontroller.

### Version 2 — "Hela hemmet"
- Nativ AirPlay-sändning (iOS/tvOS-avsändare)
- Musik + spellistor + kö
- Multi-cast till flera skärmar samtidigt
- Molnkälle-koppling (Drive/iCloud/Dropbox) i filhanteraren
- Drag & drop på iPad/desktop
- Konto + synk av favoriter/historik mellan egna enheter

### Version 3 — "Dela med andra"
- Dela album/spellistor med andra personer via länk (mottagaren behöver
  inte ens ha appen — öppnar i webbläsare)
- Serverstödd omkodning för ovanliga format
- Smarta scener/schemaläggning ("bildspel varje kväll kl 19 på köks-TV:n")
- Widgetar/kontrollcenter-genvägar

### Version 4 — "Plattformen"
- Desktop-appar (Mac/Windows) för att casta filer/skärminnehåll direkt från
  datorn
- Delad, samtidig flerpersons-kö till samma skärm (familjemiddags-läge)
- Öppet API/SDK för tredjepartsappar att integrera "Cast via FredCast"
  (à la hur andra appar idag integrerar Google Cast-knappen)
- Eventuellt: egen fysisk FredCast-dongle för de skärmar som saknar smart
  funktionalitet helt (ren hårdvaruexpansion av PWA-receiver-idén)

---

## Sammanfattning av de viktigaste avvikelserna från din ursprungliga brief

1. **"Dela" före "Välj"** — bygg för share-sheet-flödet som primärt
   användningssätt, det egna galleriet som sekundärt. Mindre friktion,
   möter användaren där den redan är.
2. **Rumsgruppering, inte protokollgruppering**, i enhetslistan — och
   dölj märkesnamn (Chromecast/DLNA) helt ur primär-UI.
3. **Persistent cast-bubbla** i navigationen istället för att kontrollerna
   bara finns på en egen flik — kontinuitet oavsett var man är i appen.
4. **En egen webbaserad PWA-receiver + QR-kod som universalfallback** — den
   pragmatiska lösningen som gör att "vilken skärm som helst" faktiskt
   blir sant för skärmar utan Cast/AirPlay/DLNA-stöd.
5. **Ärlighet i avsnitt 9** om var "automatiskt, protokollfritt" faktiskt
   inte kan hållas 100% (AirPlay från Android, Miracast-mirroring) —
   med konkreta UX-lösningar för varje gap, snarare än att lova något
   tekniken inte kan leverera.
