const { PNG } = require('pngjs');

function crc8(data) {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x80) !== 0) crc = ((crc << 1) ^ 0x07) & 0xff;
      else crc = (crc << 1) & 0xff;
    }
  }
  return crc & 0xff;
}

function verifyOC8FromBuffer(buffer) {
  let PNGMod;
  try {
    PNGMod = require('pngjs').PNG;
  } catch (err) {
    throw new Error('verifyOC8 requires package "pngjs" to be installed. Run: npm i -D pngjs');
  }

  let img;
  try {
    img = PNGMod.sync.read(buffer);
  } catch (err) {
    return false;
  }

  const data = img.data;
  if (!data || data.length % 4 !== 0) return false;

  const collected = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const block = Buffer.from([r, g, b]);
    if (crc8(block) === a) {
      collected.push(r, g, b);
    }
  }

  if (collected.length < 8) return false;

  const collBuf = Buffer.from(collected);
  const magic = collBuf.slice(0, 4).toString('utf8');
  if (magic !== 'OC8F') return false;

  const length = collBuf.readUInt32LE(4);
  const available = collBuf.length - 8;
  return available >= length;
}

module.exports = { verifyOC8FromBuffer };
