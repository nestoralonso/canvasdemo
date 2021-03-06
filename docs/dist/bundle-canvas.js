(function () {
  'use strict';

  function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randIndex(arr) {
      return randomInt(0, arr.length - 1);
  }

  const emojiRanges = [
      [0x0001f330, 0x0001f335],
      [0x0001f337, 0x0001f37c],
      [0x0001f380, 0x0001f393],
      [0x0001f3a0, 0x0001f3c4],
      [0x0001f3c6, 0x0001f3ca],
      [0x0001f3e0, 0x0001f3f0],
      [0x0001f400, 0x0001f43e],
      [0x0001f440, 0x0001f440],
      [0x0001f442, 0x0001f4f7],
      [0x0001f4f9, 0x0001f4fc]
  ];

  function randomEmoji() {
    const randRange = emojiRanges[randIndex(emojiRanges)];
    return String.fromCodePoint(randomInt(randRange[0], randRange[1]));
  }

  /**
   *
   *
   * @param {boolean} [alpha=false]
   * @returns {Array} vector4 containing RGBA
   */
  function randomColor(alpha=false) {
    const alphaVal = alpha ? 0.5 + Math.random() / 2 : 1;
    return [
      randomInt(60, 255),
      randomInt(60, 255),
      randomInt(60, 255),
      alphaVal,
    ];
  }

  function measureText(text, fontSize, fontFamily) {
    let div = measureText.div || document.createElement('div');
    div.style.font = fontSize + 'px/' + fontSize + 'px ' + fontFamily;
    div.style.padding = '0';
    div.style.margin = '0';
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.innerHTML = text;
    if (!measureText.div) document.body.appendChild(div);
    let w = div.clientWidth;
    let h = div.clientHeight;
    measureText.div = div;
    return { width: w, height: h };
  }

  function createTextBuffer(text='A', fontSize=24, fontFamily='Arial', fillStyle) {
      // Create offscreen buffer for our text rendering.
      // This way all we have to do is draw our buffer to
      // the main canvas rather than drawing text each frame.
      const textBuffer = document.createElement('canvas');

      const m = measureText(text, fontSize, fontFamily);
      // Resize the buffer.
      textBuffer.width = m.width;
      textBuffer.height = m.height;
      // Render to our buffer.
      const ctx = textBuffer.getContext('2d');
      ctx.font = fontSize + 'px/' + fontSize + 'px ' + fontFamily;
      ctx.fillStyle = fillStyle;
      // Set the baseline to middle and offset by half the text height.
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, m.height / 2);

      return textBuffer;
  }

  const PI2 = 2 * Math.PI;

  function createRectangle(ctx, {
    width=30, height=30,
    borderWidth=5,
    fillColor=[200, 220, 255, 0.9],
    borderColor=[80, 80, 155, 0.9]
  }={}) {

    let draw = (pos) => {
      ctx.fillStyle = `rgba(${fillColor.join(',')})`;
      ctx.fillRect (pos.x, pos.y, width, height);
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = `rgba(${borderColor.join(',')})`;
      ctx.strokeRect (pos.x, pos.y, width, height);
    }

    return {
      draw
    }
  }

  function createCircle(ctx, {
    radius=20,
    borderWidth=5,
    fillColor=[250, 220, 255, 0.9],
    borderColor=[155, 80, 155, 0.9]
  }={}) {

    let draw = (pos) => {
      ctx.fillStyle = `rgba(${fillColor.join(',')})`;

      ctx.beginPath();
      ctx.arc (pos.x, pos.y, radius, 0, PI2);
      ctx.fill();
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = `rgba(${borderColor.join(',')})`;

      ctx.beginPath();
      ctx.arc (pos.x, pos.y, radius, 0, PI2);
      ctx.stroke();
    }

    return {
      draw
    }
  }

  function createText(ctx, {
    size=20,
    text='M',
    fillColor=[250, 220, 255],
  }={}) {
    const fillStyle = `rgb(${fillColor.join(',')})`;
    const textBuffer = createTextBuffer(text, size, 'Arial', fillStyle);
    let draw = (pos) => {
      ctx.drawImage(textBuffer, pos.x, pos.y);
    }

    return {
      draw
    }
  }

  function createTransform(
    {
      pos={x: 0, y: 0},
      vel={x: 0, y: 0},
      accel={x: 0, y: 0},
      active=true
    } = {})  {

    return {
      pos,
      vel,
      accel,
      active
    };
  }

  function createObject(transform, shape) {
    return {
      transform,
      draw: shape.draw
    }
  }

  function updatePhysics(transform, screenWidth, screenHeight) {

    if(!transform.active) return;

    if(transform.pos.y < 0 || transform.pos.y > screenHeight + 70) {
      transform.active = false;
      return;
    }

    transform.pos.x += transform.vel.x;
    transform.pos.y += transform.vel.y;

    // round to int for performance reasons
    transform.pos.x = transform.pos.x | 0;
    transform.pos.y = transform.pos.y | 0;

    transform.vel.x += transform.accel.x;
    transform.vel.y += transform.accel.y;
  }

  function vLength({x, y}) {
    let length = Math.sqrt(x * x + y * y);
    return length;
  }

  function normalize(v) {
    length = vLength(v)
    return {
      x: v.x / length,
      y: v.y / length
    }
  }

  function randomVector(xRange=2, yRange=2) {
    let x = -(xRange / 2) + Math.random() * xRange;
    let y = -(yRange / 2) + Math.random() * yRange;

    let res = normalize({x, y});
    return res;
  }

  function scalarMul(scalar, v) {
    return {x: scalar * v.x, y: scalar * v.y};
  }

  let ctx;

  let initCanvas = (canvasNode) => {
    if(canvasNode.getContext) {
      ctx = canvasNode.getContext('2d');
    }
    else {
      console.error('No canvas ctx available');
    }

    return ctx;
  };

  const NUM_PARTICLES = 20;

  // Initialize and array with null, because the map function doesn't
  // iterates over undefined
  let objects = new Array(NUM_PARTICLES).fill(null);

  let SCREEN_WIDTH;
  let SCREEN_HEIGHT;
  let fullScreen = true;
  let start = (canvasNode, fullWidth, fullHeight) => {

    if(!fullScreen) {
      SCREEN_WIDTH = canvasNode.width;
      SCREEN_HEIGHT = canvasNode.height;
    }
    else {
      canvasNode.width = fullWidth;
      canvasNode.height = fullHeight;
      SCREEN_WIDTH = fullWidth;
      SCREEN_HEIGHT = fullHeight;
    }
    ctx = initCanvas(canvasNode);
    objects = objects.map(x => newRandomObject(SCREEN_WIDTH / 2, SCREEN_HEIGHT));
    window.requestAnimationFrame(updateFrame);
  };


  function randomVelocity() {
    let vel = randomVector(1, 6);
    vel.y = vel.y < 0? vel.y : -vel.y;
    let speed = Math.random() * 16;
    vel = scalarMul(speed, vel);
    vel.y -= 2;

    return vel;
  }

  function newRandomObject(x, y) {
    let vel = randomVelocity();
    let transform = createTransform({pos: {x, y}, vel, accel: {x:0, y: 0.3}});

    // Simple coin toss
    let shape;
    let randomChoice = Math.random();
    if(randomChoice < 0.05) {
      shape = createCircle(ctx, {radius: 15, fillColor: randomColor(), borderColor: randomColor()});
    }
    else if (randomChoice < 0.95) {
      shape = createText(ctx, {text: randomEmoji(), fillColor: randomColor(), size: randomInt(30, 100)});
    }
    else {
      shape = createRectangle(ctx, {fillColor: randomColor(), borderColor: randomColor()});
    }

    let newObj = createObject(transform, shape);

    return newObj;
  }

  function randomizeExistingObject(obj, x, y) {
    let vel = randomVelocity();
    obj.transform.pos = {x, y};
    obj.transform.vel = vel;
    obj.transform.active = true;
  }

  let frameIdx = 0;
  function updateFrame() {
    //ctx.globalCompositeOperation = 'destination-over';
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    for(let obj of objects) {
      obj.draw(obj.transform.pos);
      updatePhysics(obj.transform, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    if(frameIdx % 10 == 0) {
      for(let obj of objects) {
        if(!obj.transform.active) {
          randomizeExistingObject(obj, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
        }
      }
    }

    frameIdx++;
    window.requestAnimationFrame(updateFrame);
  }

  function main() {
    const canvas = document.getElementById('myCanvas');
    const canvasContainer = document.getElementById('canvas-container');
    start(canvas, canvasContainer.clientWidth, canvasContainer.clientHeight);
  }

  console.log('Hello from mainCanvas');
  main();

}());
//# sourceMappingURL=bundle-canvas.js.map