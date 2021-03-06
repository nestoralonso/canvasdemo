import * as utils  from './utils';
const PI2 = 2 * Math.PI;

export function createRectangle(ctx, {
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

export function createCircle(ctx, {
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

export function createText(ctx, {
  size=20,
  text='M',
  fillColor=[250, 220, 255],
}={}) {
  const fillStyle = `rgb(${fillColor.join(',')})`;
  const textBuffer = utils.createTextBuffer(text, size, 'Arial', fillStyle);
  let draw = (pos) => {
    ctx.drawImage(textBuffer, pos.x, pos.y);
  }

  return {
    draw
  }
}

export function createTransform(
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

export function createObject(transform, shape) {
  return {
    transform,
    draw: shape.draw
  }
}

export function updatePhysics(transform, screenWidth, screenHeight) {

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
