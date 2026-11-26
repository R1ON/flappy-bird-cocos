import { _decorator, Component, director, Collider2D, sys, Label } from 'cc';
import { GameManager, GameState } from 'db://assets/scripts/GameManager';
const { ccclass, property } = _decorator;

const TOP_3_STORAGE_KEY = 'ListOfTop3';

type ListOfTop3 = { name: string; score: number }[];

@ccclass('FailureWindow')
export class FailureWindow extends Component {
    @property(Label)
    listOfTop3: Label;

    onEnable() {
      this.renderListOfTop3();
    }

    private renderListOfTop3() {
      const gameManager = director.getScene().getChildByName('GameManager').getComponent(GameManager);

      const userName = gameManager.userName;
      const score = gameManager.score;

      const prevTop3: ListOfTop3 = JSON.parse(sys.localStorage.getItem(TOP_3_STORAGE_KEY) || '[]');
      prevTop3.push({ name: userName, score });
      prevTop3.sort((a, b) => b.score - a.score);

      const newTop3 = prevTop3.slice(0, 3);

      sys.localStorage.setItem(TOP_3_STORAGE_KEY, JSON.stringify(newTop3));

      this.listOfTop3.string = newTop3.map(item => `User #${item.name} – ${item.score}`).join('\n');
    }

    private restartGame() {
      // Специально уродская функция, чтобы попробовать поработать с gameManager из вне
      const gameManager = director.getScene().getChildByName('GameManager').getComponent(GameManager);

      gameManager.gameState = GameState.Ready;
      gameManager.failureWindow.active = false;

      gameManager.player.active = true;
      gameManager.player.setPosition(-150, 0);
      gameManager.player.getComponent(Collider2D).enabled = true;
      gameManager.playerBody.sleep();

      gameManager.score = 0;
      gameManager.scoreLabel.string = 'Score: 0';

      gameManager.backgroundMusic.play();
      gameManager.createUserName();

      gameManager.obstacles.children.forEach((node) => node.destroy());
    }

    private goToMainMenu() {
      director.loadScene('MainMenu');
    }

    private renderTop3List() {

    }
}

