<!-- Reference for the `iwsdk-planner` skill. Open this when SKILL.md points
you here; it is not meant to be read end to end. -->

# ECS Patterns

How to write systems, components, queries and reactive state in IWSDK.
Read before adding any new system or component.

### 1. Keep Systems Stateless

Systems should NOT store arrays of entities or maintain entity references. Use queries instead.

```typescript
// ❌ BAD - Storing entity references
export class BadSystem extends createSystem({
  items: { required: [MyComponent] },
}) {
  private myEntities: Entity[] = []; // DON'T DO THIS

  init() {
    this.queries.items.subscribe('qualify', (entity) => {
      this.myEntities.push(entity); // BAD: manually tracking entities
    });
  }
}

// ✅ GOOD - Use queries for entity access
export class GoodSystem extends createSystem({
  items: { required: [MyComponent] },
}) {
  update() {
    // Query always gives current matching entities
    for (const entity of this.queries.items.entities) {
      // Process entity
    }
  }
}
```

**Exception:** Scratch variables for temporary per-frame calculations are OK.

### 2. Use Query Subscribe/Unsubscribe for Reactive Programming

Instead of polling or storing state, react to entity lifecycle events:

```typescript
export class ReactiveSystem extends createSystem({
  interactables: { required: [Interactable, Transform] },
}) {
  init() {
    // React when entities enter the query
    this.queries.interactables.subscribe('qualify', (entity) => {
      this.setupEventListeners(entity);
    });

    // React when entities leave the query
    this.queries.interactables.subscribe('disqualify', (entity) => {
      this.cleanupEventListeners(entity);
    });
  }
}
```

### 3. Use Signals for Reactive State

IWSDK uses `@preact/signals-core`. Prefer signals over manual state tracking:

```typescript
// System config properties are automatically signals
export class MySystem extends createSystem(
  {},
  {
    speed: { type: Types.Float32, default: 5.0 },
    jumpHeight: { type: Types.Float32, default: 2.0 },
  },
) {
  init() {
    // Subscribe to config changes reactively
    this.cleanupFuncs.push(
      this.config.speed.subscribe((newSpeed) => {
        console.log('Speed changed:', newSpeed);
      }),
    );
  }

  update(delta) {
    // Read signal value with .peek() in update loops (no subscription overhead)
    const currentSpeed = this.config.speed.peek();
  }
}
```

### World Globals Signals for Cross-System Communication

Store signals in `world.globals` for state that multiple systems need to read/write:

```typescript
// In index.ts (initialization)
import { signal } from '@preact/signals-core';

(world.globals as Record<string, unknown>).gamePaused = signal(true);
(world.globals as Record<string, unknown>).audioMasterVolume = signal(1.0);

// In any system (reading with peek() in hot paths)
const gamePaused = (this.globals.gamePaused as Signal<boolean>).peek();

// In any system (writing)
const gamePausedSignal = this.globals.gamePaused as Signal<boolean>;
gamePausedSignal.value = !gamePausedSignal.value;
```

### 4. Component Types (Complete List)

```typescript
import { Types } from '@iwsdk/core';

Types.Float32; // 32-bit float
Types.Float64; // 64-bit float (for physics engine refs)
Types.Int8; // 8-bit signed integer
Types.Int16; // 16-bit signed integer
Types.Int32; // 32-bit signed integer
Types.Uint32; // 32-bit unsigned integer
Types.Boolean; // true/false
Types.String; // text
Types.Vec3; // [x, y, z] - 3 floats
Types.Vec4; // [x, y, z, w] - 4 floats (quaternions)
Types.Color; // [r, g, b, a] - 4 floats (RGBA)
Types.Entity; // Reference to another entity
Types.Enum; // Enumerated value
Types.Object; // Any JS object (avoid if possible - not optimized)
```

### 5. Component Design Patterns

```typescript
import { createComponent, Types } from '@iwsdk/core';

// Tag component (no data, just marks entities)
export const Interactable = createComponent('Interactable', {}, '');

// Data component with proper types
export const Health = createComponent('Health', {
  current: { type: Types.Float32, default: 100 },
  max: { type: Types.Float32, default: 100 },
});

// With enums
export const State = createComponent('State', {
  mode: {
    type: Types.Enum,
    enum: { Idle: 'idle', Moving: 'moving', Attacking: 'attacking' },
    default: 'idle',
  },
});

// With vectors (stored as TypedArrays for performance)
export const Velocity = createComponent('Velocity', {
  linear: { type: Types.Vec3, default: [0, 0, 0] },
  angular: { type: Types.Vec3, default: [0, 0, 0] },
});

// With colors (RGBA, 4 components)
export const Tint = createComponent('Tint', {
  color: { type: Types.Color, default: [1, 1, 1, 1] },
});
```

### 6. Query Patterns with Filters

```typescript
export class DamageSystem extends createSystem({
  // Basic query
  enemies: { required: [Enemy] },

  // With exclusions
  vulnerableEnemies: {
    required: [Enemy, Health],
    excluded: [Invulnerable, Shield],
  },

  // With value filters
  lowHealth: {
    required: [Health],
    where: [lt(Health, 'current', 20)],
  },

  // Complex filters
  activeBosses: {
    required: [Boss, Health],
    where: [gt(Health, 'current', 0), eq(State, 'mode', 'attacking')],
  },
}) {}

// Available filter operators: eq, ne, lt, le, gt, ge, isin, nin
```

### 7. System Interface (Full)

```typescript
interface System {
  // World access
  world: World;

  // Query results
  queries: Record<string, Query>;

  // Reactive config (auto-created from schema)
  config: { [key]: Signal };

  // Cleanup registration
  cleanupFuncs: Array<() => void>;

  // XR/Player access
  player: XROrigin;
  input: XRInputManager;

  // Three.js access
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;

  // XR state
  visibilityState: Signal<VisibilityState>;
  xrManager: WebXRManager;
  xrFrame: XRFrame;

  // Shared state
  globals: Record<string, any>;

  // Entity creation helpers
  createEntity(): Entity;
  createTransformEntity(object?: Object3D, parent?: Entity): Entity;

  // Lifecycle
  init(): void;
  update(delta: number, time: number): void;
  play(): void;
  stop(): void;
}
```

### 27. Entity API

```typescript
// Destroy entity only (components removed, Object3D detached)
entity.destroy();

// Destroy entity AND dispose GPU resources (geometry, materials, textures)
// Use for entities with meshes/materials that need proper GPU cleanup
entity.dispose();

// Get all component classes attached to this entity
entity.getComponents();
```

**`dispose()` vs `destroy()`:** Use `dispose()` when the entity has meshes, materials, or textures that should be freed from GPU memory. Use `destroy()` when GPU resources are shared or managed elsewhere. Use `dispose()` with caution when resources may be shared across multiple entities.

### 28. Utility Functions

```typescript
import { setWorldPosition, setWorldQuaternion } from '@iwsdk/core';

// Set world-space position (correctly handles parent transform chain)
setWorldPosition(object3D, worldPosition);

// Set world-space quaternion (correctly handles parent transforms including non-uniform scale)
setWorldQuaternion(object3D, worldQuaternion);
```

These are useful when you need to position an object in world space but it's nested under transformed parents. They compute the correct local transform to achieve the desired world transform.

```typescript
// Level root helpers on World:
world.getActiveRoot(); // Returns active level's Object3D (or scene)
world.getPersistentRoot(); // Returns the scene Object3D
```
