---
name: iwsdk-ui
description: Develop and iterate on IWSDK PanelUI components. Use when the user wants to create, modify, debug, or improve UI panels in their IWSDK application. Covers UIKITML editing, full-screen preview with ScreenSpace, and visual verification.
---

# UI Panel Development

Efficiently develop and iterate on IWSDK PanelUI panels using ScreenSpace for full-screen 2D preview. The workflow has a **required core** (setup for iteration) and **optional extensions** (the actual UI work, driven by user intent).

User request is in `$ARGUMENTS`.

## Required Core

### Step 1: Identify the panel

Find the panel entity and its UIKITML source file.

- Panel entities have the `PanelUI` component. Use `ecs_find_entities` with `withComponents: ["PanelUI"]` to find them.
- Read the `PanelUI` component's `config` field with `ecs_query_entity` to find the JSON path (e.g., `./ui/welcome.json`).
- The UIKITML source lives in `ui/` with the same name but `.uikitml` extension (e.g., `ui/welcome.uikitml`).

### Step 2: Set up full-screen preview

The ScreenSpace component positions a panel in front of the camera so it appears as a 2D UI — ideal for fast iteration.

**If the entity already has ScreenSpace:** Note the current settings so they can be restored later.

```
ecs_query_entity(entityIndex, components: ["ScreenSpace"]) → save the values
```

**If the entity does not have ScreenSpace:** You will need to add it in code.

Either way, set ScreenSpace to fill the entire viewport in code:

```typescript
.addComponent(ScreenSpace, {
  top: "0px",
  left: "0px",
  width: "100vw",
  height: "100vh",
});
```

Setting this in code (not via `ecs_set_component`) ensures it persists across hot reloads.

### Step 3: Verify setup

Take a `browser_screenshot` to confirm the panel fills the screen and is ready for iteration.

## UI Editing

This is where the user's request drives the work. Edit the `.uikitml` file in `ui/`.

### Key facts about UIKITML

- UIKITML is a **subset of HTML**, not all syntax is supported.
- **Before writing markup**, look up the supported UIKITML element types and CSS
  properties: `npx iwsdk reference search --input-json '{"query":"uikitml interpret container text"}'`.
  Search for the specific element types you need.
- Supported selectors: `#id` and `.class` (via PanelDocument's `querySelector`).
- Units are in **centimeters** (e.g., `width: 50` = 50cm). World space uses meters. `100cm = 1m`.
- The `.uikitml` file is the source of truth. Since IWSDK 0.5 it is loaded at
  runtime straight from `public/ui/` — there is no compile step and no generated
  `.json`. Saving the file hot-reloads it.
- On IWSDK 0.4.x and earlier the file was compiled to a `.json` alongside it;
  if you are on that version, edit the `.uikitml` and treat the `.json` as
  generated output.

### Verify changes

After each edit to the `.uikitml` file:

1. Wait a moment for the dev server to hot-reload.
2. Take a `browser_screenshot` to visually verify the change.
3. If needed, re-read the `.uikitml` to check the element tree and class
   definitions against what you see rendered.

Repeat the edit-screenshot cycle as needed.

## Cleanup (Required)

When done with UI work, **always** restore the ScreenSpace component to its original state.

**If it had ScreenSpace before:** Restore the original values that were noted in Step 2.

```typescript
// Restore original settings
.addComponent(ScreenSpace, {
  top: "20px",
  left: "20px",
  height: "40%",
  // ... whatever was noted
});
```

**If it did not have ScreenSpace before:** Remove the ScreenSpace component addition from code.

Take a final `browser_screenshot` to confirm the panel is back to its normal state.

## Notes

- **Always edit `.uikitml`.** On versions that still emit a `.json`, that file
  is generated output and will be overwritten.
- **ScreenSpace behavior in VR:** When entering VR, ScreenSpace automatically detaches the panel from the camera and it returns to world-space positioning. This is handled by the ScreenSpaceUISystem.
- **PanelDocument for element access:** Use `getElementById(id)` or `querySelector(selector)` on the PanelDocument to access UI elements programmatically in systems. Elements can be named with `.name = "id"` to make them discoverable in the scene hierarchy.
- **ScreenSpace uses CSS strings, not numbers** — always pass string values like `"400px"`, `"100vw"`, `"20px"`.
