<!-- Reference for the `iwsdk-planner` skill. Open this when SKILL.md points
you here; it is not meant to be read end to end. -->

# Assets

Loading assets at runtime, and choosing prototype art.

### 14. Asset Loading

```typescript
import { AssetManager, AssetType } from '@iwsdk/core';

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

// Access preloaded assets
const model = AssetManager.getGLTF('myModel');
const texture = AssetManager.getTexture('myTexture');
const audio = AssetManager.getAudio('mySound');
```

**AssetType Enum:**

```typescript
AssetType.GLTF; // 3D models
AssetType.Audio; // Sound files
AssetType.Texture; // Images
AssetType.HDRTexture; // HDR environment maps
```

## Asset Selection with Kenney Prototype Kit

This project includes the **Kenney Prototype Kit** at `public/kenney_prototype-kit/` with 143 prototyping models.

### During Planning: Choose Assets

When planning a feature that needs 3D models, consult the asset catalog:

1. **Read the catalog index** to find relevant models:

   ```
   Read: public/kenney_prototype-kit/catalog/README.md
   ```

2. **Browse category files** for detailed descriptions:
   - `walls.md` - 25 wall pieces for room construction
   - `floors.md` - 8 ground/platform surfaces
   - `doors.md` - 6 animated doorways
   - `shapes.md` - 18 geometric primitives
   - `indicators.md` - 17 waypoints/markers
   - `misc-props.md` - Coins, crates, flags
   - `buttons-levers.md` - Interactive controls
   - And more...

3. **Preview models visually** using the `/preview-model` skill:

   ```
   /preview-model wall-corner
   /preview-model door-rotate b
   ```

4. **Document asset choices** in your plan with:
   - Model name and category
   - Suggested position/scale
   - Texture variation (a, b, or c)

### Asset Selection Checklist

When your plan involves 3D objects, answer these:

| Question                | Example Answer                                    |
| ----------------------- | ------------------------------------------------- |
| What models are needed? | `wall-corner`, `door-rotate`, `indicator-arrow`   |
| What texture variation? | Variation A (purple/lavender with orange accents) |
| What scale factor?      | 0.5x for desk-scale, 1.0x for room-scale          |
| Where positioned?       | `(0, 0.85, -1.5)` on desk, `(0, 0, -3)` on floor  |
| Any interactions?       | Grabbable, physics-enabled, trigger zones         |

### Example: Planning a Simple Puzzle Room

**Feature:** Player solves a button puzzle to open a door

**Asset Selection:**

1. Read `catalog/walls.md` → select `wall-corner`, `wall-doorway`
2. Read `catalog/doors.md` → select `door-rotate` (animated swing door)
3. Read `catalog/buttons-levers.md` → select `button-round` (pressable)
4. Read `catalog/indicators.md` → select `indicator-arrow` (shows where to go)

**Preview with `/preview-model`:**

```
/preview-model door-rotate a
/preview-model button-round a
```

**Document in plan:**

```
Assets:
- door-rotate.glb at (0, 0, -3), scale 1.0, variation-a texture
- button-round.glb at (1, 1, -2), scale 0.5, variation-a texture
- indicator-arrow.glb at (0, 0.1, -2.5), scale 0.3, variation-a texture
```
