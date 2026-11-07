/* Reads the location your phone hid inside a video or photo. Runs on the device: nothing is uploaded.
   Videos: QuickTime/MP4 ISO 6709 string (iPhone "com.apple.quicktime.location.ISO6709", Android "©xyz").
   Photos: EXIF GPS (JPEG, HEIC). */
(function (root) {
  const latin1 = (u8) => { let s = ''; const n = 0x8000; for (let i = 0; i < u8.length; i += n) s += String.fromCharCode.apply(null, u8.subarray(i, i + n)); return s; };
  const ISO = /([+-]\d{1,2}\.\d{2,})([+-]\d{1,3}\.\d{2,})([+-]\d{1,6}(?:\.\d+)?)?\//;
  const DATE = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:?\d{2}|Z)?)/;

  async function findMoov(read, size) {
    let off = 0, guard = 0;
    while (off + 8 <= size && guard++ < 4096) {
      const h = await read(off, Math.min(off + 16, size));
      const dv = new DataView(h.buffer, h.byteOffset, h.byteLength);
      let len = dv.getUint32(0), hdr = 8;
      const type = String.fromCharCode(h[4], h[5], h[6], h[7]);
      if (len === 1 && h.length >= 16) { len = dv.getUint32(8) * 4294967296 + dv.getUint32(12); hdr = 16; }
      else if (len === 0) len = size - off;
      if (type === 'moov') return read(off, Math.min(off + len, off + 64 * 1024 * 1024));
      if (len < hdr) break;
      off += len;
    }
    return null;
  }

  async function fromVideo(read, size) {
    let buf = await findMoov(read, size);
    let txt = buf ? latin1(buf) : '';
    if (!ISO.test(txt)) { /* fallback: scan the ends of the file */
      const a = await read(0, Math.min(size, 4 * 1024 * 1024));
      const b = await read(Math.max(0, size - 8 * 1024 * 1024), size);
      txt = latin1(a) + latin1(b);
    }
    const m = txt.match(ISO);
    if (!m) return null;
    const d = txt.match(DATE);
    return { lat: parseFloat(m[1]), lon: parseFloat(m[2]), alt: m[3] !== undefined ? parseFloat(m[3]) : null, time: d ? d[1] : null, raw: m[0], kind: 'video' };
  }

  function tiff(u8, start) {
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const le = u8[start] === 0x49;
    const g16 = (o) => dv.getUint16(start + o, le), g32 = (o) => dv.getUint32(start + o, le);
    if (g16(2) !== 42) return null;
    const ifd = (o) => { const n = g16(o), out = {}; for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; out[g16(e)] = { type: g16(e + 2), count: g32(e + 4), at: e + 8 }; } return out; };
    const rat = (ent, k) => { const p = ent.count * 8 > 4 ? g32(ent.at) : ent.at - 0; const o = p + k * 8; const den = g32(o + 4); return den ? g32(o) / den : 0; };
    const ascii = (ent) => { const p = ent.count > 4 ? g32(ent.at) : ent.at; let s = ''; for (let i = 0; i < ent.count - 1; i++) s += String.fromCharCode(u8[start + p + i]); return s; };
    const ifd0 = ifd(g32(4));
    let time = null;
    if (ifd0[0x8769]) { const ex = ifd(g32(ifd0[0x8769].at)); if (ex[0x9003]) time = ascii(ex[0x9003]); }
    if (!ifd0[0x8825]) return null;
    const gps = ifd(g32(ifd0[0x8825].at));
    if (!gps[2] || !gps[4]) return null;
    const dms = (ent) => rat(ent, 0) + rat(ent, 1) / 60 + rat(ent, 2) / 3600;
    let lat = dms(gps[2]), lon = dms(gps[4]);
    if (gps[1] && String.fromCharCode(u8[start + gps[1].at]) === 'S') lat = -lat;
    if (gps[3] && String.fromCharCode(u8[start + gps[3].at]) === 'W') lon = -lon;
    let alt = null;
    if (gps[6]) { alt = rat(gps[6], 0); if (gps[5] && u8[start + gps[5].at] === 1) alt = -alt; }
    return { lat, lon, alt, time, raw: `${lat.toFixed(4)} ${lon.toFixed(4)}${alt !== null ? ' ' + alt.toFixed(1) + ' m' : ''}`, kind: 'photo' };
  }

  async function fromPhoto(read, size) {
    const step = 4 * 1024 * 1024, max = Math.min(size, 40 * 1024 * 1024);
    for (let off = 0; off < max; off += step - 16) {
      const u8 = await read(off, Math.min(off + step, size));
      for (let i = 0; i + 10 < u8.length; i++) {
        if (u8[i] === 0x45 && u8[i + 1] === 0x78 && u8[i + 2] === 0x69 && u8[i + 3] === 0x66 && u8[i + 4] === 0 && u8[i + 5] === 0 && (u8[i + 6] === 0x49 || u8[i + 6] === 0x4d)) {
          try { const r = tiff(u8, i + 6); if (r) return r; } catch (e) { /* keep looking */ }
        }
      }
    }
    return null;
  }

  async function read(file) {
    const rd = async (a, b) => new Uint8Array(await file.slice(a, b).arrayBuffer());
    const name = (file.name || '').toLowerCase(), type = file.type || '';
    const isVideo = type.startsWith('video') || /\.(mov|mp4|m4v|3gp)$/.test(name);
    const r = isVideo ? await fromVideo(rd, file.size) : await fromPhoto(rd, file.size);
    if (r) r.file = file.name || '';
    return r;
  }

  const api = { read, fromVideo, fromPhoto };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GPS = api;
})(typeof window !== 'undefined' ? window : globalThis);
