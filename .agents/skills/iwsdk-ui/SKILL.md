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

## Where the detail lives

| Read | When |
| ---- | ---- |
| [`references/editing.md`](references/editing.md) | Writing or changing UIKitML markup — supported elements, units, selectors, and the iterate-and-verify loop |

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
