---
name: iwsdk-code-review
description: Reviews code in IWSDK projects (apps built with IWSDK) for correct framework usage, ECS patterns, performance, and best practices. Use after writing or modifying code in an IWSDK application.
---

Review IWSDK (Immersive Web SDK) application code for correct framework usage,
ECS best practices, and common pitfalls.

**Important:** this reviews **projects built with IWSDK** (applications), not the
IWSDK framework source itself. Focus on framework usage, not framework internals.

Read the `iwsdk-planner` skill alongside this one — it holds the architectural
patterns and component reference the checks below assume. Reviewing is read-only:
inspect files and run read-only commands, and report findings rather than editing.

## Review Process

When invoked:

1. **Identify the project files** - Look for `src/` directory, `index.ts`/`index.js` entry point, system files, component files.

2. **Check World.create() configuration** - This is critical. Review feature flags and their prerequisites.

3. **Review each system file** against the checklist below.

4. **Check component definitions** for proper typing.

5. **Report findings** organized by priority:
   - **Critical** (will cause bugs/crashes)
   - **Warning** (should fix)
   - **Suggestion** (consider improving)

---

## The checklist

The twenty checks live in
[`references/review-checklist.md`](references/review-checklist.md) — open it and
work through it. They cover feature configuration, system statelessness,
allocations in `update()`, reactive patterns, `VisibilityState`, subscription
cleanup, component types and size, physics components, input, audio, Three.js
imports, signal access, `init()` handling of existing entities, asset loading,
entity creation, raycasting, environment components, and GPU disposal.

Two that catch the most issues, worth checking first:

- **Feature configuration** — features not enabled in `World.create` fail
  silently rather than erroring.
- **Three.js imports** — importing from `three` rather than `@iwsdk/core` gives
  you a second, incompatible copy of the library.

## Confidence-Based Reporting

Only report issues you're confident about:

- **95%+ confidence**: Report as Critical
- **80-95% confidence**: Report as Warning
- **60-80% confidence**: Report as Suggestion
- **<60% confidence**: Don't report (too speculative)

---

## Output Format

```markdown

## IWSDK Project Code Review

### Project Overview

- Entry point: [file]
- Systems: [list]
- Components: [list]
- Features enabled: [list from World.create]

### Critical Issues

- **[filename:line]** Issue description
  - Problem: `current code`
  - Fix: `suggested fix`

### Warnings

- **[filename:line]** Issue description

### Suggestions

- **[filename:line]** Improvement suggestion

### Feature Configuration Analysis

- locomotion: [enabled/disabled] - [assessment]
- physics: [enabled/disabled] - [assessment]
- grabbing: [enabled/disabled] - [assessment]

### Summary

[Brief summary of overall code quality and key recommendations]
```
