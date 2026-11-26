import {
  _decorator, Component, Node, input, Input, RigidBody2D,
  Vec2, Vec3, Prefab, instantiate, Collider2D, Contact2DType,
  Label, tween, Size, view, UITransform, AudioClip, AudioSource,
  sys,
} from 'cc';
const { ccclass, property } = _decorator;

const enum ColliderTag {
  Obstacles = 1,
  Sensor = 2,
  Player = 3,
}

export const enum GameState {
  Ready = 1,
  Playing = 2,
  Over = 3,
}

const USER_NAME_STORAGE_KEY = 'LastUserName';

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    cameraNode: Node;
    cameraStartPosition: Vec3;

    @property(Node)
    player: Node;
    playerBody: RigidBody2D;

    @property(Node)
    failureWindow: Node;

    @property(Label)
    scoreLabel: Label;
    @property(Label)
    userNameLabel: Label;
    userName: string;

    @property(Node)
    obstacles: Node;
    @property(Prefab)
    topObstacle: Prefab;
    @property(Prefab)
    bottomObstacle: Prefab;
    @property(Prefab)
    sensor: Prefab;

    @property(AudioClip)
    jumpSound: AudioClip;
    @property(AudioSource)
    backgroundMusic: AudioSource;
    @property(AudioClip)
    failureMusic: AudioClip;

    audioSource: AudioSource;

    size: Size;
    playerSize: Size;

    gameState = GameState.Ready;
    score = 0;

    start() {
      this.cameraStartPosition = this.cameraNode.position.clone();

      this.size = view.getVisibleSize();
      this.playerBody = this.player.getComponent(RigidBody2D);
      input.on(Input.EventType.TOUCH_START, this.jump, this);

      this.playerSize = this.player.getComponent(UITransform).contentSize;

      const playerCollider = this.player.getComponent(Collider2D);
      playerCollider.enabled = true;

      this.createUserName();

      playerCollider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
      playerCollider.on(Contact2DType.END_CONTACT, this.onEndContact, this);

      this.audioSource = this.getComponent(AudioSource);
    }

    update() {
      const playerYPosition = this.player.position.y;
      const topScreenPosition = (this.size.height / 2);
      const bottomScreenPosition = -(this.size.height / 2);
      const bottomPositionPlusPlayerSize = bottomScreenPosition - (this.playerSize.height / 2);

      if (this.gameState === GameState.Over) {

        if (this.player.active && playerYPosition < bottomPositionPlusPlayerSize) {
          this.player.active = false;
        }

        return;
      }

      if (playerYPosition > topScreenPosition || playerYPosition < bottomPositionPlusPlayerSize) {
        this.gameOver();
      }
    }

    onDestroy() {
      input.off(Input.EventType.TOUCH_START, this.jump, this);
    }

    createUserName() {
      const userName = String(parseInt(sys.localStorage.getItem(USER_NAME_STORAGE_KEY) || '0') + 1);
      sys.localStorage.setItem(USER_NAME_STORAGE_KEY, userName);

      this.userName = userName;
      this.userNameLabel.string = `User #${userName}`;
    }

    private onBeginContact(_selfCollider: Collider2D, otherCollider: Collider2D) {
      if (otherCollider.tag !== ColliderTag.Sensor) {
        this.gameOver();
      }
    }

    private onEndContact(_selfCollider: Collider2D, otherCollider: Collider2D) {
      if (this.gameState === GameState.Over) return;

      if (otherCollider.tag === ColliderTag.Sensor) {
        this.score += 1;
        this.bumpScoreLabel();
        this.scoreLabel.string = `Score: ${this.score}`;
      }
    }

    private gameOver() {
      if (this.gameState === GameState.Over) return;

      this.shakeCameraAfterGameOver();

      this.gameState = GameState.Over;
      this.unscheduleAllCallbacks();
      this.failureWindow.active = true;
      this.backgroundMusic.stop();
      this.audioSource.playOneShot(this.failureMusic, 0.5);

      this.scheduleOnce(() => {
        this.player.getComponent(Collider2D).enabled = false;
      }, 0);

      this.obstacles.children.forEach((node) => {
        node.getComponent(RigidBody2D).linearVelocity = new Vec2(0, 0);
      });
    }

    private shakeCameraAfterGameOver() {
      const { x, y, z } = this.cameraStartPosition;

      const offsets = [[12, -8], [-10, 10], [8, -12], [-6, 6], [4, -4], [-2, 2]];

      const shake = tween(this.cameraNode);

      offsets.forEach(([dx, dy]) => {
        shake.to(0.04, { position: new Vec3(x + dx, y + dy, z) });
      })

      shake.to(0.04, { position: this.cameraStartPosition });

      shake.start();
    }

    private jump() {
      if (this.gameState === GameState.Over) return;

      this.playerBody.linearVelocity = new Vec2(0, 0);
      this.playerBody.applyLinearImpulseToCenter(new Vec2(0, 700), true);

      this.audioSource.playOneShot(this.jumpSound, 0.6);

      if (this.gameState === GameState.Ready) {
        this.gameState = GameState.Playing;
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

