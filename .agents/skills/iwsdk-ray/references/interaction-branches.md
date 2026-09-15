<!-- Reference for the `iwsdk-ray` skill. Open this when SKILL.md points you
here; it is not meant to be read end to end. -->

# Interaction Branches

The distinct things a ray can do, and how to pick between them.

## Interaction Branches

Based on the user's intent and the target's components, choose ONE of the following.

### Branch A: Click / Select (objects with Interactable, or UI buttons)

For simple clicks — fires selectstart, select, selectend events. Use for UI buttons and objects that respond to Pressed component.

```
xr_select({ device: "controller-right" })
```

This is a quick press-and-release. Done.

### Branch B: Distance Grab (objects with DistanceGrabbable)

DistanceGrabbable requires **press and hold** on the trigger (button index 0), not a quick select.

#### B1: Engage trigger

```
xr_set_gamepad_state({
  device: "controller-right",
  buttons: [{ index: 0, value: 1 }],
})
```

The object is now distance-grabbed. Behavior depends on the `movementMode`:

- **MoveFromTarget / MoveAtSource / RotateAtSource** — object stays remote, moves relative to controller movement
- **MoveTowardsTarget** — object flies into the controller's hand, then behaves like a proximity grab

#### B2: Move to destination (optional)

If the user wants to move the object somewhere, animate the controller to the destination.

```
xr_animate_to({
  device: "controller-right",
  position: { x, y, z },
  duration: 0.5,
})
```

If no destination specified but user asked to "move" or "bring" the object, animate to in front of the headset: `xr_get_transform({ "device": "headset" })` → place at `(head.x, head.y - 0.2, head.z - 0.5)`.

#### B3: Release trigger

```
xr_set_gamepad_state({
  device: "controller-right",
  buttons: [{ index: 0, value: 0 }],
})
```

#### B4: Return controller

Animate back to resting position.

```
xr_animate_to({
  device: "controller-right",
  position: { x: 0.2, y: 1.4, z: -0.3 },
  duration: 0.5,
})
```

Default resting positions: right `(0.2, 1.4, -0.3)`, left `(-0.2, 1.4, -0.3)`.

### Step 5: Verify (optional)

Take a screenshot to confirm the result.

```
browser_screenshot
```
