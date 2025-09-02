// Mouse Trails Synth + Handpose (stabilised)

// ---- init guard: prevent double execution (Live Server or duplicate tag)
if (window.__MTS_LOADED) {
  console.warn('Mouse Trails Synth already loaded — ignoring duplicate.');
} else {
  window.__MTS_LOADED = true;

  let nodes = [];
  let pulse = false;
  let mode = 0;

  // AI state
  let video, handpose, predictions = [];
  let useHand = false;
  let ready = false;

  // smoothing state
  let sx = null, sy = null;         // smoothed fingertip
  const SMOOTH = 0.18;              // 0..1 (higher = snappier, lower = smoother)
  const DEADZONE = 4;               // px; ignore tiny jitters
  const MAX_JUMP = 100;              // px; clamp huge spikes

  function setup(){
    createCanvas(windowWidth, windowHeight);
    pixelDensity(1);                // small stabilisation + perf
    cursor('crosshair');
    background(15, 18, 26);

    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        startBtn.textContent = 'Starting...';
        try {
          video = createCapture({ video: true, audio: false }, () => {
            console.log('video capture started');
          });
          video.size(320, 240);
          video.hide();

          handpose = ml5.handpose(video, () => {
            console.log('handpose ready');
          });
          handpose.on('predict', res => {
            predictions = res || [];
            useHand = predictions.length > 0;
          });

          ready = true;
          document.getElementById('startOverlay')?.classList.add('hidden');
        } catch (err) {
          console.error('Camera or model start failed:', err);
          startBtn.textContent = 'Retry Start';
        }
      });
    } else {
      // If you removed the overlay, still run with mouse
      ready = true;
    }
  }

  function draw(){
    background(15, 18, 26, 40);

    // 1) pick target: hand (if available) else mouse
    let { tx, ty } = targetPoint();

    // 2) smooth fingertip/mouse target to reduce jitter
    if (sx === null || sy === null) { sx = tx; sy = ty; }
    // clamp huge jumps
    const jump = dist(sx, sy, tx, ty);
    if (jump > MAX_JUMP) {
      const a = MAX_JUMP / jump;
      tx = sx + (tx - sx) * a;
      ty = sy + (ty - sy) * a;
    }
    // deadzone
    if (dist(sx, sy, tx, ty) > DEADZONE) {
      sx = lerp(sx, tx, SMOOTH);
      sy = lerp(sy, ty, SMOOTH);
    }
    // now use (sx, sy) as the stable target
    tx = sx; ty = sy;

    // 3) eased position along the trail
    let lastVec;
    if (nodes.length > 0) {
      const lastObj = nodes[nodes.length - 1];
      lastVec = createVector(lastObj.x, lastObj.y);
    } else {
      lastVec = createVector(tx, ty);
    }
    const target = createVector(tx, ty);
    const pos = p5.Vector.lerp(lastVec, target, 0.25);

    // 4) size from speed
    const speed = p5.Vector.dist(lastVec, pos);
    const sz = map(speed, 0, 40, 6, 22, true);

    // 5) push & trim
    nodes.push({ x: pos.x, y: pos.y, sz, t: frameCount });
    if (nodes.length > 120) nodes.shift();

    // 6) draw
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

    // pulse ring at target
    if (pulse){
      const r = 24 + (sin(frameCount * 0.1) + 1) * 16;
      noFill(); stroke(210, 80, 90, 220); strokeWeight(2);
      ellipse(tx, ty, r, r);
    }

    // auto mode by vertical band when hand active (optional)
    if (useHand){
      const band = ty / height;
      mode = band < 0.33 ? 0 : band < 0.66 ? 1 : 2;
    }

    // tiny HUD
    colorMode(RGB,255); noStroke(); fill(230); textSize(12);
    const status = useHand ? 'HAND' : (ready ? 'MOUSE' : 'WAIT');
    text(`Input: ${status} • Modes 1/2/3 • Click=pulse ${pulse?'ON':'OFF'}`, 12, 22);
  }

  function targetPoint(){
    if (useHand && predictions.length > 0 && video) {
      const tip = predictions[0].landmarks[8];   // [x,y,z]
      let tx = map(tip[0], 0, video.width,  width, 0, true); // mirror
      let ty = map(tip[1], 0, video.height, 0, height, true);
      // clamp to canvas
      tx = constrain(tx, 0, width);
      ty = constrain(ty, 0, height);
      return { tx, ty };
    }
    return { tx: mouseX, ty: mouseY };
  }

  function mousePressed(){ pulse = !pulse; }
  function keyPressed(){
    if (key === '1') mode = 0;
    if (key === '2') mode = 1;
    if (key === '3') mode = 2;
  }
  function windowResized(){ resizeCanvas(windowWidth, windowHeight); }
}
