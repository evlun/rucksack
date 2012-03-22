function OutputBuffer() {
  this.pool = [];
  this.items = [];
  this.size = 0;
}

OutputBuffer.prototype.allocate = function(size) {
  var i, block;

  for (i = 0; i < this.pool.length; i++) {
    block = this.pool[i];
    if (block.length - block.used >= size) return block;
  }

  block = new Buffer(Math.max(8 * 1024, size));
  block.used = 0;

  this.pool.push(block);

  return block;
};

OutputBuffer.prototype.write = function(byte) {
  this.items.push(byte);
  this.size += 1;
};

OutputBuffer.prototype.writeVarint = function(value) {
  // sorry about the mess, but inlining this code rather than using a simple
  // while loop increases performance fivefold

  if (value < 128) {
    this.items.push(Math.floor(value)); this.size += 1; return;
  }

  this.items.push((value & 0x7f) | 0x80);

  if (value < 16384) {
    this.items.push((value / 128) & 0x7f); this.size += 2; return;
  }

  this.items.push(((value / 128) & 0x7f) | 0x80);

  if (value < 2097152) {
    this.items.push((value / 16384) & 0x7f); this.size += 3; return;
  }

  this.items.push(((value / 16384) & 0x7f) | 0x80);

  if (value < 268435456) {
    this.items.push((value / 2097152) & 0x7f); this.size += 4; return;
  }

  this.items.push(((value / 2097152) & 0x7f) | 0x80);

  if (value < 34359738368) {
    this.items.push((value / 268435456) & 0x7f); this.size += 5; return;
  }

  this.items.push(((value / 268435456) & 0x7f) | 0x80);

  if (value < 4398046511104) {
    this.items.push((value / 34359738368) & 0x7f); this.size += 6; return;
  }

  this.items.push(((value / 34359738368) & 0x7f) | 0x80);

  if (value < 562949953421312) {
    this.items.push((value / 4398046511104) & 0x7f); this.size += 7; return;
  }

  this.items.push(((value / 4398046511104) & 0x7f) | 0x80);
  this.items.push((value / 562949953421312) & 0x7f);
  this.size += 8;
};

OutputBuffer.prototype.writeDouble = function(value) {
  // @todo: this is absolutely horrible and should be replaced as soon as
  //        humanly possible
  var arr = new Array(8);
  Buffer.prototype.writeDoubleLE.call(arr, value, 0);
  for (var i = 0; i < arr.length; i++) {
    this.write(arr[i]);
  }
};

function Utf8String(parent, source, start, length) {
  this.parent = parent;
  this.source = source;
  this.start = start;
  this.end = start + length;
  this.length = length;
}

OutputBuffer.prototype.prepareUtf8 = function(str) {
  var block, start, pointer, i, c;

  if (str === '') {
    return new Utf8String(this, null, 0, 0);
  }

  block = this.allocate(str.length * 3);
  start = block.used;
  pointer = start;

  for (i = 0; i < str.length; i++) {
    c = str.charCodeAt(i);

    if (c < 128) {
      block[pointer++] = c;
    } else if (c < 2048) {
      block[pointer++] = (c >> 6) | 192;
      block[pointer++] = (c & 63) | 128;
    } else {
      block[pointer++] = (c >> 12) | 224;
      block[pointer++] = (c >> 6 & 63) | 128;
      block[pointer++] = (c & 63) | 128;
    }
  }

  block.used = pointer;

  return new Utf8String(this, block, start, pointer - start);
};

OutputBuffer.prototype.insertUtf8 = function(str) {
  this.items.push(str);
  this.size += str.length;
};

OutputBuffer.prototype.flush = function() {
  var buf = new Buffer(this.size),
      o = 0,
      i, l, j, k, item, src;

  for (i = 0, l = this.items.length; i < l; i++) {
    item = this.items[i];

    if (typeof item === 'number') {
      buf[o++] = item;
    } else if (item instanceof Utf8String) {
      src = item.source;
      for (j = item.start, k = item.end; j < k; j++) {
        buf[o++] = src[j];
      }
    }
  }

  for (i = 0; i < this.pool.length; i++) {
    this.pool[i].used = 0;
  }

  this.items = [];
  this.count = 0;
  this.size = 0;

  return buf;
};

module.exports = OutputBuffer;
