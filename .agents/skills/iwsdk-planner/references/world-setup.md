<!-- Reference for the `iwsdk-planner` skill. Open this when SKILL.md points
you here; it is not meant to be read end to end. -->

# World Setup, Input and Player

Configuring `World.create`, the initialization sequence, entity creation, and the
input/player/locomotion surfaces.

### 18. Feature Configuration (Critical!)

**Only enable features that your experience actually uses.** Features have prerequisites - enabling them without proper setup causes problems.

#### Feature Decision Matrix

| Feature              | Enable When                           | Prerequisites                              | If Missing                     |
| -------------------- | ------------------------------------- | ------------------------------------------ | ------------------------------ |
| `locomotion`         | Player needs to move (teleport/slide) | Collision geometry in scene (floor, walls) | **Player falls through world** |
| `physics`            | Objects need dynamic simulation       | PhysicsShape + PhysicsBody components      | Wasted overhead                |
| `grabbing`           | Objects are grabbable                 | Grabbable components on entities           | Wasted overhead                |
| `sceneUnderstanding` | AR with real-world surfaces           | AR session mode                            | Feature won't work             |
| `environmentRaycast` | AR object placement                   | AR session + hit-test support              | Feature won't work             |
| `spatialUI`          | Using PanelUI components              | UI config files                            | No UI renders                  |

#### Locomotion Requires Environment Setup

```typescript
// ❌ BAD - Locomotion enabled but no collision geometry
const world = await World.create(container, {
  features: {
    locomotion: true, // Player will fall through the floor!
  },
});

// ✅ GOOD - Locomotion with proper environment
const world = await World.create(container, {
  level: '/glxf/SceneWithFloor.glxf', // Scene has collision meshes
  features: {
    locomotion: true,
    physics: true, // Physics provides collision detection
  },
});

// ✅ GOOD - Static experience, no locomotion needed
const world = await World.create(container, {
  features: {
    locomotion: false, // Player stays at origin
    grabbing: true, // Can still interact with objects
  },
});
```

#### VR vs AR Feature Sets

```typescript
// VR Experience - typically needs locomotion
const vrWorld = await World.create(container, {
  xr: { sessionMode: SessionMode.ImmersiveVR },
  features: {
    locomotion: true, // Move around virtual space
    grabbing: true,
    physics: true,
  },
});

// AR Experience - player moves physically, no virtual locomotion
const arWorld = await World.create(container, {
  xr: {
    sessionMode: SessionMode.ImmersiveAR,
    features: { planeDetection: true, hitTest: true },
  },
  features: {
    locomotion: false, // Player walks in real world
    sceneUnderstanding: true, // Detect real surfaces
    environmentRaycast: true, // Place objects on surfaces
    grabbing: true,
  },
});
```

### 19. World Initialization Pattern

```typescript
import { World, SessionMode } from '@iwsdk/core';

const world = await World.create(container, {
  render: {
    fov: 50,
    near: 0.1,
    far: 200,
    defaultLighting: true, // Auto-creates DomeGradient + IBLGradient on level roots
    stencil: false, // Enable stencil buffer if needed
  },

  assets: {
    myModel: { url: '/models/scene.glb', type: AssetType.GLTF },
  },

  level: '/glxf/MyScene.glxf',

  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    referenceSpaceType: 'local-floor',
    requiredFeatures: ['hand-tracking'],
    optionalFeatures: ['plane-detection'],
    offer: 'once', // 'none' | 'once' | 'always' (default: 'always')
  },

  // Enable feature systems - ONLY what you need!
  features: {
    locomotion: true, // Only if scene has collision geometry
    // OR object form:
    // locomotion: {
    //   useWorker: true,
    //   initialPlayerPosition: [0, 0, 0],
    //   comfortAssist: 0.5,
    //   turningMethod: TurningMethod.SnapTurn,
    //   enableJumping: true,
    // },
    grabbing: true, // Only if objects are grabbable
    // OR object form: grabbing: { useHandPinchForGrab: true },
    physics: true, // Only if using dynamic physics
    sceneUnderstanding: true, // OR: { showWireFrame: true }
    environmentRaycast: true, // AR hit-test against real-world surfaces
    camera: true, // Camera video access (requires XR session)
    spatialUI: {
      forwardHtmlEvents: true,
      preferredColorScheme: 'dark',
    },
  },
});

// Register custom systems
world.registerSystem(MySystem);

// Launch/exit XR
world.launchXR();
world.exitXR();
```

