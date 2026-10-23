import Phaser from 'phaser';
import { config } from '../config';

export class GameScene extends Phaser.Scene {
  private overlayVisible = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create() {
    this.cameras.main.setBackgroundColor(config.ui.color.bg);
    const message = `Milestone 1 scaffold · press \` to open dev overlay`;
    this.add
      .text(
        config.game.width / 2,
        config.game.height / 2,
        message,
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: `#${config.ui.color.text.toString(16).padStart(6, '0')}`,
        },
      )
      .setOrigin(0.5, 0.5);

    this.input.keyboard?.on('keydown-BACKQUOTE', this.toggleDevOverlay, this);
  }

  private toggleDevOverlay() {
    if (this.overlayVisible) {
      this.overlayVisible = false;
      this.scene.stop('DevOverlay');
      return;
    }

    this.overlayVisible = true;
    if (!this.scene.isActive('DevOverlay')) {
      this.scene.launch('DevOverlay', { host: this });
    } else if (!this.scene.isSleeping('DevOverlay')) {
      this.scene.bringToTop('DevOverlay');
      this.scene.resume('DevOverlay');
    }
  }
}
