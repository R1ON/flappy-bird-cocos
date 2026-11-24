import { _decorator, Component, director } from 'cc';
const { ccclass } = _decorator;

@ccclass('MainMenu')
export class MainMenu extends Component {
    private startGame() {
      director.loadScene('MainScene');
    }
}

