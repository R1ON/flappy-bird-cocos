import { _decorator, Component, director, Collider2D } from 'cc';
import { GameManager, GameState } from 'db://assets/scripts/GameManager';
const { ccclass } = _decorator;

@ccclass('FailureWindow')
export class FailureWindow extends Component {
    private restartGame() {
      const gameManager = director.getScene().getChildByName('GameManager').getComponent(GameManager);

      gameManager.gameState = GameState.Ready;
      gameManager.failureWindow.active = false;

      gameManager.player.active = true;
      gameManager.player.setPosition(-150, 0);
      gameManager.player.getComponent(Collider2D).enabled = true;
      gameManager.playerBody.sleep();

      gameManager.score = 0;
      gameManager.scoreLabel.string = 'Score: 0';


      gameManager.obstacles.children.forEach((node) => node.destroy());
    }

    private goToMainMenu() {
      director.loadScene('MainMenu');
    }
}

