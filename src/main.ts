import Phaser from 'phaser';
import { config } from './config';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { DevOverlay } from './systems/DevOverlay';

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: `#${config.ui.color.bg.toString(16).padStart(6, '0')}`,
  parent: 'app',
  width: config.game.width,
  height: config.game.height,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        x: 0,
        y: config.player.gravity,
      },
      debug: config.debug.showHitboxes,
    },
  },
  scene: [BootScene, GameScene, DevOverlay],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(gameConfig);
