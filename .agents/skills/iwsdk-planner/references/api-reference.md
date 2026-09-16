<!-- Reference for the `iwsdk-planner` skill. Open this when SKILL.md points
you here; it is not meant to be read end to end. -->

# Feature and API Reference

Per-feature usage notes, plus the full component and system catalogues and the
list of things IWSDK already provides.

### 10. Audio System

```typescript
import {
  AudioSource,
  PlaybackMode,
  AudioUtils,
  InstanceStealPolicy,
  DistanceModel,
} from '@iwsdk/core';

// Adding audio to an entity
entity.addComponent(AudioSource, {
  src: 'audio/click.mp3',
  positional: true, // 3D spatial audio
  loop: false,
  autoplay: false,
  volume: 0.5,
  refDistance: 1,
  rolloffFactor: 1,
  maxDistance: 10000,
  maxInstances: 1,
  playbackMode: PlaybackMode.Restart,
});

// Playing audio
AudioUtils.play(entity);
```

**PlaybackMode:**

```typescript
PlaybackMode.Restart; // Stop current and restart
PlaybackMode.Overlap; // Always start new instance
PlaybackMode.Ignore; // Ignore if already playing
PlaybackMode.FadeRestart; // Fade out current, start new
```

**InstanceStealPolicy:**

```typescript
InstanceStealPolicy.Oldest; // Steal oldest instance
InstanceStealPolicy.Quietest; // Steal quietest instance
InstanceStealPolicy.Furthest; // Steal furthest instance
```

**DistanceModel:**

```typescript
DistanceModel.Linear; // Linear falloff
DistanceModel.Inverse; // Inverse falloff
DistanceModel.Exponential; // Exponential falloff
```

### 11. Physics System

**PhysicsBody - motion properties:**

```typescript
import { PhysicsBody, PhysicsState } from '@iwsdk/core';

entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic, // Static, Dynamic, Kinematic
  linearDamping: 0.0,
  angularDamping: 0.0,
  gravityFactor: 1.0,
  centerOfMass: [Infinity, Infinity, Infinity], // Infinity = auto-compute
});
```

**PhysicsState:**

```typescript
PhysicsState.Static; // Immovable (walls, floors)
PhysicsState.Dynamic; // Affected by physics
PhysicsState.Kinematic; // Moved by code, affects others
```

**PhysicsShape - collision shape AND material properties:**

```typescript
import { PhysicsShape, PhysicsShapeType } from '@iwsdk/core';

entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto, // Auto-detect from geometry
  dimensions: [0, 0, 0], // Shape-specific dimensions
  density: 1.0, // Affects mass
  restitution: 0.0, // Bounciness (0-1)
  friction: 0.5, // Sliding behavior
});
```

**PhysicsShapeType:**

```typescript
PhysicsShapeType.Sphere; // dimensions[0] = radius
PhysicsShapeType.Box; // dimensions = [width, height, depth]
PhysicsShapeType.Cylinder; // dimensions[0] = radius, dimensions[1] = height
PhysicsShapeType.Capsules; // dimensions[0] = radius, dimensions[1] = height
PhysicsShapeType.ConvexHull; // Convex wrapper around mesh
PhysicsShapeType.TriMesh; // Exact mesh geometry (expensive)
PhysicsShapeType.Auto; // Auto-detect from Three.js geometry
```

### 12. Grabbable Components

```typescript
import {
  OneHandGrabbable,
  TwoHandsGrabbable,
  DistanceGrabbable,
  MovementMode,
} from '@iwsdk/core';

// Basic single-hand grab
entity.addComponent(OneHandGrabbable, {});

// Constrained manipulation
entity.addComponent(OneHandGrabbable, {
  rotate: true,
  rotateMin: [0, -Math.PI, 0],
  rotateMax: [0, Math.PI, 0],
  translate: true,
  translateMin: [-2, 0, -2],
  translateMax: [2, 3, 2],
});

// Two-hand manipulation (with scaling)
entity.addComponent(TwoHandsGrabbable, {
  rotate: true,
  translate: true,
  scale: true,
  scaleMin: [0.5, 0.5, 0.5],
  scaleMax: [2, 2, 2],
});

// Distance grab
entity.addComponent(DistanceGrabbable, {
  rotate: true,
  translate: true,
  scale: true,
  movementMode: MovementMode.MoveTowardsTarget, // MoveTowardsTarget | MoveAtSource | RotateAtSource | MoveFromTarget
  returnToOrigin: false, // Snap back when released
  moveSpeed: 0.1, // Speed for MoveTowardsTarget mode
});
```

