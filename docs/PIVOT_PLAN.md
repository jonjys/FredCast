# PIVOT_PLAN — FredCast → fred-cast (Live-dashboards för FRED-platform)

> Status: 2026-08-13. Se STATUS-sektionen i [`README.md`](../README.md) och
> [`PRODUCT_PLAN.md`](PRODUCT_PLAN.md) för bakgrund. Detta dokument är
> migreringsplanen — vad som tas bort ur den nuvarande Universal
> Cast-prototypen och vad som byggs istället.

## Varför

FRED-plattformens mål är 30k MRR på 6 månader. Målgruppen är CFOs, och
värdeleveransen är att visa dem konkreta, live siffror — t.ex. "3,2M kr
sparad ränta" — i ett dashboard. Att casta bilder/video till en TV löser
inte det problemet. Cast-prototypen (`mobile/`, `relay/`, `receiver/`) är
klar och verifierad (inkl. live-streaming via WebRTC) men bygger inte mot
affärsmålet. Den fryses som referens (tag `v0.1.0-cast-prototype`) och
repot pivoteras till dashboards.

## Vad som tas bort

Allt nedan är del av Universal Cast-prototypen och tas bort från `main`
när pivot-migreringen genomförs (i en egen PR, inte del av dokumentations-PR:n
som lägger till detta dokument):

- **`mobile/`** — hela Expo/React Native-appen: navigation, designsystem,
  cast-motor (`src/cast/`, inkl. `MockAdapter`, `PwaReceiverAdapter`,
  `GoogleCastAdapter`/`DlnaAdapter`-stubbar), skärmar (hemskärm,
  enhetslista, galleri, Now Playing, `LiveScreen.tsx`, QR-fallback),
  `src/media/pickers.ts`.
- **`relay/`** — WebSocket-signaleringsservern (`server.js`) för
  pairing/relay och WebRTC-signalering (`webrtc-offer`/`webrtc-answer`/
  `webrtc-ice`).
- **`receiver/`** — den statiska mottagarsidan (`index.html` + QR-generering
  + WebRTC-mottagning för live-streamen).
- **All cast-logik i övrigt**, inklusive rot-nivå-konfiguration som bara
  finns för att deploya cast-delarna:
  - `render.yaml` (Render Blueprint för `relay/`)
  - Rot-`package.json`/`vercel.json` (Expo web-export av `mobile/`)
  - Cast-relaterade sektioner i `README.md` (Appen, Relayn + Receiver-sidan,
    Deploy (Vercel), Gör QR/kod-casting publikt) tas bort eller ersätts när
    de nya app/-sektionerna finns på plats.
- **Deployad infrastruktur** (`fred-cast.vercel.app` som cast-app,
  `fredcast-receiver-*.vercel.app`, `fredcast-relay.onrender.com`) kopplas
  bort/avvecklas i respektive plattform utanför detta repo när migreringen
  genomförs — de behålls inte som "levande" cast-produkter.

`docs/PRODUCT_PLAN.md`, `docs/wireframes.html` och `docs/MVP_BACKLOG.md`
rörs inte av borttagningen — de behålls som historiskt arkiv (redan
markerade som sådant via STATUS-sektionerna).

## Vad som byggs istället

Ny app-struktur för **fred-cast: Live-dashboards för FRED-platform**
(Modul 3 — Visualisering och Rapport):

- **Next.js 14** — App Router, ersätter Expo/React Native helt. Ingen
  mobilapp-kodbas; detta är ett webb-dashboard.
- **`app/dashboard/[id]`** — dynamisk route per dashboard/rapport-instans
  (t.ex. per kund/CFO-vy).
- **Recharts** — chart-biblioteket för visualisering (linjer, trender,
  sparade belopp etc.) i dashboarden.
- **FRED-client** — integrationsklient mot FRED-plattformens data (exakt
  gränssnitt/API specificeras i nästa steg av användaren, inte del av detta
  dokument).

Struktur, testupplägg (test-first för P0 Bugg 1–4) och exakta
`npm create next-app`-instruktioner kommer i ett separat steg efter att
dokumentations-/frys-/tagg-arbetet i detta dokument är klart.

## Migreringsordning (för nästa sprint, efter detta dokument är mergat)

1. Skapa ny branch från `main` (post-frys, via PR).
2. Scaffolda Next.js 14-appen (`npm create next-app`, instruktioner kommer
   separat).
3. Bygg `app/dashboard/[id]` + Recharts-baserad visualisering + FRED-client
   mot P0 Bugg 1–4 (test-first).
4. När ny app/-struktur är grön: ta bort `mobile/`, `relay/`, `receiver/`,
   samt rot-nivå-konfiguration listad ovan, i en egen PR.
5. Uppdatera `README.md`/`PRODUCT_PLAN.md` STATUS-sektioner till att peka på
   den nya strukturen istället för prototypen.

## Rollback

Om FRED-beslutet ändras: `v0.1.0-cast-prototype`-taggen pekar på sista
fungerande commit med hela cast-prototypen (inkl. live-streaming), så
arbetet i `mobile/`/`relay/`/`receiver/` går att återställa i sin helhet
utan att gräva i historiken.
