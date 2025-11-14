// Verify OC8 PNG contains a valid OC8 stream (magic + length + sufficient bytes)
// This function uses `pngjs` at runtime. It will throw if `pngjs` is not installed.

function crc8(data: Buffer, poly = 0x07, init = 0x00): number {
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

export function verifyOC8FromBuffer(buffer: Buffer): boolean {
  // load pngjs dynamically to avoid hard dependency at compile time
  let PNG: any;
  try {
    PNG = (require('pngjs') as any).PNG;
  } catch (err) {
    throw new Error('verifyOC8 requires package "pngjs" to be installed. Run: npm i -D pngjs');
  }

  // read PNG sync
  let img: any;
  try {
    img = PNG.sync.read(buffer);
  } catch (err) {
    // not a PNG or parse failed
    return false;
  }

  const data: Buffer = img.data as Buffer; // RGBA buffer
  if (!data || data.length % 4 !== 0) return false;

  const collected: number[] = [];
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

export default verifyOC8FromBuffer;
