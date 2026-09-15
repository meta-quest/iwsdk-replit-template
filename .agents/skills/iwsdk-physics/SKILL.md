---
name: iwsdk-physics
description: Guide for implementing physics in IWSDK projects. Use when adding physics simulation, configuring rigid bodies, collision shapes, applying forces, creating grabbable physics objects, or troubleshooting physics behavior.
---

# IWSDK Physics System Guide

This skill provides the complete reference and workflow for implementing Havok-powered physics simulation in IWSDK applications. Physics is built on three ECS components (`PhysicsBody`, `PhysicsShape`, `PhysicsManipulation`) orchestrated by the `PhysicsSystem`.

## Enabling Physics

Enable physics in `World.create` with the `physics` feature flag:

```typescript
import { World, SessionMode } from '@iwsdk/core';

const world = await World.create(container, {
  xr: { sessionMode: SessionMode.ImmersiveVR },
  features: {
    physics: true,
    grabbing: true, // Required if physics objects should be grabbable
    locomotion: true, // Requires collision geometry in the scene
  },
  level: './glxf/Composition.glxf',
});
```

Setting `physics: true` automatically registers `PhysicsBody`, `PhysicsShape`, `PhysicsManipulation` components and the `PhysicsSystem` at priority `-2`.

**Only enable physics when needed.** If no objects require dynamic simulation, omit it to avoid overhead.

## Where the detail lives

This file covers enabling physics, choosing components, and the failures you are
most likely to hit. Load a reference only when you need it:

| Read | When |
| ---- | ---- |
| [`references/component-reference.md`](references/component-reference.md) | You need exact fields, types, defaults or enum values for `PhysicsBody`, `PhysicsShape` or `PhysicsManipulation` |
| [`references/workflows.md`](references/workflows.md) | You are building something — a falling object, a grabbable prop, a trigger volume, a custom physics system — and want a worked recipe |
| [`references/tuning-and-config.md`](references/tuning-and-config.md) | Behaviour is broadly right but needs tuning: material density/friction/restitution, system ordering, `PhysicsSystem` options, editor/GLXF setup, performance |

## Choosing components

Almost everything starts with two components on one entity:

- **`PhysicsBody`** — declares that the entity participates in simulation, and how:
  `Dynamic` (moved by forces), `Kinematic` (moved by you, pushes others), or
  `Fixed` (immovable). Pick `Fixed` for floors and walls, `Dynamic` for props.
- **`PhysicsShape`** — the collision volume plus its material. `PhysicsShapeType.Auto`
  derives the shape from the mesh and is the right default.

Add **`PhysicsManipulation`** only when you need to apply forces or impulses
imperatively. Grabbing is handled by the grabbing feature, not by this component.

Density is in **kg/m³** — real SI values, so steel is 7800 rather than 7.8. The
`1.0` default is a nominal unit density (roughly air), not water; see
[`references/tuning-and-config.md`](references/tuning-and-config.md) before mixing
defaults with realistic values.

## Troubleshooting

**Objects fall through the floor:**

- Ensure the floor entity has both `PhysicsShape` and `PhysicsBody` with `state: PhysicsState.Static`
- Verify the shape type and dimensions match the visual geometry
- If the `Auto` or `ConvexHull` is selected for the PhysicsShape of static objects, try to change into `TriMesh`
- Check that `physics: true` is set in `World.create` features

**Objects don't move:**

- Confirm `state` is `PhysicsState.Dynamic` (not Static or Kinematic)
- Check `gravityFactor` is > 0
- Verify both `PhysicsShape` and `PhysicsBody` are added (both are required)

**Objects are too bouncy or slide too much:**

- Lower `restitution` to reduce bouncing (0 = no bounce)
- Increase `friction` to reduce sliding (0.8+ for grippy surfaces)

**Objects move too slowly or feel sluggish:**

- Reduce `linearDamping` (0 = no air resistance)
- Check `density` is not too high (high density = heavy = resists force)

**Poor frame rate with many physics objects:**

- Use simpler shape types (Sphere/Box instead of ConvexHull/TriMesh)
- Use `TriMesh` only for static objects
- Explicitly set shape types instead of `Auto` to avoid detection overhead
- Reduce the number of dynamic bodies; make non-essential objects static

**Grabbed object doesn't follow hand:**

- Ensure `grabbing: true` in features
- Verify the entity has `Interactable` and a grabbable component (`OneHandGrabbable`, `TwoHandsGrabbable`, or `DistanceGrabbable`)

**PhysicsManipulation has no effect:**

- The entity must have a `PhysicsBody` with an active engine body (`_engineBody != 0`)
- The component is auto-removed after one frame; re-add it for sustained effects
- Force values may need to be larger; they are scaled by frame delta time
