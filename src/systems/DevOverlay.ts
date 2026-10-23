import Phaser from 'phaser';
import { config } from '../config';

export class DevOverlay extends Phaser.Scene {
  private background?: Phaser.GameObjects.Rectangle;
  private visibleText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DevOverlay', active: false });
  }

  public create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.background = this.add.rectangle(
      0,
      0,
      width,
      height,
      config.ui.color.textDim,
      config.ui.scrimAlpha,
    );
    this.background.setOrigin(0, 0);

    this.visibleText = this.add
      .text(
        width - 16,
        height - 16,
        'Dev Overlay (scaffold)',
        {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: `#${config.ui.color.bg.toString(16).padStart(6, '0')}`,
        },
      )
      .setOrigin(1, 1);
  }

  public shutdown() {
    this.visibleText = undefined;
    this.background = undefined;
  }
}
