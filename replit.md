# IWSDK Starter Template

## Overview
WebXR starter template using IWSDK v0.5.3 with an ECS architecture on Three.js, targeting Meta Quest 3 and similar headsets. Pre-configured for the Replit headless environment.

This repo is the **remix build** for the Meta-device WebXR path: a user forks it
and asks an agent to turn the reference scene into their idea. It is not a blank
canvas — the scene that ships is a worked example of everything a headset app
needs, and the job on remix is to extend it, not to start over.

## Preserve the interaction building blocks (read this first)

The reference scene wires up four things that agents routinely delete when they
rewrite a scene. An app missing any of them feels broken in a headset. **Carry
all four into whatever gets built, unless the user explicitly asks to drop one.**

1. **Controller ray / pointer** — `src/ray.ts` (`ControllerRaySystem`). Forces
   both controller rays permanently visible (`RayDisplayMode.Visible`) and adds
   emissive hover/press feedback on every `RayInteractable`. IWSDK's default
   `VisibleOnIntersection` hides the ray until it hits something, which users
   read as "this app has no pointer".
2. **Full controller input mapping** — `src/input.ts` (`ControllerInputSystem`).
   A handler for trigger, grip, thumbstick and A/B/X/Y, plus a HUD panel
   (`public/ui/input-hud.uikitml`) mirroring live input values. Left grip
   toggles the soundtrack; grip also drives proximity grab in IWSDK itself, so
   the two layer rather than conflict.
3. **Background music + spatial audio** — `src/music.ts`
   (`BackgroundMusicSystem`) loops `public/audio/ambient-loop.wav`
   non-positionally, so it stays at a constant level wherever the player walks,
   and ducks out when the headset loses focus. Alongside it, the robot and cube
   carry positional `AudioSource` chimes (`public/audio/chime.mp3`) that fire on
   interaction, so sound also has a direction in the scene. A silent app is one
   of the most common things to lose in a rewrite — keep both halves.
4. **Grabbable objects** — the cube uses `OneHandGrabbable`, the plant uses
   `DistanceGrabbable`. At least one grabbable entity should always exist.

The header comment in `src/index.ts` repeats this list next to the code. If you
replace the scene's models and logic, re-attach these systems and components to
the new entities.

## Bundled skills

Task-specific IWSDK guides ship inside this project at `.agents/skills/` and come
with any remix: `iwsdk-planner` (architecture), `iwsdk-ui` (UIKitML panels),
`iwsdk-ray` (pointing and clicking), `iwsdk-grab` (direct grab), `iwsdk-physics`,
`iwsdk-debug` (frame-by-frame inspection), and `iwsdk-code-review`. Read the
relevant one before starting that kind of work. They are plain markdown with no
tool-specific syntax, so read them directly if your tooling does not pick them up
on its own. `AGENTS.md` lists what each covers.

Separately, a routing pack — `meta-device-router` plus per-path skills for React
Native/Expo, WebXR, and Ray-Ban Display web apps — decides *which* kind of Meta
app to build. It lives outside this repo and is not needed here: if you are in a
remix of this template, the WebXR path has already been chosen, and this file
plus `README.md` carry the essentials.

## Tech Stack
- **Framework**: @iwsdk/core with elics ECS
- **Rendering**: Three.js (aliased as super-three)
- **Language**: TypeScript
- **Build Tool**: Vite (port 5000)
- **Package Manager**: npm
- **UI System**: UIKitML — `.uikitml` sources loaded at runtime from `public/ui/` (no compile step since 0.5)
- **XR Emulation**: IWER via Playwright + SwiftShader

## Project Structure
- `src/` - Application logic (index.ts entry, components, systems)
- `iwsdk.config.json` - Project authority: scene path, world options, `dev.emulator`
- `public/ui/` - UIKitML markup files, served as-is
- `public/scenes/` - Native `.iwsdk.scene.json`; supplies sky + image-based lighting
- `public/` - Static assets (3D models, audio, textures)

