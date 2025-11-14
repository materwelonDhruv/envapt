const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');
const verifyOC8FromBuffer = require('../verifyOC8.cjs').verifyOC8FromBuffer;

function crc8(data, poly = 0x07, init = 0x00) {
  let crc = init & 0xff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x80) !== 0) crc = ((crc << 1) ^ poly) & 0xff;
      else crc = (crc << 1) & 0xff;
    }
  }
  return crc & 0xff;
}

function buildOc8Stream(payload) {
  const magic = Buffer.from('OC8F', 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(payload.length, 0);
  return Buffer.concat([magic, len, payload]);
}

function encodeOc8ToPng(payload) {
  const oc8 = buildOc8Stream(payload);
  const pixels = [];
  for (let i = 0; i < oc8.length; i += 3) {
    const chunk = oc8.slice(i, i + 3);
    const r = chunk[0] || 0;
    const g = chunk[1] || 0;
    const b = chunk[2] || 0;
    const a = crc8(Buffer.from([r, g, b]));
    pixels.push(r, g, b, a);
  }

  const numPixels = pixels.length / 4;
  const size = Math.ceil(Math.sqrt(numPixels));
  const png = new PNG({ width: size, height: size });
  for (let i = 0; i < png.data.length; i++) png.data[i] = 0;
  for (let i = 0; i < pixels.length; i++) png.data[i] = pixels[i];

  const chunks = PNG.sync.write(png);
  return chunks;
}

(async () => {
  const tmp = path.resolve(process.cwd(), 'envapt-superimg', 'tmp');
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

  // test 1
  {
    const payload = Buffer.from('hello world', 'utf8');
    const pngbuf = encodeOc8ToPng(payload);
    const ok = verifyOC8FromBuffer(pngbuf);
    assert.strictEqual(ok, true, 'valid oc8 png should return true');
  }

  // test 2
  {
    const png = new PNG({ width: 4, height: 4 });
    for (let i = 0; i < png.data.length; i++) png.data[i] = Math.floor(Math.random() * 256);
    const buf = PNG.sync.write(png);
    const ok = verifyOC8FromBuffer(buf);
    assert.strictEqual(ok, false, 'random png should return false');
  }

  console.log('verify-oc8 tests passed');
})();
