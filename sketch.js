// Mouse Trails Synth — production

let nodes = [];
let pulse = false;
let mode = 0; // 0/1/2 color modes

function setup(){
  createCanvas(windowWidth, windowHeight);
  cursor('crosshair');
  background(15, 18, 26);
}

function draw(){
  // slight motion blur
  background(15, 18, 26, 40);

  // build eased position from last node → mouse
  let lastVec;
  if (nodes.length > 0) {
    const lastObj = nodes[nodes.length - 1];
    lastVec = createVector(lastObj.x, lastObj.y);
  } else {
    lastVec = createVector(mouseX, mouseY);
  }
  const target = createVector(mouseX, mouseY);
  const pos = p5.Vector.lerp(lastVec, target, 0.25);

  // size from speed
  const speed = p5.Vector.dist(lastVec, pos);
  const sz = map(speed, 0, 40, 6, 22, true);

  nodes.push({ x: pos.x, y: pos.y, sz, t: frameCount });
  if (nodes.length > 120) nodes.shift();

  // draw trail
  colorMode(HSB, 360, 100, 100, 255);
  noStroke();
  for (let i = 0; i < nodes.length; i++){
    const n = nodes[i];
    const age = i / nodes.length;

    let h;
    if (mode === 0) h = map(n.x, 0, width, 200, 320, true);
    else if (mode === 1) h = map(n.y, 0, height, 30, 200, true);
    else h = (n.t * 2) % 360;

    const b = 70 + age * 25;
    const a = 80 + age * 120;
    fill(h, 70, b, a);
    ellipse(n.x, n.y, n.sz, n.sz);
  }

  // optional pulse ring
  if (pulse){
    const r = 24 + (sin(frameCount * 0.1) + 1) * 16;
    noFill(); stroke(210, 80, 90, 220); strokeWeight(2);
    ellipse(mouseX, mouseY, r, r);
  }

  
}

function mousePressed(){ pulse = !pulse; }
function keyPressed(){
  if (key === '1') mode = 0;
  if (key === '2') mode = 1;
  if (key === '3') mode = 2;
}
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }
