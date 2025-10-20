//moved art data to separate file cause it got ugly


// VARIABLES

// insp by gameboy; light to dark
let palette = [ 
  [41, 65, 57],
  [57, 89, 74],
  [96, 121, 66],
  [123, 130, 16]
]



let original;           
let scaledOriginal;               // rescaled copy for pixel effects
let buffer;                       // buffer to keep original imgs safe
let currentArtwork = 0;
let algorithmType = 0;
let amt = 0.0;  
let asciiInitialized = false; 
let scanlineProgress = 0;
//let reduceProgress = 0;






function preload() {
  artworks = artworks.map(path => loadImage('paintings/' + path));
}

function setup() {
  createCanvas(850, windowHeight-40);
  imageMode(CENTER);
  pixelDensity(1);
  frameRate(30);

  original = artworks[currentArtwork];

  scaledOriginal = createImage(width, height);
  scaledOriginal.copy(original, 0, 0, original.width, original.height, 0, 0, width, height);

  buffer = createGraphics(width, height);
  buffer.image(scaledOriginal, 0, 0, width, height);
  
  
  // some display info. might improve styling  later
  let disc = createDiv().class('Description');
  title = createDiv("DISINTEGRATION GALLERY<br>").parent(disc); 
  title.size(525, 50)
  .style('font-weight', 'bold')
  .style('font-size', '30px');
  artLabel = createDiv().parent(disc);
  algorithmLabel = createDiv().parent(disc).style('margin-top', '50px');

  let HUD = createDiv().class('HUD');
  instructions = createDiv('[1–5: algorithms] [A/D: cycle through art]<br>[SPACE: reset/start new alg]').parent(HUD);
  instructions.size(525, 75);
  
  algsList = createDiv('Available Algorithms:<br>Pixel Scramble<br>ASCII Conversion<br>Melt<br>Scanline Glitch<br>Color Palette Reduce')
  .parent(HUD).style('margin-top', '50px');
}

function draw() {
  background(0);
  
  // 
  if (amt < 1) {
    amt += 0.02;
    amt = constrain(amt, 0, 1);
    applyDisintegration(buffer, algorithmType, amt);
  }

  image(buffer, width/2, height/2);
  drawHUD();
}



// HANDLE INPUT

function keyPressed() {
  if (key === ' ') loadArtwork(currentArtwork); 
  if (key >= '1' && key <= '9') algorithmType = int(key) - 1;
  if (key === 'D' || key === 'd') nextArtwork();
  if (key === 'A' || key === 'a') prevArtwork();
}



// CORE FUNCS

function loadArtwork(idx) {
  currentArtwork = idx % artworks.length;
  original = artworks[currentArtwork];

  scaledOriginal = createImage(width, height);
  scaledOriginal.copy(original, 0, 0, original.width, original.height, 0, 0, width, height);

  buffer.image(scaledOriginal, 0, 0, width, height);
  amt = 0;
  asciiInitialized = false;
  scanlineProgress = 0;
}

function nextArtwork() {
  currentArtwork = (currentArtwork + 1) % artworks.length;
  loadArtwork(currentArtwork);
}

function prevArtwork() {
  currentArtwork = (currentArtwork - 1 + artworks.length) % artworks.length;
  loadArtwork(currentArtwork);
}

function applyDisintegration(buf, type, amt) {
  
  switch (type) {
    case 0: Scramble(buf, amt); break;
    case 1: Ascii(buf, amt); break;
    case 2: Melt(buf, amt); break;
    case 3: Scanline(buf, amt); break;
    case 4: ColorReduce(buf, amt); break;
    default: break;
    
  }
}




// DISINTEGRATION FUNCTIONS

function Scramble(buf, amt) {
  let moves = 5;  
  let blockSize = 60;  

  for (let i = 0; i < moves; i++) {
    let sx = int(random(0, width - blockSize));
    let sy = int(random(0, height - blockSize));
    let dx = int(random(0, width - blockSize));
    let dy = int(random(0, height - blockSize));

    buf.copy(buf, sx, sy, blockSize, blockSize, dx, dy, blockSize, blockSize);
  }
}




function Ascii(buf, amt) {
  if (!asciiInitialized && amt === 0) {
    buf.image(scaledOriginal, 0, 0, width, height);
    asciiInitialized = true;
  }

  let chars = "@&%0$#?/*!+><;+^,_:'-.` ";          
  let step = 5;                            // might increase if its taking too long to load

  // fade original image underneath over time
  buf.push();
  buf.clear();
  buf.tint(255, 255 * (1 - amt));
  buf.image(scaledOriginal, 0, 0, width, height);
  buf.noTint();
  
  // reveeal ascii along diagonal
  buf.fill(255);
  buf.textFont('monospace');
  buf.textSize(step);
  buf.textAlign(LEFT, TOP);
  buf.noStroke();

  scaledOriginal.loadPixels();
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      let diagProg = 1.0 - ((x / width) * 0.7 + (y / height) * 0.3);
      if (diagProg < amt) {
        let c = scaledOriginal.get(x, y);
        let brightness = (red(c) + green(c) + blue(c)) / 3;
        let idx = int(map(brightness, 0, 255, 0, chars.length - 1));
        let ch = chars[idx];
        buf.text(ch, x, y);
      }
    }
  }

  buf.pop();
}





