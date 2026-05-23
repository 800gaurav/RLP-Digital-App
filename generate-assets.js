/**
 * generate-assets.js
 * Run: node generate-assets.js
 * Creates minimal valid PNG placeholder assets for Expo.
 * Replace with real RLP-branded assets before production.
 */
const fs = require('fs');
const path = require('path');

// Minimal 1x1 green PNG (valid PNG binary)
// This is a real PNG: 1x1 pixel, #006E2E green
function makeMinimalPng(r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: 1x1, 8-bit RGB
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0); // width
  ihdrData.writeUInt32BE(1, 4); // height
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk: filtered pixel data (zlib compressed)
  // Filter byte 0x00 + RGB pixel
  const zlib = require('zlib');
  const raw = Buffer.from([0, r, g, b]);
  const compressed = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crc = require('zlib').crc32(Buffer.concat([typeB, data]));
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

const assetsDir = path.join(__dirname, 'assets');

// Green placeholder (RLP Green #006E2E = 0, 110, 46)
const greenPng = makeMinimalPng(0, 110, 46);
// Yellow placeholder (RLP Yellow #FFD400 = 255, 212, 0)
const yellowPng = makeMinimalPng(255, 212, 0);

const files = {
  'icon.png': yellowPng,
  'splash.png': greenPng,
  'adaptive-icon.png': yellowPng,
  'favicon.png': yellowPng,
  'notification-icon.png': greenPng,
};

for (const [name, data] of Object.entries(files)) {
  const filePath = path.join(assetsDir, name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, data);
    console.log(`✅ Created placeholder: assets/${name}`);
  } else {
    console.log(`⏭  Already exists: assets/${name}`);
  }
}

console.log('\n⚠️  These are 1x1 pixel placeholders.');
console.log('Replace with real RLP-branded assets before production.\n');
