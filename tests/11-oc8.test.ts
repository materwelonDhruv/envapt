import { expect } from 'chai';
import { describe, it } from 'vitest';
import * as path from 'node:path';

// Dynamic import CJS helpers from envapt-superimg
async function loadOc8Modules() {
  // Use dynamic import which works with .cjs in ESM test runner
  const oc8 = await import('../envapt-superimg/src/oc8.cjs');
  const verify = await import('../envapt-superimg/src/__test__/verify-oc8.cjs');
  // The verify script exports nothing; instead import the module that contains verify function
  const verifyModule = await import('../envapt-superimg/src/verifyOC8.cjs').catch(() => undefined);

  return { oc8, verifyModule };
}

function crc8(data: Buffer, poly = 0x07, init = 0x00) {
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

describe('OC8 encode/decode helpers', () => {
  it('should roundtrip payload via oc8 encode/decode', async () => {
    const { oc8 } = await loadOc8Modules();
    // oc8.cjs exports encodeOc8ToPngBuffer and decodeOc8FromPngBuffer
    const { encodeOc8ToPngBuffer, decodeOc8FromPngBuffer } = oc8 as any;

    const payload = Buffer.from('this is a secret payload', 'utf8');
    const png = encodeOc8ToPngBuffer(payload);
    const out = decodeOc8FromPngBuffer(png);
    expect(out.toString('utf8')).to.equal(payload.toString('utf8'));
  });

  it('verifyOC8FromBuffer should detect valid and invalid images', async () => {
    const verifyMod = await import('../envapt-superimg/src/verifyOC8.cjs');
    const { verifyOC8FromBuffer } = verifyMod as any;

    const oc8mod = await import('../envapt-superimg/src/oc8.cjs');
    const { encodeOc8ToPngBuffer } = oc8mod as any;

    const payload = Buffer.from('hello world', 'utf8');
    const pngbuf = encodeOc8ToPngBuffer(payload);
    const ok = verifyOC8FromBuffer(pngbuf);
    expect(ok).to.equal(true);

    // random png should be false
    const { PNG } = await import('pngjs');
    const png = new PNG({ width: 4, height: 4 });
    for (let i = 0; i < png.data.length; i++) png.data[i] = Math.floor(Math.random() * 256);
    const buf = PNG.sync.write(png);
    const ok2 = verifyOC8FromBuffer(buf);
    expect(ok2).to.equal(false);
  });

  it('decoder should throw on insufficient data', async () => {
    const oc8mod = await import('../envapt-superimg/src/oc8.cjs');
    const { encodeOc8ToPngBuffer, decodeOc8FromPngBuffer } = oc8mod as any;

    const png = encodeOc8ToPngBuffer(Buffer.from('short', 'utf8'));
    // corrupt first pixel alpha so collected bytes insufficient
    const { PNG } = await import('pngjs');
    const img = PNG.sync.read(png);
    img.data[3] = img.data[3] ^ 0xff;
    const corrupt = PNG.sync.write(img);

    let thrown = false;
    try {
      decodeOc8FromPngBuffer(corrupt);
    } catch (e) {
      thrown = true;
    }
    expect(thrown).to.equal(true);
  });
});