### 13. Environment/Lighting

```typescript
import {
  DomeGradient,
  DomeTexture,
  IBLGradient,
  IBLTexture,
} from '@iwsdk/core';

// Gradient sky dome (RGBA colors - 4 components)
entity.addComponent(DomeGradient, {
  sky: [0.2423, 0.6172, 0.8308, 1.0], // RGBA
  equator: [0.6584, 0.7084, 0.7913, 1.0], // RGBA
  ground: [0.807, 0.7758, 0.7454, 1.0], // RGBA
  intensity: 1.0,
});

// HDR texture sky
// NOTE: components take `src`. Only AssetManifest entries take `url`.
entity.addComponent(DomeTexture, {
  src: '/textures/sky.hdr',
});

// Image-based lighting from gradient
entity.addComponent(IBLGradient, {
  sky: [0.6902, 0.749, 0.7843, 1.0], // RGBA
  equator: [0.6584, 0.7084, 0.7913, 1.0], // RGBA
  ground: [0.807, 0.7758, 0.7454, 1.0], // RGBA
  intensity: 1.0,
});

// IBL from texture
entity.addComponent(IBLTexture, {
  src: 'room', // or URL to HDR
  intensity: 1.0,
  rotation: [0, 0, 0],
});
```

**Critical Environment Usage Notes:**

1. **Environment components MUST be added to the level root entity**, not arbitrary entities. The `EnvironmentSystem` queries require `LevelRoot`:

   ```typescript
   // ❌ BAD - Added to a random entity (silently ignored)
   someEntity.addComponent(DomeGradient, { ... });

   // ✅ GOOD - Added to the level root
   const root = world.activeLevel.value;
   root.addComponent(DomeGradient, { sky: [0.24, 0.62, 0.83, 1.0], ... });
   ```

2. **After changing environment properties, MUST set `_needsUpdate: true`** — changes are silently ignored without it:

   ```typescript
   root.setValue(DomeGradient, 'sky', [0.1, 0.2, 0.8, 1.0]);
   root.setValue(DomeGradient, '_needsUpdate', true); // Required!
   ```

3. **Background vs IBL are separate**: `DomeTexture`/`DomeGradient` controls the visible sky. `IBLTexture`/`IBLGradient` controls scene lighting (reflections, ambient). You can mix them:

   ```typescript
   root.addComponent(DomeTexture, { src: '/envs/sky.hdr', intensity: 0.9 });
   root.addComponent(IBLTexture, { src: 'room', intensity: 1.2 }); // Lighting only
   ```

4. **In AR sessions**, backgrounds (dome) are automatically hidden but IBL remains active for realistic lighting on virtual objects.

### 15. VisibilityState

```typescript
import { VisibilityState } from '@iwsdk/core';

VisibilityState.NonImmersive; // Browser mode (no XR)
VisibilityState.Hidden; // XR but not rendering
VisibilityState.Visible; // Full XR experience
VisibilityState.VisibleBlurred; // XR but focus lost

this.world.visibilityState.subscribe((state) => {
  switch (state) {
    case VisibilityState.NonImmersive:
      // Show 2D fallback UI
      break;
    case VisibilityState.Visible:
      // Full XR experience
      break;
    case VisibilityState.VisibleBlurred:
      // Pause game, show overlay
      break;
  }
});
```

### XR Session Optimization

Configure frame rate and foveation when the XR session becomes visible:

```typescript
this.world.visibilityState.subscribe((state) => {
  if (state === VisibilityState.Visible) {
    this.world.session?.updateTargetFrameRate(72); // Request 72 FPS
    this.world.renderer.xr.setFoveation(1); // Max foveation for performance
  }
});
```

### 21. Panel UI Pattern