### Post-Creation Initialization Sequence

After `World.create()`, follow this order for proper initialization:

```typescript
// 1. Create subsystems (physics engine, networking, etc.)
const simulator = await RaceSimulator.create({ useWorker: true });

// 2. Store shared state in world.globals
world.globals.raceSimulator = simulator;
(world.globals as Record<string, unknown>).carProxies = new Map();
(world.globals as Record<string, unknown>).gamePaused = signal(true);

// 3. Register components
world
  .registerComponent(VehiclePhysicsLink)
  .registerComponent(VehiclePhysicsState);

// 4. Setup scene (creates entities)
await setupScene(world, simulator, { aiCount: 5 });

// 5. Register systems with priorities
world
  .registerSystem(PlayerInputSystem, { priority: 0 })
  .registerSystem(PhysicsStepSystem, { priority: 10 });
```

### 20. Transform Entity Creation

```typescript
// Create entity with Object3D binding
const entity = world.createTransformEntity(mesh, {
  parent: parentEntity, // Optional parent
  persistent: false, // false = destroyed with level
});

// Transform component automatically syncs with Object3D (zero-copy)
entity.object3D.position.set(0, 1, 0);

// Or use component API
entity.setValue(Transform, 'position', [0, 1, 0]);

// Get vector view for efficient updates
const posView = entity.getVectorView(Transform, 'position');
posView[0] += delta; // Direct array write
```

### 8. XR Input System (Critical)

```typescript
update() {
  const leftGamepad = this.input.gamepads.left;
  const rightGamepad = this.input.gamepads.right;

  // Button states
  leftGamepad?.getButtonPressed(InputComponent.Trigger); // Currently pressed
  leftGamepad?.getButtonDown(InputComponent.Trigger);    // Just pressed this frame
  leftGamepad?.getButtonUp(InputComponent.Trigger);      // Just released this frame
  leftGamepad?.getButtonValue(InputComponent.Trigger);   // Analog value 0-1
  leftGamepad?.getButtonTouched(InputComponent.Trigger); // Finger touching

  // Special select button (primary action)
  leftGamepad?.getSelectStart(); // Primary button just pressed
  leftGamepad?.getSelectEnd();   // Primary button just released
  leftGamepad?.getSelecting();   // Primary button held

  // Thumbstick/touchpad axes
  const axes = leftGamepad?.getAxesValues(InputComponent.Thumbstick);
  console.log(axes?.x, axes?.y); // -1 to 1 range

  // Directional axes state
  leftGamepad?.getAxesEnteringUp(InputComponent.Thumbstick);
  leftGamepad?.getAxesEnteringDown(InputComponent.Thumbstick);
  leftGamepad?.getAxesEnteringLeft(InputComponent.Thumbstick);
  leftGamepad?.getAxesEnteringRight(InputComponent.Thumbstick);
}
```

**InputComponent Enum:**

```typescript
import { InputComponent } from '@iwsdk/core';

InputComponent.Trigger; // 'xr-standard-trigger'
InputComponent.Squeeze; // 'xr-standard-squeeze'
InputComponent.Touchpad; // 'xr-standard-touchpad'
InputComponent.Thumbstick; // 'xr-standard-thumbstick'
InputComponent.A_Button; // 'a-button'
InputComponent.B_Button; // 'b-button'
InputComponent.X_Button; // 'x-button'
InputComponent.Y_Button; // 'y-button'
InputComponent.Thumbrest; // 'thumbrest'
InputComponent.Menu; // 'menu'
```

