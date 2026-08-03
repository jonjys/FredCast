# FredCast

**Universal Cast** — världens enklaste sätt att streama och dela innehåll till
en TV eller annan skärm. *Välj eller dela något → Välj skärm → Klart.* Ingen
Chromecast/AirPlay/DLNA-kunskap krävs av användaren — appen avgör automatiskt
hur innehållet skickas.

Status: tidig utvecklingsfas. `mobile/` innehåller ett körbart Expo/React
Native-skelett av MVP:t (navigation, designsystem, mock cast-motor) — se
dokumenten nedan för produktplan, UX-flöden och arkitekturen det bygger på.

## Dokumentation

- [`docs/PRODUCT_PLAN.md`](docs/PRODUCT_PLAN.md) — fullständig produktplan:
  användarflöden, alla skärmar, navigation, designsystem, discovery,
  cast-upplevelse, funktionslista (MVP + framtid), teknisk arkitektur,
  begränsningar, MVP-scope och roadmap (v1–v4).
- [`docs/wireframes.html`](docs/wireframes.html) — lo-fi visuell prototyp:
  tre huvudflöden och tio nyckelskärmar, byggt på designsystemets
  tokens i både mörkt och ljust läge.
- [`docs/MVP_BACKLOG.md`](docs/MVP_BACKLOG.md) — MVP-scopet nedbrutet i
  epics/user stories med acceptanskriterier, redo för utvecklingsstart.

## Appen (`mobile/`)

Expo (React Native + TypeScript) — samma kodbas för iOS och Android
(PRODUCT_PLAN.md §8). Implementerat hittills:

- **Navigation**: bottentabbar Idag / Bibliotek / Skärmar / Inställningar,
  plus fullskärms Now Playing och QR-anslutning som modaler.
- **Designsystem**: `src/theme/tokens.ts` — samma färg-/typ-/spacing-tokens
  som `docs/wireframes.html`, mörkt och ljust läge.
- **Cast-motor** (`src/cast/`): protokoll-agnostiskt gränssnitt
  (`discover/connect/sendMedia/control/disconnect`, se Epic 1 i
  MVP_BACKLOG.md).
  - `MockAdapter` simulerar discovery/anslutning/sändning så hela UX-flödet
    går att köra och testa utan fysisk Chromecast/DLNA-TV.
  - `PwaReceiverAdapter` är **på riktigt implementerad**, inte en stub: den
    parar ihop appen med `receiver/index.html` (en sida man öppnar i valfri
    skärms webbläsare) via en kortkod och `relay/` (WebSocket-relayserver),
    och skickar riktiga media-/kontrollkommandon över den anslutningen. Det
    här är den universella reservlösningen från PRODUCT_PLAN.md §9 — och
    enda adaptern utan native-SDK-beroende, därför den första som byggts
    klar på riktigt.
  - `GoogleCastAdapter`/`DlnaAdapter` är fortsatt strukturella stubbar med
    TODO-kommentarer för de native-moduler riktig Cast/DLNA-discovery
    kräver (kräver att man lämnar Expo Go för en custom dev client).
- **Skärmar**: hemskärm, enhetslista (rumsgrupperad, favoriter pinnade),
  galleri (mock-bilder/video/filer), cast-bottensheet, Now Playing,
  Inställningar, QR-fallback.

### Köra appen

```bash
cd mobile
npm install
npm run web      # snabbast att verifiera i webbläsare (react-native-web)
npm run ios       # kräver macOS/simulator
npm run android   # kräver Android-emulator
```

Riktig enhetsdiscovery (Cast/DLNA) kräver native-moduler och en custom dev
client — se TODO-kommentarerna i `src/cast/adapters/`.

## Relayn + Receiver-sidan (`relay/`, `receiver/`)

Den universella QR/kod-reservlösningen, körbar helt lokalt:

```bash
# 1. Starta relayservern (pairing + WebSocket-relay)
cd relay
npm install
npm start                       # lyssnar på :8787

# 2. Servera receiver-sidan (öppnas i valfri skärms webbläsare)
cd ../receiver
python3 -m http.server 8988     # eller vilken statisk filserver som helst
# öppna http://localhost:8988/index.html i en flik/skärm

# 3. Starta appen (peka den mot relayn om den inte körs på localhost:8787)
cd ../mobile
EXPO_PUBLIC_RELAY_WS_URL=ws://localhost:8787/ws npm run web
```

Gå till **Skärmar → Hittar du inte din skärm? Anslut med kod** i appen,
skriv in koden som visas på receiver-sidan, och tryck Anslut. Casta sedan
en bild eller video från Bibliotek som vanligt — den renderas på riktigt i
receiver-flikens `<img>`/`<video>`-tagg via relayn.

Relayn bär bara korta JSON-kommandon (kod-parkoppling, media-URL,
play/pause) — den lagrar inga konton eller historik och stänger rum
automatiskt när båda sidor kopplat ner (se kommentarerna i
`relay/server.js` och avvägningen i PRODUCT_PLAN.md §9).