import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public create() {
    this.scene.start('GameScene');
    this.scene.stop();
  }
}
