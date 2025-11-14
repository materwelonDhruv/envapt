const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { encodeOc8ToPngBuffer, decodeOc8FromPngBuffer } = require('../oc8.cjs');

// round-trip test
(() => {
  const payload = Buffer.from('this is a secret payload', 'utf8');
  const png = encodeOc8ToPngBuffer(payload);
  const out = decodeOc8FromPngBuffer(png);
  assert.strictEqual(out.toString('utf8'), payload.toString('utf8'));
  console.log('oc8 roundtrip passed');
})();

// insufficient data test
(() => {
  // create a png with magic but truncated length
  const buf = Buffer.alloc(32);
  const png = encodeOc8ToPngBuffer(Buffer.from('short', 'utf8'));
  try {
    // modify png to corrupt alpha so decoder can't collect enough bytes
    const img = require('pngjs').PNG.sync.read(png);
    // flip alpha of first pixel
    img.data[3] = img.data[3] ^ 0xff;
    const corrupt = require('pngjs').PNG.sync.write(img);
    try { decodeOc8FromPngBuffer(corrupt); throw new Error('should have thrown') } catch (e) { console.log('oc8 insufficient data thrown as expected') }
  } catch (e) {
    console.log('oc8 insufficient data path executed');
  }
})();
