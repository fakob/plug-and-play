import * as PIXI from 'pixi.js';
import ThumbContainer from './ThumbContainer';
import { getGridPositionArray } from './utils-pixi';
import { Viewport } from 'pixi-viewport';

import './style.css';

const gameWidth = 800;
const gameHeight = 600;

const app = new PIXI.Application({
  backgroundColor: 0xd3d3d3,
  width: gameWidth,
  height: gameHeight,
});

const stage = app.stage;

// create viewport
const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: window.innerWidth,
  worldHeight: window.innerHeight,
  interaction: app.renderer.plugins.interaction, // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
});

console.log(viewport);
console.log(window.devicePixelRatio);
// add the viewport to the stage
app.stage.addChild(viewport);

// activate plugins
// viewport.on('clicked', () => {
//   console.log('clicked');
//   // viewport.fitWorld();
//   viewport.fit();
//   viewport.moveCenter(viewport.screenWidth / 2, viewport.screenHeight / 2);
// });
// viewport.on("zoomed", zoomed);
// viewport.on("zoomed-end", zoomedEnd);

viewport
  .drag()
  .pinch()
  .wheel()
  // .clamp({ direction: 'all' })
  // .clampZoom({ minScale: 0.5, maxScale: 1 })
  .decelerate({
    friction: 0.8,
  });

const gPA = getGridPositionArray(4, 400, 400, 32, 16);

const frameNumberArray = Array.from(Array(24).keys());
const emptyThumbArray = frameNumberArray.map((item, index) => {
  const { x = 0, y = 0, scale = 0 } = gPA[index];
  const thumbContainer = new ThumbContainer(x, y, 400);

  // thumbContainer
  //   .on("pointerdown", onThumbDragStart)
  //   .on("pointerup", onThumbDragEnd)
  //   .on("click", onThumbClick)
  //   .on("dblclick", onThumbDoubleClick)
  //   .on("pointerupoutside", onThumbDragEnd);

  viewport.addChild(thumbContainer);
  return {
    thumbContainerRef: thumbContainer,
    textRef: thumbContainer.thumbInfoRef,
    spriteRef: thumbContainer.spriteRef,
    frameNumber: item,
    base64: 'data:image/jpeg;base64,',
  };
});

window.onload = async (): Promise<void> => {
  await loadGameAssets();

  document.body.appendChild(app.view);

  resizeCanvas();

  const birdFromSprite = getBird();
  birdFromSprite.anchor.set(0.5, 0.5);
  birdFromSprite.position.set(gameWidth / 2, gameHeight / 2);

  viewport.addChild(birdFromSprite);
};

async function loadGameAssets(): Promise<void> {
  return new Promise((res, rej) => {
    const loader = PIXI.Loader.shared;
    loader.add('rabbit', './assets/simpleSpriteSheet.json');

    loader.onComplete.once(() => {
      res();
    });

    loader.onError.once(() => {
      rej();
    });

    loader.load();
  });
}

function resizeCanvas(): void {
  const resize = () => {
    viewport.resize(window.innerWidth, window.innerHeight);
    app.renderer.resize(window.innerWidth, window.innerHeight);
    // app.stage.scale.x = window.innerWidth / gameWidth;
    // app.stage.scale.y = window.innerHeight / gameHeight;
  };

  resize();

  window.addEventListener('resize', resize);
}

function getBird(): PIXI.AnimatedSprite {
  const bird = new PIXI.AnimatedSprite([
    PIXI.Texture.from('birdUp.png'),
    PIXI.Texture.from('birdMiddle.png'),
    PIXI.Texture.from('birdDown.png'),
  ]);

  bird.loop = true;
  bird.animationSpeed = 0.1;
  bird.play();
  bird.scale.set(3);

  return bird;
}
