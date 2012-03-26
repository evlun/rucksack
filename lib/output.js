function Chunk(source, start, end) {
  this.source = source;
  this.start = start;
  this.end = end;
  this.length = end - start;
}

function OutputBuffer() {
  this.pool = [];
  this.items = [];
  this.size = 0;
}

OutputBuffer.prototype.allocate = function(size) {
  var i, block;

  for (i = 0; i < this.pool.length; i++) {
    block = this.pool[i];
    if (block.length - block.used >= size)
      return block;
  }

  block = new Buffer(Math.max(8 * 1024, size));
  block.used = 0;

  this.pool.push(block);

  return block;
};

OutputBuffer.prototype.writeByte = function(value) {
  this.items.push(value);
  this.size += 1;
};

OutputBuffer.prototype.writeVarint = function(value) {
  // sorry about the mess, but inlining this code rather than using a simple
  // while loop increases performance fivefold
  if (value < 0x80) { this.items.push(value & 0x7f); this.size += 1; return; }
  this.items.push(value & 0x7f | 0x80); value = Math.floor(value / 0x80);
  if (value < 0x80) { this.items.push(value & 0x7f); this.size += 2; return; }
  this.items.push(value & 0x7f | 0x80); value = Math.floor(value / 0x80);
  if (value < 0x80) { this.items.push(value & 0x7f); this.size += 3; return; }
  this.items.push(value & 0x7f | 0x80); value = Math.floor(value / 0x80);
  if (value < 0x80) { this.items.push(value & 0x7f); this.size += 4; return; }
  this.items.push(value & 0x7f | 0x80); value = Math.floor(value / 0x80);
  if (value < 0x80) { this.items.push(value & 0x7f); this.size += 5; return; }
  this.items.push(value & 0x7f | 0x80); value = Math.floor(value / 0x80);
  if (value < 0x80) { this.items.push(value & 0x7f); this.size += 6; return; }
  this.items.push(value & 0x7f | 0x80); value = Math.floor(value / 0x80);
  if (value < 0x80) { this.items.push(value & 0x7f); this.size += 7; return; }
  this.items.push(value & 0x7f | 0x80);
  this.items.push((value / 0x80) & 0x7f);
  this.size += 8;
};

OutputBuffer.prototype.writeDouble = function(value) {
  var m,
      negative = value < 0 || (value === 0 && 1 / value < 0),
      abs = Math.abs(value),
      e = Math.floor(Math.log(abs) / Math.LN2),
      c = Math.pow(2, -e);

  if (abs * c < 1) { e -= 1; c *= 2; }
  if (abs * c >= 2) { e += 1; c /= 2; }

  if (e >= 1024) {
    m = 0;
    e = 2047;
  } else if (e >= -1022) {
    m = (abs * c - 1) * Math.pow(2, 52);
    e += 1023;
  } else {
    // @note: combining `Math.pow(2, 1022) * Math.pow(2, 52)` into
    //        `Math.pow(2, 1074)` causes weird results
    m = abs * Math.pow(2, 1022) * Math.pow(2, 52);
    e = 0;
  }

  this.items.push(m & 0xff); m /= 0x100;
  this.items.push(m & 0xff); m /= 0x100;
  this.items.push(m & 0xff); m /= 0x100;
  this.items.push(m & 0xff); m /= 0x100;
  this.items.push(m & 0xff); m /= 0x100;
  this.items.push(m & 0xff); m /= 0x100;

  e = (e << 4) | m;

  this.items.push(e & 0xff); e /= 0x100;
  this.items.push(negative ? (e & 0xff) | 0x80 : e & 0x7f);

  this.size += 8;
};

OutputBuffer.prototype.generateUtf8 = function(value) {
  var start, end, i, char,
      buf = this.allocate(value.length * 3);

  end = start = buf.used;

  for (i = 0; i < value.length; i++) {
    char = value.charCodeAt(i);

    if (char < 128) {
      buf[end++] = char;
    } else if (char < 2048) {
      buf[end++] = (char >> 6) | 192;
      buf[end++] = (char & 63) | 128;
    } else {
      buf[end++] = (char >> 12) | 224;
      buf[end++] = (char >> 6 & 63) | 128;
      buf[end++] = (char & 63) | 128;
    }
  }

  buf.used = end;

  return new Chunk(buf, start, end);
};

OutputBuffer.prototype.insert = function(chunk) {
  this.items.push(chunk);
  this.size += chunk.length;
};

OutputBuffer.prototype.flush = function() {
  var i, j, item, src,
      buf = new Buffer(this.size),
      o = 0;

  for (i = 0; i < this.items.length; i++) {
    item = this.items[i];
    if (typeof item === 'number') {
      buf[o++] = item;
    } else {
      src = item.source;
      for (j = item.start; j < item.end; j++) {
        buf[o++] = src[j];
      }
    }
  }

  // free the buffer pool
  for (i = 0; i < this.pool.length; i++) {
    this.pool[i].used = 0;
  }

  this.items = [];
  this.size = 0;

  return buf;
};

module.exports = OutputBuffer;