## Deployment (GitHub Pages)
- GitHub Actions workflow at `.github/workflows/deploy.yml`
- Triggers on push to `main` or manual dispatch
- Builds with `npm ci` + `npm run build`, deploys `dist/` to GitHub Pages
- Base path auto-set via `VITE_BASE_PATH` env var (reads repo name from GitHub context)
- To use a custom domain, set `VITE_BASE_PATH=/` instead

## Replit Environment Setup
- **Port 5000**, host `0.0.0.0`, `allowedHosts: true` for Replit proxy
- **`https: false`** on `iwsdkDev()` — Replit terminates TLS at its proxy, so the
  origin must stay HTTP. IWSDK otherwise self-signs a certificate by default.
- **`IWSDK_DEV_OPEN=false`** in the `.replit` workflow — a project with
  `iwsdk.config.json` opens a managed Playwright browser on serve, and Replit's
  own webview already loads the app.
- **SwiftShader** — headless Chromium uses CPU rendering (no GPU needed)
- **GPU auto-detection** — managed Playwright browser supports `IWSDK_GPU=auto|gpu|swiftshader`; no manual SwiftShader patching needed

## System Dependencies (Nix)
Playwright Chromium needs: glib, nss, nspr, dbus, at-spi2-core, cups, libdrm, mesa, libgbm, xorg.libX11, xorg.libxcb, xorg.libXcomposite, xorg.libXdamage, xorg.libXext, xorg.libXfixes, xorg.libXrandr, libxkbcommon, pango, cairo, alsa-lib, expat, udev

## Three.js Imports
Always import from `@iwsdk/core`, never from `three`:
```typescript
import { Mesh, BoxGeometry, MeshStandardMaterial, Vector3 } from "@iwsdk/core";
```

## Scaffolding New Projects
```bash
npx @iwsdk/create@latest my-app --yes --mode vr
```
Key flags: `--mode vr|ar`, `--no-xr` (browser-only 3D), `--physics`, `--locomotion`, `--grabbing`, `--scene-understanding`, `--environment-raycast`.

## Reference System
Run `npx iwsdk reference warmup` once after first install.
```bash
npx iwsdk reference search --input-json '{"query":"grabbable object","limit":5}'
npx iwsdk reference api --input-json '{"name":"World.create"}'
npx iwsdk reference examples --input-json '{"api_name":"DistanceGrabbable"}'
npx iwsdk reference components --input-json '{}'
npx iwsdk reference systems --input-json '{}'
```

## Runtime Debugging (dev server must be running)

### Scene & ECS
```bash
npx iwsdk scene hierarchy
npx iwsdk scene transform --input-json '{"uuid":"<uuid>"}'
npx iwsdk ecs find --input-json '{"components":["DistanceGrabbable"]}'
npx iwsdk ecs query --input-json '{"entityIndex":3}'
npx iwsdk ecs set-component --input-json '{"entityIndex":3,"componentId":"Transform","field":"position","value":[2,1,-1.8]}'
npx iwsdk ecs pause
npx iwsdk ecs step --input-json '{"frames":1}'
npx iwsdk ecs resume
npx iwsdk ecs snapshot --input-json '{"label":"snap1"}'
npx iwsdk ecs diff --input-json '{"from":"snap1","to":"snap2"}'
```

### XR Emulation
Valid devices: `"headset"`, `"controller-right"`, `"controller-left"`, `"hand-right"`, `"hand-left"`

```bash
npx iwsdk xr enter
npx iwsdk xr set-transform --input-json '{"device":"headset","position":{"x":0,"y":1.6,"z":-2}}'
npx iwsdk xr look-at --input-json '{"device":"headset","target":{"x":0,"y":0.9,"z":0}}'
npx iwsdk xr animate-to --input-json '{"device":"headset","position":{"x":0,"y":1.5,"z":0},"duration":0.5}'
npx iwsdk xr select --input-json '{"device":"controller-right"}'
```

`set-device-state` uses nested JSON (different from other commands):
```bash
npx iwsdk xr set-device-state --input-json '{"controllers":{"right":{"position":{"x":0.2,"y":1.1,"z":0.3}}}}'
```

### Recovery
If XR commands time out or errors flood the terminal:
1. `npx iwsdk browser reload`
2. If that times out, restart the dev server
3. `npx iwsdk xr enter`
