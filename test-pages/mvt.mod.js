class Reader {
  constructor(buf) {
    this.buf = buf;
    this.pos = 0;
    this.len = buf.length;
    this._dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  // Unsigned varint → JS number. Exact to 2^53; higher bits (rare — 64-bit ids)
  // silently lose precision, which nothing here depends on.
  varint() {
    let result = 0, shift = 0, b;
    do {
      if (this.pos >= this.len) throw new Error("eof");
      b = this.buf[this.pos++];
      if (shift < 28) result |= (b & 127) << shift;
      else result += (b & 127) * Math.pow(2, shift);
      shift += 7;
      if (shift > 70) throw new Error("varint");
    } while (b & 128);
    return result < 0 ? result >>> 0 : result;
  }
  float() {
    if (this.pos + 4 > this.len) throw new Error("eof");
    const v = this._dv.getFloat32(this.pos, true);
    this.pos += 4;
    return v;
  }
  double() {
    if (this.pos + 8 > this.len) throw new Error("eof");
    const v = this._dv.getFloat64(this.pos, true);
    this.pos += 8;
    return v;
  }
  // A length-delimited field's byte slice.
  bytes() {
    const l = this.varint();
    if (this.pos + l > this.len) throw new Error("eof");
    const out = this.buf.subarray(this.pos, this.pos + l);
    this.pos += l;
    return out;
  }
  string() {
    return utf8(this.bytes());
  }
  // Skip one field's payload given its wire type.
  skip(wire) {
    if (wire === 0) this.varint();
    else if (wire === 1) {
      if (this.pos + 8 > this.len) throw new Error("eof");
      this.pos += 8;
    } else if (wire === 2) {
      const l = this.varint();
      if (this.pos + l > this.len) throw new Error("eof");
      this.pos += l;
    } else if (wire === 5) {
      if (this.pos + 4 > this.len) throw new Error("eof");
      this.pos += 4;
    } else throw new Error("wire");
  }
}
function utf8(bytes) {
  try {
    if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8").decode(bytes);
  } catch {
  }
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}
function zigzag(n) {
  return n >>> 1 ^ -(n & 1);
}
function decodeValue(bytes) {
  const r = new Reader(bytes);
  let out = "";
  while (r.pos < r.len) {
    const tag = r.varint();
    const field = tag >> 3, wire = tag & 7;
    try {
      switch (field) {
        case 1:
          out = r.string();
          break;
        case 2:
          out = r.float();
          break;
        case 3:
          out = r.double();
          break;
        case 4:
          out = r.varint();
          break;
        // int64
        case 5:
          out = r.varint();
          break;
        // uint64
        case 6:
          out = zigzag(r.varint());
          break;
        // sint64
        case 7:
          out = r.varint() !== 0;
          break;
        // bool
        default:
          r.skip(wire);
          break;
      }
    } catch {
      break;
    }
  }
  return out;
}
function decodeGeometry(cmds, type) {
  const out = [];
  let cur = null;
  let x = 0, y = 0;
  let i = 0;
  while (i < cmds.length) {
    const cmd = cmds[i++];
    const id = cmd & 7;
    const count = cmd >> 3;
    if (id === 1) {
      for (let k = 0; k < count; k++) {
        if (i + 2 > cmds.length) break;
        x += zigzag(cmds[i++]);
        y += zigzag(cmds[i++]);
        cur = [{ x, y }];
        out.push(cur);
      }
    } else if (id === 2) {
      if (!cur) {
        cur = [{ x, y }];
        out.push(cur);
      }
      for (let k = 0; k < count; k++) {
        if (i + 2 > cmds.length) break;
        x += zigzag(cmds[i++]);
        y += zigzag(cmds[i++]);
        cur.push({ x, y });
      }
    } else if (id === 7) {
      cur = null;
    } else {
      break;
    }
  }
  if (type === "point") return out.filter((r) => r.length >= 1);
  return out.filter((r) => r.length >= 2);
}
function decodeFeature(bytes, keys, values) {
  const r = new Reader(bytes);
  let id = 0;
  let type = "unknown";
  let tagsRaw = [];
  let geomRaw = [];
  try {
    while (r.pos < r.len) {
      const tag = r.varint();
      const field = tag >> 3, wire = tag & 7;
      if (field === 1 && wire === 0) id = r.varint();
      else if (field === 2 && wire === 2) tagsRaw = readPackedVarints(r);
      else if (field === 2 && wire === 0) tagsRaw.push(r.varint());
      else if (field === 3 && wire === 0) {
        const t = r.varint();
        type = t === 1 ? "point" : t === 2 ? "line" : t === 3 ? "polygon" : "unknown";
      } else if (field === 4 && wire === 2) geomRaw = readPackedVarints(r);
      else if (field === 4 && wire === 0) geomRaw.push(r.varint());
      else r.skip(wire);
    }
  } catch {
  }
  const tags = {};
  for (let k = 0; k + 1 < tagsRaw.length; k += 2) {
    const ki = tagsRaw[k], vi = tagsRaw[k + 1];
    const key = keys[ki];
    if (key === void 0) continue;
    const val = values[vi];
    if (val === void 0) continue;
    tags[key] = val;
  }
  let geometry = [];
  try {
    geometry = decodeGeometry(geomRaw, type);
  } catch {
    geometry = [];
  }
  return { id, type, tags, geometry };
}
function readPackedVarints(r) {
  const slice = r.bytes();
  const inner = new Reader(slice);
  const out = [];
  while (inner.pos < inner.len) {
    try {
      out.push(inner.varint());
    } catch {
      break;
    }
  }
  return out;
}
function decodeLayer(bytes) {
  const r = new Reader(bytes);
  let name = "";
  let extent = 4096;
  const keys = [];
  const values = [];
  const featureSlices = [];
  try {
    while (r.pos < r.len) {
      const tag = r.varint();
      const field = tag >> 3, wire = tag & 7;
      if (field === 1 && wire === 2) name = r.string();
      else if (field === 2 && wire === 2) featureSlices.push(r.bytes());
      else if (field === 3 && wire === 2) keys.push(r.string());
      else if (field === 4 && wire === 2) values.push(decodeValue(r.bytes()));
      else if (field === 5 && wire === 0) extent = r.varint();
      else r.skip(wire);
    }
  } catch {
  }
  if (!name) return null;
  const features = [];
  for (const fs of featureSlices) {
    const f = decodeFeature(fs, keys, values);
    if (f) features.push(f);
  }
  return { name, extent: extent || 4096, features };
}
function decodeTile(bytes) {
  const out = { layers: {} };
  if (!bytes || bytes.length === 0) return out;
  const r = new Reader(bytes);
  try {
    while (r.pos < r.len) {
      const tag = r.varint();
      const field = tag >> 3, wire = tag & 7;
      if (field === 3 && wire === 2) {
        const slice = r.bytes();
        const layer = decodeLayer(slice);
        if (layer && !(layer.name in out.layers)) out.layers[layer.name] = layer;
      } else {
        r.skip(wire);
      }
    }
  } catch {
  }
  return out;
}
function decodeTileLayers(bytes) {
  return Object.values(decodeTile(bytes).layers);
}
export {
  decodeTile,
  decodeTileLayers
};