function Melt(buf, amt) {
  if (amt === 0) {
    buf.image(scaledOriginal, 0, 0, width, height);
    return;
  }
  if (amt >= 1) return;

  buf.loadPixels();
  scaledOriginal.loadPixels();
  let temp = buf.pixels.slice();

  let drip = int(map(amt, 0, 1, 0, 11)); 
  let wave = map(amt, 0, 1, 0, 0.6);

  for (let y = height - 2; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      let idx = (y * width + x) * 4;
      let bright = (temp[idx] + temp[idx + 1] + temp[idx + 2]) / 3;
      let drift = int(map(bright, 0, 255, drip * 0.2, drip));
      drift += int(sin((x + frameCount * 2) * 0.02) * drip * wave);

      let ny = constrain(y + drift, 0, height - 1);
      let nidx = (ny * width + x) * 4;

      buf.pixels[nidx]      = temp[idx];
      buf.pixels[nidx + 1]  = temp[idx + 1];
      buf.pixels[nidx + 2]  = temp[idx + 2];
      buf.pixels[nidx + 3]  = 255;
    }
  }

  buf.updatePixels();
}




function Scanline(buf, amt) {
  if (amt === 0) {
    buf.image(scaledOriginal, 0, 0, width, height);
    scanlineProgress = 0;
    return;
  }

  buf.loadPixels();
  scaledOriginal.loadPixels();
  let temp = scaledOriginal.pixels.slice();
  let rowLen = width * 4;

  // tweak these a bit more ??
  let maxShift = 80;
  let glitchChance = 0.4;
  let bandHeight = int(random(5, 25));
  
  // only process rows that haven't been changed
  let targetRow = int(height * amt);
  for (let y = scanlineProgress; y < targetRow; y += bandHeight) {
    if (random() < glitchChance) {
      let shift = int(random(-maxShift, maxShift));
      for (let dy = 0; dy < bandHeight && y + dy < targetRow; dy++) {
        for (let x = 0; x < width; x++) {
          let sx = (x + shift + width) % width;
          let srcIdx = ((y + dy) * width + sx) * 4;
          let dstIdx = ((y + dy) * width + x) * 4;

          buf.pixels[dstIdx]      = temp[srcIdx];
          buf.pixels[dstIdx + 1]  = temp[srcIdx + 1];
          buf.pixels[dstIdx + 2]  = temp[srcIdx + 2];
          buf.pixels[dstIdx + 3]  = 255;
        }
      }
    } else {
      // unglitched rn
      for (let dy = 0; dy < bandHeight && y + dy < targetRow; dy++) {
        let srcStart = ((y + dy) * width) * 4;
        let dstStart = srcStart;
        for (let i = 0; i < rowLen; i++) {
          buf.pixels[dstStart + i] = temp[srcStart + i];
        }
      }
    }
  }

  scanlineProgress = targetRow;
 
  for (let y = targetRow; y < height; y++) {
    let srcStart = (y * width) * 4;
    let dstStart = srcStart;
    for (let i = 0; i < rowLen; i++) {
      buf.pixels[dstStart + i] = temp[srcStart + i];
    }
  }

  buf.updatePixels();
}




function ColorReduce(buf, amt) {
  if (amt === 0) {
    buf.image(scaledOriginal, 0, 0, width, height);
    return;
  }

  buf.push();
  buf.loadPixels();
  scaledOriginal.loadPixels();

  // finding max and min brightness in this painting
  let minB = 255;
  let maxB = 0;
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      let idx = (x + y * buf.width) * 4;
      let r = scaledOriginal.pixels[idx];
      let g = scaledOriginal.pixels[idx + 1];
      let b = scaledOriginal.pixels[idx + 2];
      let bright = (r + g + b) / 3;
      if (bright < minB) minB = bright;
      if (bright > maxB) maxB = bright;
    }
  }

  let revealRow = int(buf.height * amt);

  // apply new palette for revealed rows
  for (let y = 0; y < revealRow; y++) {
    for (let x = 0; x < buf.width; x++) {
      let idx = (x + y * buf.width) * 4;
      let r = scaledOriginal.pixels[idx];
      let g = scaledOriginal.pixels[idx + 1];
      let b = scaledOriginal.pixels[idx + 2];
      let bright = (r + g + b) / 3;

      let shadeIdx = int(map(bright, minB, maxB, 0, 3));
      shadeIdx = constrain(shadeIdx, 0, 3);
      let shade = palette[shadeIdx];

      buf.pixels[idx]     = shade[0];
      buf.pixels[idx + 1] = shade[1];
      buf.pixels[idx + 2] = shade[2];
    }
  }

  buf.updatePixels();
  buf.pop();
}


// UPDATING UI

function drawHUD() {
  artLabel.html(`Artwork: ${artInfo[currentArtwork].name}<br>Artist: ${artInfo[currentArtwork].artist}<br>Year: ${artInfo[currentArtwork].year}`);
  algorithmLabel.html(`Current Algorithm: ${algorithmName(algorithmType)}`);
}

function algorithmName(t) {
  switch (t) {
    case 0: return "Pixel Scramble";
    case 1: return "ASCII Conversion";
    case 2: return "Melt";
    case 3: return "Scanline Glitch";
    case 4: return "Color Palette Reduce";
    default: return "Empty";
  }
}