### 9. Player/XROrigin Access (Critical)

```typescript
// Accessing player spatial hierarchy in a system
this.player; // XROrigin (Group) - VR rig root
this.player.head; // Head tracking (viewer pose)
this.player.raySpaces.left; // Left controller ray origin
this.player.raySpaces.right; // Right controller ray origin
this.player.gripSpaces.left; // Left controller grip position
this.player.gripSpaces.right; // Right controller grip position
this.player.secondaryRaySpaces.left; // Secondary left ray
this.player.secondaryRaySpaces.right; // Secondary right ray
this.player.secondaryGripSpaces.left; // Secondary left grip
this.player.secondaryGripSpaces.right; // Secondary right grip

// Getting world positions
const headPos = new Vector3();
this.player.head.getWorldPosition(headPos);

const rightHandPos = new Vector3();
this.player.gripSpaces.right.getWorldPosition(rightHandPos);
```

### 16. Locomotion Configuration

```typescript
import { LocomotionSystem, TurningMethod } from '@iwsdk/core';

const locomotion = world.getSystem(LocomotionSystem);

// All config properties are signals
locomotion.config.slidingSpeed.value = 3.0;
locomotion.config.turningMethod.value = TurningMethod.SmoothTurn; // 0=Snap, 1=Smooth
locomotion.config.turningAngle.value = 45;
locomotion.config.turningSpeed.value = 180;
locomotion.config.comfortAssist.value = 0.5;
locomotion.config.rayGravity.value = -0.4;
locomotion.config.jumpHeight.value = 1.5;
locomotion.config.jumpCooldown.value = 0.1;
locomotion.config.maxDropDistance.value = 5.0;
locomotion.config.useWorker.value = true;
locomotion.config.jumpButton.value = InputComponent.A_Button; // Button that triggers jump
locomotion.config.enableJumping.value = true; // Enable/disable jumping entirely
locomotion.config.initialPlayerPosition.value = [0, 0, 0]; // Starting position
```

**EnvironmentType** (used with `LocomotionEnvironment` component):

```typescript
import { EnvironmentType } from '@iwsdk/core';

EnvironmentType.STATIC; // Fixed geometry (walls, floors) — default
EnvironmentType.KINEMATIC; // Moving platforms (elevators, conveyors)
```

### 17. Scene Understanding (AR)

```typescript
import { XRPlane, XRMesh, XRAnchor } from '@iwsdk/core';

// Enable in World.create
World.create(container, {
  xr: {
    sessionMode: SessionMode.ImmersiveAR,
    features: { planeDetection: true, meshDetection: true },
  },
  features: {
    sceneUnderstanding: true,
  },
});

// Query detected planes/meshes
export class MyARSystem extends createSystem({
  planes: { required: [XRPlane] },
  meshes: { required: [XRMesh] },
  anchors: { required: [XRAnchor] },
}) {
  init() {
    this.queries.planes.subscribe('qualify', (entity) => {
      // New plane detected
      const plane = entity.object3D;
    });
  }
}
```

## Project Structure

```
my-iwsdk-project/
├── src/
│   ├── index.ts              # Entry point with World.create()
│   ├── systems/
│   │   ├── ui-system.ts      # Panel/UI management
│   │   └── game-system.ts    # Game logic
│   └── components/
│       └── custom.ts         # Custom component definitions
├── public/
│   ├── gltf/                 # 3D models
│   ├── audio/                # Audio files
│   ├── glxf/                 # Generated scene files
│   └── ui/                   # UIKitML sources, loaded at runtime
├── ui/
│   └── *.uikitml             # UI markup source
├── metaspatial/              # Meta Spatial Editor project
├── vite.config.ts
└── package.json
```
