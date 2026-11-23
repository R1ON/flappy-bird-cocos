import {
  _decorator, Component, Node, input, Input, RigidBody2D,
  Vec2, Vec3, Prefab, instantiate, Collider2D, Contact2DType,
  Label, tween,
} from 'cc';
const { ccclass, property } = _decorator;

const enum ColliderTag {
  Obstacles = 1,
  Sensor = 2,
  Player = 3,
}

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    player: Node;
    playerBody: RigidBody2D;

    @property(Node)
    failureWindow: Node;

    @property(Label)
    scoreLabel: Label;

    @property(Node)
    obstacles: Node;
    @property(Prefab)
    topObstacle: Prefab;
    @property(Prefab)
    bottomObstacle: Prefab;
    @property(Prefab)
    sensor: Prefab;

    isGameStarted = false;
    score = 0;

    start() {
      this.playerBody = this.player.getComponent(RigidBody2D);
      input.on(Input.EventType.TOUCH_START, this.jump, this);

      const playerCollider = this.player.getComponent(Collider2D);
      playerCollider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
      playerCollider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    onDestroy() {
      input.off(Input.EventType.TOUCH_START, this.jump, this);
    }

    private onBeginContact(_selfCollider: Collider2D, otherCollider: Collider2D) {
      if (otherCollider.tag !== ColliderTag.Sensor) {
        this.failureWindow.active = true;
        this.unscheduleAllCallbacks();

        this.obstacles.children.forEach((node) => {
          node.getComponent(RigidBody2D).linearVelocity = new Vec2(0, 0);
        });
      }
    }

    private onEndContact(_selfCollider: Collider2D, otherCollider: Collider2D) {
      if (otherCollider.tag === ColliderTag.Sensor) {
        this.score += 1;
        this.bumpScoreLabel();
        this.scoreLabel.string = `Score: ${this.score}`;
      }
    }

    private jump() {
      this.playerBody.linearVelocity = new Vec2(0, 0);
      this.playerBody.applyLinearImpulseToCenter(new Vec2(0, 700), true);

      if (!this.isGameStarted) {
        this.isGameStarted = true;
        this.schedule(this.generateObstacles, 0.8);
      }
    }

    private generateObstacles() {
      const speed = 25;
      const yRandom = (Math.random() > 0.1 ? 1 : -1) * Math.floor(Math.random() * 350);

      const topObstacle = instantiate(this.topObstacle);
      topObstacle.setParent(this.obstacles);
      topObstacle.setPosition(550, 750 + yRandom);
      topObstacle.getComponent(RigidBody2D).linearVelocity = new Vec2(-speed, 0);

      const bottomObstacle = instantiate(this.bottomObstacle);
      bottomObstacle.setParent(this.obstacles);
      bottomObstacle.setPosition(550, -750 + yRandom);
      bottomObstacle.getComponent(RigidBody2D).linearVelocity = new Vec2(-speed, 0);

      const sensor = instantiate(this.sensor);
      sensor.setParent(this.obstacles);
      sensor.setPosition(550, yRandom);
      sensor.getComponent(RigidBody2D).linearVelocity = new Vec2(-speed, 0);

      this.scheduleOnce(() => {
        topObstacle.destroy();
        bottomObstacle.destroy();
        sensor.destroy();
      }, 2);
    }

    private bumpScoreLabel() {
      tween(this.scoreLabel.node)
        .to(0.07, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'quadOut' })
        .to(0.2,  { scale: new Vec3(1, 1, 1) },       { easing: 'backOut' })
        .start();
    }
}

