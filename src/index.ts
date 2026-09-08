/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * ============================================================================
 * INTERACTION BUILDING BLOCKS — keep all four when you remix this template
 * ============================================================================
 *
 * A WebXR app that is missing any of these feels broken in a headset. The
 * reference scene below wires up every one; if you replace the scene, carry the
 * blocks over. Full rationale and recipes live in the `hz-iwsdk-webxr` skill at
 * `skills/hz-iwsdk-webxr/references/building-blocks.md`.
 *
 *  1. CONTROLLER RAY / POINTER — `ControllerRaySystem` (src/ray.ts) forces both
 *     controller rays permanently visible and adds hover/press highlighting on
 *     every `RayInteractable`.
 *
 *  2. FULL CONTROLLER INPUT MAPPING — `ControllerInputSystem` (src/input.ts)
 *     handles trigger, grip, thumbstick and A/B/X/Y, and mirrors live state onto
 *     the input HUD panel.
 *
 *  3. SPATIAL AUDIO — the robot and the cube carry positional `AudioSource`
 *     chimes that fire on interaction, so sound has a direction in the scene.
 *
 *  4. GRABBABLE OBJECTS — the cube uses `OneHandGrabbable` (grab it directly),
 *     the plant uses `DistanceGrabbable` (pull it in with the ray).
 *
 * Only drop a block if the user explicitly asks you to.
 * ============================================================================
 */

import {
  AssetManifest,
  AssetType,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SessionMode,
  SRGBColorSpace,
  AssetManager,
  World,
} from "@iwsdk/core";

import {
  AudioSource,
  DistanceGrabbable,
  MovementMode,
  OneHandGrabbable,
  PanelUI,
  PlaybackMode,
  RayInteractable,
  ScreenSpace,
} from "@iwsdk/core";

import { EnvironmentType, LocomotionEnvironment } from "@iwsdk/core";

import { PanelSystem } from "./panel.js";

import { Robot } from "./robot.js";

import { RobotSystem } from "./robot.js";

import { ControllerInputSystem, CUBE_COLORS, DemoCube } from "./input.js";

import { ControllerRaySystem } from "./ray.js";

