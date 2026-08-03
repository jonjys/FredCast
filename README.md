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
  MVP_BACKLOG.md). En `MockAdapter` simulerar discovery/anslutning/sändning
  så hela UX-flödet går att köra och testa utan fysisk Chromecast/DLNA-TV.
  `GoogleCastAdapter`/`DlnaAdapter`/`PwaReceiverAdapter` finns som
  strukturella stubbar med TODO-kommentarer för de native-moduler som krävs
  för riktiga enheter (kräver att man lämnar Expo Go för en custom dev
  client).
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