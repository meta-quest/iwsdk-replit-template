---
name: iwsdk-ray
description: Ray-based interactions in the WebXR scene — click objects, press UI buttons, or distance-grab with DistanceGrabbable. Use when the user wants to point at and interact with something at a distance, click a UI button, or test ray-based selection.
---

# Ray Interaction

Point at and interact with objects or UI elements in the XR scene using the controller ray. The workflow has a **required core** (steps 1-4) and **optional extensions** that depend on whether the target is an object or UI element, and what kind of interaction is needed.

User request is in `$ARGUMENTS`.

## Required Core

These steps always execute in order.

### Step 1: Enter XR

Check session status. If not in an active XR session, accept and enter.

```
xr_get_session_status → if not sessionActive → xr_accept_session
```

### Step 2: Locate the target

**For scene objects:** Find by name using `scene_get_hierarchy`, then get the UUID.

```
scene_get_hierarchy → find node matching target name
```

**For UI elements:** UI buttons/elements are children of PanelUI entities and may not have names by default. To locate precisely:

1. Read the UIKITML source file to find the element's `id` (e.g., `<button id="xr-button">`)
2. Find the system or code that loads the panel via `PanelDocument`
3. Add `.name = "element-id"` on the Object3D returned by `getElementById()` — this is harmless and makes it discoverable
4. Reload, then find it by name in `scene_get_hierarchy`

If the element already has a name in the hierarchy, skip straight to getting its transform.

If the object is not found, report the available named objects and stop.

### Step 3: Get its transform

Get the target's world position using its UUID from step 2.

```
scene_get_object_transform(uuid) → use positionRelativeToXROrigin
```

### Step 4: Aim the controller

Point the controller at the target. Default to `"controller-right"` unless the user specified left. Do NOT move the controller — only rotate it.

```
xr_look_at({ device: "controller-right", target: { x, y, z } })
```

The controller ray is now pointing at the target. What happens next depends on the interaction type.

## Where the detail lives

| Read | When |
| ---- | ---- |
| [`references/interaction-branches.md`](references/interaction-branches.md) | The interaction is more than a click — pressing UI, distance grab, hover states, or choosing between the branches |

## Notes

- **Click vs hold:** `xr_select` is for quick clicks. `xr_set_gamepad_state` with trigger held is for distance grabs. Never use `xr_select` for DistanceGrabbable — the object needs sustained trigger pressure.
- **Trigger vs squeeze:** Ray interactions use the **trigger (button index 0)**. Proximity grabs (OneHandGrabbable/TwoHandsGrabbable) use **squeeze (button index 1)**. Don't mix them up.
- **UI element discovery:** Always prefer the precise approach — name the Object3D via PanelDocument's `getElementById` + `.name`, then find it in the hierarchy. Guessing positions based on panel offset is fragile.
- **DistanceGrabbable movement modes:** Check the entity's DistanceGrabbable component to see which `movementMode` is set. Use `ecs_query_entity` if unsure.
- **Don't move the controller to the target** — ray interactions work at a distance. Only rotate via `xr_look_at`, don't translate.
