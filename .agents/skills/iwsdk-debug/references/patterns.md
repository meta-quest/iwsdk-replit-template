<!-- Reference for the `iwsdk-debug` skill. Open this when SKILL.md points you
here; it is not meant to be read end to end. -->

# Debugging Patterns

Worked recipes for the common classes of continuous-behaviour bug.

## Patterns

Short domain-specific tips. Apply the core workflow above, plus these hints.

### Physics (falling, bouncing, collisions)

- Pause BEFORE releasing the object or applying force.
- Step 1-3 frames at `delta: 0.016` to catch initial acceleration.
- In diffs, check `PhysicsBody._linearVelocity` and `PhysicsBody._angularVelocity` to see motion direction and speed.
- Check `Transform.position` to track movement.
- If an object falls through a surface: verify the surface entity has both `PhysicsBody` (Static) and `PhysicsShape` (TriMesh for complex geometry).
- Use `ecs_query_entity` to inspect `PhysicsShape` and `PhysicsBody` on both the falling object and the surface.

### Grab and Throw

- Pause while the object is still held (trigger/grip engaged).
- Release the input (set button value to 0) while paused.
- Step frame by frame to observe the release velocity.
- In diffs, `PhysicsBody._linearVelocity` shows the throw direction and speed.
- If the object doesn't move after release: check that it has `PhysicsBody` with `state: Dynamic`.

### Animations and Transitions

- Step 1 frame at a time with `delta` matching your target framerate.
- Compare `Transform.position`, `Transform.orientation`, and `Transform.scale` across snapshots to track interpolation.
- Use screenshots between steps to observe visual progression.

### Collision Detection

- Pause just before two objects meet.
- Step 1 frame at a time.
- Watch for `PhysicsBody._linearVelocity` sign changes (indicates bounce/impact).
- Watch for `PhysicsBody._angularVelocity` spikes (indicates tumbling from impact).
- If objects pass through each other: check `PhysicsShape` exists on both entities, and verify shape types are appropriate (use `TriMesh` for complex static geometry).

### System Isolation

- Use `ecs_list_systems` to see all systems and their priorities.
- Use `ecs_toggle_system({ "name": "SystemName", "paused": true })` to pause a suspect system while others run.
- Step forward and observe — if the bug disappears, that system is the cause.
- Remember to unpause the system when done.