const assets: AssetManifest = {
  chimeSound: {
    url: "./audio/chime.mp3",
    type: AssetType.Audio,
    priority: "background",
  },
  webxr: {
    url: "./textures/webxr.png",
    type: AssetType.Texture,
    priority: "critical",
  },
  environmentDesk: {
    url: "./gltf/environmentDesk/environmentDesk.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
  plantSansevieria: {
    url: "./gltf/plantSansevieria/plantSansevieria.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
  robot: {
    url: "./gltf/robot/robot.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
};

World.create(document.getElementById("scene-container") as HTMLDivElement, {
  assets,
  // IWSDK 0.5 dropped the implicit default environment: EnvironmentSystem only
  // applies DomeGradient/IBLGradient on the level-root entity, so the sky and
  // image-based lighting now come from this (otherwise empty) scene document.
  // Everything else in the scene is still built procedurally below.
  level: "./scenes/main.iwsdk.scene.json",
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: "always",
    // Optional structured features; layers/local-floor are offered by default
    features: { handTracking: true, layers: true },
  },
  features: {
    locomotion: { useWorker: true },
    grabbing: true,
    physics: false,
    sceneUnderstanding: false,
    environmentRaycast: false,
  },
}).then((world) => {
  const { camera } = world;

  camera.position.set(-4, 1.5, -6);
  camera.rotateY(-Math.PI * 0.75);

  const { scene: envMesh } = AssetManager.getGLTF("environmentDesk")!;
  envMesh.rotateY(Math.PI);
  envMesh.position.set(0, -0.1, 0);
  world
    .createTransformEntity(envMesh)
    .addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  const { scene: plantMesh } = AssetManager.getGLTF("plantSansevieria")!;

  plantMesh.position.set(1.2, 0.85, -1.8);

  // BUILDING BLOCK 4a — grab at a distance by pointing the ray and holding the trigger.
  world
    .createTransformEntity(plantMesh)
    .addComponent(RayInteractable)
    .addComponent(DistanceGrabbable, {
      movementMode: MovementMode.MoveFromTarget,
    });

  const { scene: robotMesh } = AssetManager.getGLTF("robot")!;
  // defaults for AR
  robotMesh.position.set(-1.2, 0.4, -1.8);
  robotMesh.scale.setScalar(1);

  robotMesh.position.set(-1.2, 0.95, -1.8);
  robotMesh.scale.setScalar(0.5);

  // BUILDING BLOCK 3 — positional SFX: the robot chimes when the ray clicks it.
  world
    .createTransformEntity(robotMesh)
    .addComponent(RayInteractable)
    .addComponent(Robot)
    .addComponent(AudioSource, {
      src: "./audio/chime.mp3",
      maxInstances: 3,
      playbackMode: PlaybackMode.FadeRestart,
    });

  // BUILDING BLOCK 4b — grab directly with the grip button when your hand is close.
  const cubeMesh = new Mesh(
    new BoxGeometry(0.2, 0.2, 0.2),
    new MeshStandardMaterial({ color: CUBE_COLORS[0] }),
  );
  cubeMesh.position.set(0, 1.0, -1.7);
  world
    .createTransformEntity(cubeMesh)
    .addComponent(RayInteractable)
    .addComponent(OneHandGrabbable, {})
    .addComponent(DemoCube)
    .addComponent(AudioSource, {
      src: "./audio/chime.mp3",
      maxInstances: 2,
      playbackMode: PlaybackMode.FadeRestart,
    });

  // PanelUI carries only `config` since IWSDK 0.5 — the old `maxWidth`/`maxHeight`
  // fit is gone. UIKitML units are centimetres, so `.panel-container { width: 50 }`
  // renders 0.5 m wide intrinsically; the entity scale below brings it to the
  // ~1.45 x 0.79 m this panel used to occupy. Screen-space size is unaffected:
  // ScreenSpaceUISystem reparents the document to the camera and sizes it there.
  const panelEntity = world
    .createTransformEntity()
    .addComponent(PanelUI, { config: "./ui/welcome.uikitml" })
    .addComponent(RayInteractable)
    .addComponent(ScreenSpace, {
      top: "20px",
      left: "20px",
      height: "40%",
    });
  panelEntity.object3D!.position.set(0, 1.29, -1.9);
  panelEntity.object3D!.scale.setScalar(2.9);

  const webxrLogoTexture = AssetManager.getTexture("webxr")!;
  webxrLogoTexture.colorSpace = SRGBColorSpace;
  const logoBanner = new Mesh(
    new PlaneGeometry(3.39, 0.96),
    new MeshBasicMaterial({
      map: webxrLogoTexture,
      transparent: true,
    }),
  );
  world.createTransformEntity(logoBanner);
  logoBanner.position.set(0, 1, 1.8);
  logoBanner.rotateY(Math.PI);

  // `.hud-container { width: 60 }` is 0.6 m intrinsically; scale to the
  // ~1.14 x 0.59 m footprint the old maxWidth/maxHeight fit produced.
  const hudPanelEntity = world
    .createTransformEntity()
    .addComponent(PanelUI, { config: "./ui/input-hud.uikitml" })
    .addComponent(RayInteractable)
    .addComponent(ScreenSpace, {
      top: "20px",
      right: "20px",
      height: "30%",
    });
  hudPanelEntity.object3D!.position.set(1.7, 1.1, -1.9);
  hudPanelEntity.object3D!.scale.setScalar(1.9);

  world
    .registerSystem(PanelSystem)
    .registerSystem(RobotSystem)
    .registerSystem(ControllerRaySystem)
    .registerSystem(ControllerInputSystem);
});