```typescript
export class SettingsSystem extends createSystem({
  settingsPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/settings.json')],
  },
}) {
  init() {
    this.queries.settingsPanel.subscribe('qualify', (entity) => {
      const doc = PanelDocument.data.document[entity.index];
      const button = doc.getElementById('my-button');

      button.addEventListener('click', () => {
        AudioUtils.play(entity); // Audio feedback
      });
    });

    // React to XR visibility
    this.world.visibilityState.subscribe((state) => {
      const is2D = state === VisibilityState.NonImmersive;
      xrButton.setProperties({ display: is2D ? 'flex' : 'none' });
    });
  }
}
```

### 22. Environment Raycasting (AR Hit-Test)

`EnvironmentRaycastTarget` makes an entity automatically follow XR hit-test results (raycast against real-world surfaces). The entity is positioned at the hit point and oriented to match the surface normal.

```typescript
import { EnvironmentRaycastTarget, RaycastSpace } from '@iwsdk/core';

// Reticle that follows right controller ray
const reticle = world.createTransformEntity(reticleMesh);
reticle.addComponent(EnvironmentRaycastTarget, {
  space: RaycastSpace.Right, // Ray source
  maxDistance: 100, // Max raycast distance in meters
});

// For phone AR: tap-to-place (uses screen touch)
const marker = world.createTransformEntity(markerMesh);
marker.addComponent(EnvironmentRaycastTarget, {
  space: RaycastSpace.Screen, // Tracks screen touch
});

// Read hit-test result (e.g., to spawn an object on trigger press)
const xrResult = entity.getValue(EnvironmentRaycastTarget, 'xrHitTestResult');
if (xrResult && gamepad?.getSelectStart()) {
  spawnObject(entity.object3D.position.clone());
}
```

**RaycastSpace:**

```typescript
RaycastSpace.Left; // Left controller's target ray
RaycastSpace.Right; // Right controller's target ray (default)
RaycastSpace.Viewer; // Head/gaze direction
RaycastSpace.Screen; // Phone AR screen touch (tap-to-place)
```

**Prerequisites:** `features: { environmentRaycast: true }` and `xr.features: { hitTest: true }` in AR session mode.

### 23. Follower Component

