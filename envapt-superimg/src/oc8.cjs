const { PNG } = require('pngjs');

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

function encodeOc8ToPngBuffer(payload) {
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
  return PNG.sync.write(png);
}

function decodeOc8FromPngBuffer(buffer) {
  const img = PNG.sync.read(buffer);
  const data = img.data;
  const collected = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const block = Buffer.from([r, g, b]);
    if (crc8(block) === a) collected.push(r, g, b);
  }
  const collBuf = Buffer.from(collected);
  const magic = collBuf.slice(0, 4).toString('utf8');
  if (magic !== 'OC8F') throw new Error('Invalid OC8 magic');
  const length = collBuf.readUInt32LE(4);
  const available = collBuf.length - 8;
  if (available < length) throw new Error('Insufficient OC8 data');
  return collBuf.slice(8, 8 + length);
}

module.exports = { encodeOc8ToPngBuffer, decodeOc8FromPngBuffer };
