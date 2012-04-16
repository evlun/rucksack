var SlowBuffer = require('buffer').SlowBuffer;

function FauxBuffer(parent, offset, end) {
  this.parent = parent;
  this.offset = offset;
  this.end = end;
  this.length = end - offset;
}

FauxBuffer.prototype.copy = function(target, offset) {
  return this.parent.copy(target, offset, this.offset, this.end);
};

FauxBuffer.prototype.slice = function(start, length) {
  return new Buffer(this.parent, start, length);
};

function OutputBuffer() {
  this.pool = [];
  this.items = [];
  this.size = 0;
}

OutputBuffer.prototype.allocate = function(size) {
  var i, slow, fast, block;

  for (i = 0; i < this.pool.length; i++) {
    block = this.pool[i];
    if (block.end - block.offset >= size)
      return block;
  }

  size = Math.max(8 * 1024, size);

  slow = new SlowBuffer(size);
  block = new FauxBuffer(slow, 0, size);

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
  var maxlen = value.length * 3,
      buf = this.allocate(maxlen),
      slow = buf.parent,
      offset = buf.offset,
      size = slow.utf8Write(value, offset, maxlen);

  buf.offset += size;

  return new FauxBuffer(slow, offset, offset + size);
};

OutputBuffer.prototype.insert = function(buffer) {
  this.items.push(buffer);
  this.size += buffer.length;
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
      o += item.copy(buf, o);
    }
  }

  // free the buffer pool
  for (i = 0; i < this.pool.length; i++) {
    this.pool[i].offset = 0;
  }

  this.items = [];
  this.size = 0;

  return buf;
};

module.exports = OutputBuffer;
