<!-- Reference for the `iwsdk-physics` skill. Read this when SKILL.md points you here; it is not meant to be read end to end. -->

# Physics Tuning and Configuration

Material values, system ordering, `PhysicsSystem` options, editor/GLXF setup,
and performance guidance.

## Material Tuning Guide

Adjust `density`, `restitution`, and `friction` on `PhysicsShape` to simulate different materials.

**Density is in kg/m³.** The value is passed straight to Havok unscaled, and Havok
works in SI units (metres, kilograms, seconds), so these are real-world densities —
not the g/cm³ figures you'll find in most material tables.

| Material    | Density (kg/m³) | Restitution | Friction |
| ----------- | --------------- | ----------- | -------- |
| Foam/Light  | 50              | 0.1         | 0.6      |
| Wood        | 600             | 0.3         | 0.5      |
| Ice         | 900             | 0.1         | 0.05     |
| Bouncy ball | 1000            | 0.95        | 0.5      |
| Rubber      | 1100            | 0.8         | 0.9      |
| Concrete    | 2400            | 0.1         | 0.7      |
| Metal/Steel | 7800            | 0.2         | 0.4      |

⚠️ **The component default is `density: 1.0`, which is 1 kg/m³ — roughly air, not
water.** It is a nominal unit density, not a material. So an object left at the
default next to one set to steel (7800) has a 7800:1 mass ratio, and the light one
will get flung around by every collision.

Pick one convention per scene and stick to it:

- **Real SI values** (the table above) — set `density` explicitly on every dynamic
  body. Required if you use `applyImpulse`/`applyForce` anywhere, since those are
  absolute and mass-dependent.
- **Relative values** (wood 0.6, steel 7.8, …) — fine when nothing but gravity and
  collisions act on the scene, because uniformly scaling all masses leaves the
  behaviour unchanged. Breaks the moment you apply an explicit force.

Mixing the two is what produces "my object won't move" and "my object launched
into orbit".

## System Priority Order

Physics runs in a carefully orchestrated sequence:

```
Priority -5: LocomotionSystem  (Player movement)
Priority -4: InputSystem       (Controller/hand input)
Priority -3: GrabSystem        (Grab interactions)
Priority -2: PhysicsSystem     (Physics simulation)
Priority -1: SceneUnderstanding (AR plane/mesh updates)
```

Register custom physics-related systems after the built-in PhysicsSystem (priority > -2) to read updated transforms:

```typescript
world.registerSystem(MyPhysicsLogicSystem, { priority: 5 });
```

## PhysicsSystem Configuration

The system accepts a `gravity` config (defaults to Earth gravity):

```typescript
import { PhysicsSystem } from '@iwsdk/core';

const physicsSystem = world.getSystem(PhysicsSystem);
physicsSystem.config.gravity.value = [0, -9.81, 0]; // Earth gravity (default)
physicsSystem.config.gravity.value = [0, -1.62, 0]; // Moon gravity
physicsSystem.config.gravity.value = [0, 0, 0]; // Zero gravity
```

## GLXF / Editor Configuration

Physics components can be configured declaratively in GLXF scene files (exported by Meta Spatial Editor):

```json
{
  "com.iwsdk.components.PhysicsShape": {
    "shape": { "alias": "Auto", "value": 6 },
    "dimensions": { "value": [0, 0, 0] },
    "density": { "value": 1.0 },
    "friction": { "value": 0.5 },
    "restitution": { "value": 0.0 }
  },
  "com.iwsdk.components.PhysicsBody": {
    "state": { "alias": "DYNAMIC", "value": 1 },
    "gravityFactor": { "value": 1.0 },
    "linearDamping": { "value": 0.0 },
    "angularDamping": { "value": 0.0 }
  }
}
```

**State enum values in GLXF:**

- `0` = STATIC
- `1` = DYNAMIC
- `2` = KINEMATIC

**Shape enum values in GLXF:**

- `0` = Sphere
- `1` = Box
- `2` = Cylinder
- `3` = Capsules
- `4` = ConvexHull
- `5` = TriMesh
- `6` = Auto

## Performance Tips

1. **Use primitive shapes** (Sphere, Box, Cylinder) over ConvexHull/TriMesh whenever acceptable
2. **Use `PhysicsState.Static`** for all non-moving objects; static bodies have zero simulation cost
3. **Explicitly set shape types** in production; avoid `Auto` detection overhead
4. **Minimize dynamic body count** -- each dynamic body requires per-frame transform sync
5. **Use damping** to settle objects faster and reduce ongoing simulation work
6. **TriMesh is for static only** -- it is computationally expensive and should never be used on dynamic bodies
