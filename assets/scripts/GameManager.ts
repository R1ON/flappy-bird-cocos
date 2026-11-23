import { _decorator, Component, Node, input, Input, RigidBody2D, Vec2, Prefab, instantiate } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node) // TODO пока не используется
    canvas: Node = null;

    @property(Node)
    player: Node;
    playerBody: RigidBody2D;

    @property(Node)
    obstacles: Node;
    @property(Prefab)
    topObstacle: Prefab;
    @property(Prefab)
    bottomObstacle: Prefab;

    isGameStarted = false;

    start() {
      this.playerBody = this.player.getComponent(RigidBody2D);
      input.on(Input.EventType.TOUCH_START, this.jump, this);
    }

    onDestroy() {
      input.off(Input.EventType.TOUCH_START, this.jump, this);
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

      const topObstacle = instantiate(this.topObstacle);
      topObstacle.setParent(this.obstacles);
      topObstacle.setPosition(550, 750);
      topObstacle.getComponent(RigidBody2D).linearVelocity = new Vec2(-speed, 0);

      const bottomObstacle = instantiate(this.bottomObstacle);
      bottomObstacle.setParent(this.obstacles);
      bottomObstacle.setPosition(550, -750);
      bottomObstacle.getComponent(RigidBody2D).linearVelocity = new Vec2(-speed, 0);

      this.scheduleOnce(() => {
        topObstacle.destroy();
        bottomObstacle.destroy();
      }, 2);
    }

    update(deltaTime: number) {

    }
}

