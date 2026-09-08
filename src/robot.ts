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

import {
  AudioUtils,
  createComponent,
  createSystem,
  Pressed,
  Vector3,
} from "@iwsdk/core";

export const Robot = createComponent("Robot", {});

export class RobotSystem extends createSystem({
  robot: { required: [Robot] },
  robotClicked: { required: [Robot, Pressed] },
}) {
  private lookAtTarget!: Vector3;
  private vec3!: Vector3;

  init() {
    this.lookAtTarget = new Vector3();
    this.vec3 = new Vector3();
    this.queries.robotClicked.subscribe("qualify", (entity) => {
      AudioUtils.play(entity);
    });
  }

  update() {
    this.queries.robot.entities.forEach((entity) => {
      this.player.head.getWorldPosition(this.lookAtTarget);
      const spinnerObject = entity.object3D!;
      spinnerObject.getWorldPosition(this.vec3);
      this.lookAtTarget.y = this.vec3.y;
      spinnerObject.lookAt(this.lookAtTarget);
    });
  }
}
