---
name: iwsdk-planner
description: IWSDK project planning and best practices guide. Use when planning new IWSDK features, designing systems/components, reviewing IWSDK code architecture, or when the user asks about IWSDK patterns, ECS design, signals, or reactive programming in this codebase.
---

# IWSDK Project Planner

You are an expert IWSDK (Immersive Web SDK) architect. Apply these patterns and best practices when planning, implementing, or reviewing IWSDK code.

## Core Architecture

IWSDK is built on three pillars:

1. **ECS (Entity Component System)** via `elics` library
2. **Reactive Signals** via `@preact/signals-core`
3. **Three.js Integration** with zero-copy transform binding (super-three v0.181.0)

## Where the detail lives

This file is the planning layer: the shape of an IWSDK app, what to avoid, and
how to approach a new feature. Open a reference only when you need it.

| Read | When |
| ---- | ---- |
| [`references/ecs-patterns.md`](references/ecs-patterns.md) | Writing a system or component — stateless systems, query subscribe/unsubscribe, signals, component types and design patterns, query filters, the system interface, the entity API |
| [`references/world-setup.md`](references/world-setup.md) | Configuring `World.create`, the feature flags, the initialization sequence, creating transform entities, or touching XR input, the player/XROrigin, locomotion or scene understanding |
| [`references/api-reference.md`](references/api-reference.md) | Using a specific feature — audio, physics, grabbing, environment/lighting, panel UI, raycasting, follower, camera, screen space — or you need the full component/system catalogue |
| [`references/assets.md`](references/assets.md) | Loading assets at runtime, or picking prototype art |

Two rules worth carrying without opening anything:

- **Systems are stateless.** Per-entity state belongs in components, not in
  system fields. This is the single most common IWSDK mistake.
- **Check what IWSDK already provides before building it.** Locomotion, grabbing,
  physics, panel UI, audio and environment are all built in — see
  [`references/api-reference.md`](references/api-reference.md).

## When Planning a New Feature

1. **Determine feature flags** - What built-in features does this need? (locomotion, physics, grabbing, etc.)
2. **Check prerequisites** - If using locomotion, is collision geometry set up?
3. **Identify components needed** - What data does this feature require?
4. **Design queries** - How will systems find relevant entities?
5. **Plan reactivity** - What changes should trigger updates?
6. **Consider lifecycle** - When are entities created/destroyed?
7. **Map to existing systems** - Can built-in systems (grab, physics, etc.) help?
8. **VR vs AR** - Does this work differently in each mode?
9. **Input handling** - What controller/hand inputs are needed?
10. **Audio feedback** - What sounds should play on interactions?
11. **Select 3D assets** - What models are needed? (see Asset Selection below)

## Anti-Patterns to Avoid

1. **DON'T** store entity arrays in systems - use queries
2. **DON'T** poll for state changes - use signal subscriptions
3. **DON'T** manually track component additions/removals - use query subscribe
4. **DON'T** create entities in update() without proper lifecycle management
5. **DON'T** use `Types.Object` for data that could be typed (use Vec3, Float32, etc.)
6. **DON'T** forget cleanup functions for subscriptions and resources
7. **DON'T** modify entities during query iteration without careful consideration
8. **DON'T** enable locomotion without collision geometry - player falls through world
9. **DON'T** enable features you don't use - adds overhead and can cause bugs
10. **DON'T** confuse PhysicsBody (motion) with PhysicsShape (collision + material)
11. **DON'T** use raw `GLTFLoader`/`TextureLoader` — use `AssetManager` for caching, DRACO/KTX2 setup
12. **DON'T** use `scene.add()` — use `createTransformEntity()` for proper ECS integration
13. **DON'T** use `new Raycaster()` — use `Interactable` component for BVH-accelerated XR interaction
14. **DON'T** add environment components (`DomeGradient`/`IBLTexture`/etc.) to arbitrary entities — must go on the level root (`world.activeLevel.value`)
15. **DON'T** forget `_needsUpdate` after changing environment properties — changes are silently ignored without `entity.setValue(DomeGradient, '_needsUpdate', true)`
16. **DON'T** use `entity.destroy()` for objects with GPU resources — use `entity.dispose()` which also cleans up geometry/materials/textures
17. **DON'T** pass numbers to `ScreenSpace` — all position/size values are CSS strings like `'400px'` or `'50vw'`

## Performance Tips

1. Use `getVectorView()` for direct TypedArray access (zero-copy)
2. Batch query enumeration (don't create intermediate arrays)
3. Use tag components for cheap boolean queries
4. Leverage query filters (`where`) to reduce iteration scope
5. System config signals auto-deduplicate (no callback if value unchanged)
6. Physics and locomotion can run in Web Workers for heavy scenes
7. Use `PhysicsShapeType.Auto` to let IWSDK pick optimal collision shape
