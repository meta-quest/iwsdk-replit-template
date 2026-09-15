---
name: iwsdk-debug
description: Debug continuous behavior in WebXR scenes — physics, animations, collisions, game loops, or any real-time interaction that happens too fast for an agent to observe. Uses ECS pause/step/snapshot/diff to freeze time and inspect state frame by frame.
---

# Debug Continuous Behavior

Real-time behavior (physics, animations, collisions, game loops) happens too fast for an agent to observe directly. By the time you take a screenshot, the action is over. This skill uses ECS time-control tools to freeze, step, and diff state frame by frame.

User request is in `$ARGUMENTS`.

## Core Workflow

Every debugging session follows this pattern:

1. **Set up** the scenario (position objects, aim controllers, etc.)
2. **`ecs_pause`** — freeze ECS updates right before the interesting moment
3. **`ecs_snapshot({ "label": "before" })`** — capture state before the action
4. **Trigger** the action (release grip, apply force, start animation, etc.)
5. **`ecs_step(count, delta)`** — advance a few frames at fixed timestep
6. **`browser_screenshot`** — visually verify what happened
7. **`ecs_snapshot({ "label": "after" })`** — capture state after stepping
8. **`ecs_diff({ "from": "before", "to": "after" })`** — see exactly what changed
9. **Repeat** steps 5-8, stepping further until the behavior completes
10. **`ecs_resume`** — return to normal execution when done

The key insight: **pause BEFORE triggering the action**, not after. If you pause after, you've already missed the first frames.

## Where the detail lives

| Read | When |
| ---- | ---- |
| [`references/tool-reference.md`](references/tool-reference.md) | You need the exact command surface — every `ecs` / `xr` subcommand, its arguments, and how far to step |
| [`references/patterns.md`](references/patterns.md) | You are debugging a specific class of problem and want a worked recipe |

## Notes

- **Snapshots overwrite** — only 2 are stored. Label them clearly ("before"/"after") and diff before taking new ones.
- **Resume is safe** — the first frame after resume uses a capped delta to prevent physics explosions from accumulated time.
- **Render loop continues while paused** — screenshots always work, and the XR session stays alive.
- **Stepping requires pause** — `ecs_step` will fail if you haven't called `ecs_pause` first.
