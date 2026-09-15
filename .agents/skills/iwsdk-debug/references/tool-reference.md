<!-- Reference for the `iwsdk-debug` skill. Open this when SKILL.md points you
here; it is not meant to be read end to end. -->

# Tool Reference

The debugging command surface, and how far to step at a time.

## Tool Reference

| Tool                                              | Purpose                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ecs_pause`                                       | Freeze all ECS system updates. Render loop continues — screenshots still work.      |
| `ecs_step({"count":N,"delta":SECONDS})`           | Advance N frames with fixed timestep (seconds). Must pause first.                   |
| `ecs_resume`                                      | Resume normal execution. First frame uses capped delta to avoid physics explosions. |
| `ecs_snapshot({"label":"..."})`                   | Capture full ECS state. Stores up to 2 snapshots.                                   |
| `ecs_diff({"from":"...","to":"..."})`             | Compare two snapshots. Shows added/removed entities and field-level value changes.  |
| `ecs_toggle_system({"name":"...","paused":true})` | Pause/resume a single system. Use `ecs_list_systems` to discover names.             |
| `browser_screenshot`                              | Visual verification — works while paused since the render loop continues.           |

## Stepping Guidelines

- **`delta`** is in seconds. Common values: `0.016` (60fps), `0.0139` (72fps/Quest refresh rate).
- **Start small** — step 1-3 frames first to catch the initial moment, then step more.
- **Don't overshoot** — stepping 100 frames at once defeats the purpose. Step in batches of 5-20.
