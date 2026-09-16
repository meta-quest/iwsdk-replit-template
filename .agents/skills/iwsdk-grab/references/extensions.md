<!-- Reference for the `iwsdk-grab` skill. Open this when SKILL.md points you
here; it is not meant to be read end to end. -->

# Grab Extensions

Optional components layered on top of a basic grabbable.

## Optional Extensions

Apply these based on the user's request.

### Step 6: Move to destination

If the user specified a destination position, animate the controller there. If no position was given but the user asked to "move" the object, animate it to in front of the headset.

To find "in front of headset": `xr_get_transform({ "device": "headset" })` → place at `(head.x, head.y - 0.2, head.z - 0.5)` adjusted for head orientation.

```
xr_animate_to({
  device: "controller-right",
  position: { x, y, z },
  duration: 0.5,
})
```

### Step 7: Release grip

Release the squeeze button to drop the object.

```
xr_set_gamepad_state({
  device: "controller-right",
  buttons: [{ index: 1, value: 0 }],
})
```

### Step 8: Return controller

Animate the controller back to its resting position so it's not overlapping the dropped object.

```
xr_animate_to({
  device: "controller-right",
  position: { x: 0.2, y: 1.4, z: -0.3 },
  duration: 0.5,
})
```

Default resting positions: right `(0.2, 1.4, -0.3)`, left `(-0.2, 1.4, -0.3)`.

### Step 9: Verify

Take a screenshot to confirm the result.

```
browser_screenshot
```
