<!-- Reference for the `iwsdk-ui` skill. Open this when SKILL.md points you
here; it is not meant to be read end to end. -->

# Editing UIKitML

Markup rules and the edit/verify loop.

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