Makes an entity follow another Object3D (typically the player's head for head-locked UI).

```typescript
import { Follower, FollowBehavior } from '@iwsdk/core';

entity.addComponent(Follower, {
  target: world.player.head, // Must be an Object3D
  offsetPosition: [0, -0.2, -0.8], // Offset in target's local space
  behavior: FollowBehavior.PivotY, // Rotation behavior
  maxAngle: 30, // Degrees before snapping forward
  tolerance: 0.4, // Meters of positional slack
  speed: 1, // Lerp speed
});
```

**FollowBehavior:**

```typescript
FollowBehavior.FaceTarget; // Fully face the target
FollowBehavior.PivotY; // Only rotate around Y axis (default)
FollowBehavior.NoRotation; // Follow position only, no rotation
```

**Note:** `target` must be an `Object3D` instance (e.g., `world.player.head`), not an entity.

### 24. CameraSource Component

Access device camera video as a texture. Useful for mixed reality effects or photo capture.

```typescript
import {
  CameraSource,
  CameraFacing,
  CameraState,
  CameraUtils,
} from '@iwsdk/core';

// Add camera to an entity
entity.addComponent(CameraSource, {
  // Input fields (user-configurable)
  deviceId: '', // Empty = auto-select based on facing
  facing: CameraFacing.Back, // Preferred camera direction
  width: 1920, // Requested resolution
  height: 1080,
  frameRate: 30,
});

// Read-only output fields (managed by CameraSystem):
// state: CameraState.Inactive | .Starting | .Active | .Error
// texture: VideoTexture (apply to materials)
// videoElement: HTMLVideoElement (advanced use)
```

**CameraFacing:**

```typescript
CameraFacing.Back; // Rear-facing camera
CameraFacing.Front; // Front-facing (selfie) camera
CameraFacing.Unknown; // Any available camera (default)
```

**CameraState:**

```typescript
CameraState.Inactive; // Not started
CameraState.Starting; // Async initialization in progress
CameraState.Active; // Stream running
CameraState.Error; // Failed to start
```

**CameraUtils** static class:

```typescript
// List available cameras (requests permission on first call)
const devices = await CameraUtils.getDevices();
const backCam = CameraUtils.findByFacing(devices, CameraFacing.Back);

// Capture current frame as canvas (for snapshot/processing)
const canvas = CameraUtils.captureFrame(cameraEntity);
if (canvas) {
  const texture = new CanvasTexture(canvas);
}
```

**Requires:** `features: { camera: true }`. Camera stream only activates during XR sessions.

### 25. PhysicsManipulation Component

Applies forces or velocity changes to physics bodies. **One-shot component** — `PhysicsSystem` applies the values and auto-removes it each frame.

```typescript
import { PhysicsManipulation } from '@iwsdk/core';

// Apply an impulse force
entity.addComponent(PhysicsManipulation, {
  force: [0, 10, 0],            // Force vector (one-shot impulse)
  linearVelocity: [0, 0, 0],    // Set linear velocity directly
  angularVelocity: [0, 0, 0],   // Set angular velocity directly
});
// PhysicsSystem applies these values and auto-removes PhysicsManipulation

// For sustained forces, re-add the component each frame:
update() {
  if (!entity.hasComponent(PhysicsManipulation)) {
    entity.addComponent(PhysicsManipulation, { force: [0, 5, 0] });
  }
}
```

### 26. ScreenSpace Usage Notes

`ScreenSpace` positions a `PanelUI` entity relative to the screen in non-XR (browser) mode.

**All position/size values are CSS strings**, not numbers:

```typescript
import { ScreenSpace } from '@iwsdk/core';

entity.addComponent(ScreenSpace, {
  width: '400px', // CSS size: '400px', '50vw', 'auto'
  height: '300px', // CSS size: '300px', '40vh', 'auto'
  top: '20px', // CSS position or 'auto'
  left: '20px', // CSS position or 'auto'
  bottom: 'auto',
  right: 'auto',
  zOffset: 0.2, // Distance in meters from camera near plane (NOT CSS)
});
```

**How it works:** The system creates hidden DOM elements and uses `getComputedStyle()` to convert CSS values → pixels → meters. This means any valid CSS expression works (`calc()`, `vw`, `vh`, `%`, etc.).

**XR behavior:** When entering XR, `ScreenSpaceUISystem` automatically moves the panel back to world space. When exiting XR, it re-positions to screen space.

## Core Components Reference (30 Total)

| Component                | Purpose                        |
| ------------------------ | ------------------------------ |
| Transform                | Position, rotation, scale      |
| Visibility               | Show/hide objects              |
| LevelTag                 | Marks level membership         |
| LevelRoot                | Level root marker              |
| Interactable             | Marks interactive objects      |
| Hovered                  | Currently hovered              |
| Pressed                  | Currently pressed/grabbed      |
| OneHandGrabbable         | Single-hand manipulation       |
| TwoHandsGrabbable        | Two-hand manipulation          |
| DistanceGrabbable        | Grab from distance             |
| Handle                   | Manipulation handle            |
| PhysicsBody              | Physics motion properties      |
| PhysicsShape             | Collision shape + material     |
| PhysicsManipulation      | Force/velocity application     |
| DomeGradient             | Gradient sky                   |
| DomeTexture              | Textured sky                   |
| IBLGradient              | Gradient IBL lighting          |
| IBLTexture               | Texture IBL lighting           |
| PanelUI                  | UI panel configuration         |
| PanelDocument            | Loaded UI document             |
| ScreenSpace              | Screen-attached UI             |
| Follower                 | Object following               |
| XRPlane                  | Detected AR planes             |
| XRMesh                   | Detected AR meshes             |
| XRAnchor                 | Spatial anchors                |
| AudioSource              | Audio configuration            |
| CameraSource             | Camera device                  |
| DepthOccludable          | Depth-based occlusion for AR   |
| LocomotionEnvironment    | Locomotion settings            |
| EnvironmentRaycastTarget | AR environment hit-test target |

## Core Systems Reference (19 Total)

| System                   | Priority | Purpose                        |
| ------------------------ | -------- | ------------------------------ |
| LocomotionSystem         | -5       | Movement (teleport/slide/turn) |
| InputSystem              | -4       | Interactable state management  |
| GrabSystem               | -3       | Grab handling                  |
| PhysicsSystem            | -2       | Physics simulation             |
| SceneUnderstandingSystem | -1       | AR plane/mesh detection        |
| EnvironmentRaycastSystem | -1       | AR environment raycasting      |
| CameraSystem             | default  | Camera access                  |
| LevelSystem              | default  | Level loading                  |
| EnvironmentSystem        | default  | Lighting/sky                   |
| AudioSystem              | default  | Spatial audio                  |
| TransformSystem          | default  | Transform sync                 |
| VisibilitySystem         | default  | Visibility sync                |
| PanelUISystem            | default  | UI panels                      |
| ScreenSpaceUISystem      | default  | Screen UI                      |
| FollowSystem             | default  | Object following               |
| TurnSystem               | default  | Rotation                       |
| TeleportSystem           | default  | Teleportation                  |
| SlideSystem              | default  | Smooth movement                |
| DepthSensingSystem       | default  | Depth occlusion for AR         |

### Custom System Priority Guidelines

Register custom systems with priorities following input→simulation→rendering pipeline:

```
Priority 0-9:    Input capture (player input, AI decisions)
Priority 10-19:  Simulation (physics step, game logic)
Priority 20-29:  Visual sync (sync Three.js objects to physics)
Priority 30+:    Low-priority updates (UI, HUD, ambient effects)
```

Example:

```typescript
world
  .registerSystem(PlayerInputSystem, { priority: 0 })
  .registerSystem(AIDriverSystem, { priority: 1 })
  .registerSystem(PhysicsStepSystem, { priority: 10 })
  .registerSystem(VehicleSyncSystem, { priority: 20 })
  .registerSystem(DashboardSystem, { priority: 35 });
```

## What IWSDK Provides (Don't Rebuild These)

Before writing custom code, check if IWSDK already provides the functionality. Rebuilding built-in features wastes time and produces inferior results (missing BVH acceleration, XR compatibility, comfort features, etc.).

### Reinvention Risk Table

| What you might build from scratch     | What IWSDK already provides                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| GLTF loading with GLTFLoader          | `AssetManager.loadGLTF()` or `AssetManifest` in `World.create()`             |
| Ray/line mesh for controller pointing | `RayPointer` — cylinder + gradient shader + cursor circle (auto)             |
| Hover/click detection with Raycaster  | `Interactable` + `Hovered` + `Pressed` components                            |
| Custom skybox sphere                  | `DomeGradient` or `DomeTexture` component                                    |
| PBR environment lighting              | `IBLGradient` or `IBLTexture` component                                      |
| Teleport arc + landing marker         | `LocomotionSystem` — full visuals included                                   |
| Comfort vignette for motion           | `LocomotionSystem` — `comfortAssist` config                                  |
| Controller 3D models                  | Auto-loaded from WebXR Input Profiles                                        |
| Hand tracking meshes                  | `AnimatedHand` with skeletal mesh + outline                                  |
| Object grab + manipulation            | `OneHandGrabbable` / `TwoHandsGrabbable` / `DistanceGrabbable`               |
| Hit-test against real world           | `EnvironmentRaycastTarget` component                                         |
| Spatial audio                         | `AudioSource` component with pooling                                         |
| Camera feed texture                   | `CameraSource` component                                                     |
| Depth occlusion shader                | `DepthOccludable` component                                                  |
| HUD / screen-space UI                 | `ScreenSpace` component with CSS units                                       |
| Follow-head billboard                 | `Follower` component                                                         |
| Scene cleanup on level change         | `LevelSystem` + `LevelTag` (automatic)                                       |
| Gamepad button debouncing             | `StatefulGamepad` — `getButtonDown()` / `getButtonUp()`                      |
| Manual GPU cleanup with traverse      | `entity.dispose()` — destroys entity + cleans up geometry/materials/textures |
| Manual world-space positioning        | `setWorldPosition()` / `setWorldQuaternion()` utilities                      |
| Manual XR hit-test setup              | `EnvironmentRaycastTarget` component + `EnvironmentRaycastSystem`            |
| Manual camera video feed              | `CameraSource` component + `CameraUtils` static class                        |

### Asset Loading (AssetManager)

**Always use AssetManager** — never use raw `GLTFLoader`, `TextureLoader`, etc. AssetManager handles DRACO/KTX2 decoder setup, caching, and de-duplication automatically.

**Manifest pattern (preload at startup):**

```typescript
const world = await World.create(container, {
  assets: {
    myModel: {
      url: '/models/scene.glb',
      type: AssetType.GLTF,
      priority: 'critical',
    },
    mySound: {
      url: '/audio/click.mp3',
      type: AssetType.Audio,
      priority: 'background',
    },
    myTexture: { url: '/textures/wood.jpg', type: AssetType.Texture },
    myHDR: { url: '/textures/env.hdr', type: AssetType.HDRTexture },
  },
});

// Retrieve preloaded assets (synchronous — already loaded)
const gltf = AssetManager.getGLTF('myModel');
const texture = AssetManager.getTexture('myTexture');
const audio = AssetManager.getAudio('mySound');
```

**Runtime loading (on-demand):**

```typescript
// Load at runtime when not known at startup
const gltf = await AssetManager.loadGLTF('/models/dynamic.glb', 'dynamicModel');
const texture = await AssetManager.loadTexture(
  '/textures/new.jpg',
  'newTexture',
);
```

**Supported AssetTypes:** `GLTF`, `Audio`, `Texture`, `HDRTexture`

### Entity Parenting & Level Lifecycle

**Always use `createTransformEntity`** — never `scene.add()`. Entities created with `createTransformEntity` get a `Transform` component, participate in ECS queries, and are automatically managed by the level system.

```typescript
// Basic entity with parent
const entity = world.createTransformEntity(mesh, parentEntity);

// With options object
const entity = world.createTransformEntity(mesh, {
  parent: parentEntity,
  persistent: false, // false (default) = destroyed when level changes
});

// Persistent entity — survives level changes
const hud = world.createTransformEntity(hudMesh, {
  parent: world.sceneEntity,
  persistent: true,
});
```

**Level lifecycle:**

- Entities with `LevelTag` are automatically destroyed when `world.loadLevel()` is called
- Non-persistent entities created via `createTransformEntity` automatically get `LevelTag`
- Use `persistent: true` for entities that should survive level transitions (HUDs, audio managers, etc.)
- `world.loadLevel(url)` destroys all level-tagged entities, then loads the new GLXF scene

**Warning:** Parenting an Object3D under another Object3D that is NOT an entity's `object3D` will silently reparent it to the scene root and log a warning.

### Input & Interaction

**Interactable → Hovered/Pressed flow:**

1. Add `Interactable` component to any entity that should respond to pointer input
2. `InputSystem` automatically performs BVH-accelerated raycasting each frame
3. When a ray hits an Interactable entity, `Hovered` tag is added
4. When the user presses the select button while hovering, `Pressed` tag is added
5. Query for `Hovered`/`Pressed` in your system to react to interactions

```typescript
// Setup
entity.addComponent(Interactable);

// In your system — react to interactions
export class MyInteractionSystem extends createSystem({
  hovered: { required: [MyComponent, Hovered] },
  pressed: { required: [MyComponent, Pressed] },
}) {
  init() {
    this.queries.pressed.subscribe('qualify', (entity) => {
      // Entity was just clicked/selected
    });
  }
}
```

**StatefulGamepad API** (accessed via `this.input.gamepads.left` / `.right`):

- `getButtonDown(InputComponent.Trigger)` — true on the frame the button was pressed
- `getButtonUp(InputComponent.Trigger)` — true on the frame the button was released
- `getButtonPressed(InputComponent.Trigger)` — true while held
- `getButtonValue(InputComponent.Trigger)` — analog 0-1
- `getAxesValues(InputComponent.Thumbstick)` — `{ x, y }` in -1 to 1 range
- `getAxesEnteringUp/Down/Left/Right(InputComponent.Thumbstick)` — directional flick detection

### Built-in Visuals (Don't Recreate)

These visuals are automatically created and managed by IWSDK systems:

- **RayPointer** — Cylinder mesh with gradient shader + circular cursor at hit point. Created automatically by `InputSystem` for each connected controller.
- **AnimatedController** — GLTF controller models auto-loaded from the WebXR Input Profiles registry. Matches the user's actual hardware.
- **AnimatedHand** — Skeletal hand mesh with outline shader for hand tracking mode. Auto-managed by the input system.
- **Teleport visuals** — Parabolic arc + landing circle indicator. Rendered by `LocomotionSystem` when teleport mode is active.
- **Comfort vignette** — Screen-edge darkening during smooth locomotion. Controlled by `locomotion.config.comfortAssist` (0 = off, 1 = maximum).
- **DomeGradient / DomeTexture** — Sky dome rendering. Add the component to an entity; `EnvironmentSystem` handles the rest.
