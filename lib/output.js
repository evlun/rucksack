function BufferChunk(buffer, start, end) {
  this.buffer = buffer;
  this.start = start;
  this.end = end;
  this.length = end - start;
}

BufferChunk.prototype.copy = function(target, offset) {
  for (var i = this.start; i < this.end; i++) {
    target[offset++] = this.buffer[i];
  }
  return offset;
};

function BufferView(start, end) {
  this.offset = -1;
  this.start = start;
  this.end = end;
  this.length = end - start;
  this.pointers = [];
}

BufferView.prototype.generatePointers = function() {
  var offset = this.offset,
      length = this.length;

  while (offset > 0x7f) {
    this.pointers.push(offset & 0x7f | 0x80);
    offset = Math.floor(offset / 128);
  }
  this.pointers.push(offset & 0x7f);

  while (length > 0x7f) {
    this.pointers.push(length & 0x7f | 0x80);
    length = Math.floor(length / 128);
  }
  this.pointers.push(length & 0x7f);

  return this.pointers.length;
};

BufferView.prototype.copy = function(target, offset) {
  for (var i = 0; i < this.pointers.length; i++) {
    target[offset++] = this.pointers[i];
  }
  return offset;
};

function OutputBuffer() {
  this.pool = [];
  this.items = [];
  this.data = [];
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
  var negative = value < 0 || (value === 0 && 1 / value < 0),
      abs = Math.abs(value),
      e = Math.floor(Math.log(abs) / Math.LN2),
      c = Math.pow(2, -e),
      m;

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
    //        `Math.pow(2, 1074)` causes weird and unexpected results
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

OutputBuffer.prototype.writeBuffer = function(source, start, end) {
  var view = new BufferView(start, end),
      views, i, j;

  for (i = 0; i < this.data.length; i++) {
    views = this.data[i];

    if (views[0] !== source) continue;

    for (j = 1; j < views.length; j++) {
      if (start <= views[j].start) {
        views.splice(j, 0, view);
        this.items.push(view);
        return;
      }
    }

    views.push(view);
    this.items.push(view);
    return;
  }

  this.data.push([source, view]);
  this.items.push(view);
};

OutputBuffer.prototype.generateUtf8 = function(value) {
  var buf = this.allocate(value.length * 3),
      start, end, i, char;

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

  return new BufferChunk(buf, start, end);
};

OutputBuffer.prototype.flush = function() {
  var dataOffset = 0,
    buf, o, i, l, j, item, source, prev, current, views, prevSlice;

  if (this.data.length > 0) {
    dataOffset = 0;

    for (i = 0; i < this.data.length; i++) {
      views = this.data[i];
      source = views[0];

      for (j = 1; j < views.length; j++) {
        current = views[j];

        if (j === 1 || current.start > prev.end) {
          current.offset = dataOffset;
          dataOffset += current.length;

          this.size += current.length;
          this.items.push(new BufferChunk(source, current.start, current.end));
        } else {
          current.offset = prev.offset + (current.start - prev.start);
          dataOffset = Math.max(dataOffset, current.offset + current.length);

          prevSlice = this.items[this.items.length - 1];
          if (prevSlice.end < current.end) {
            this.size += current.end - prevSlice.end;
            prevSlice.end = current.end;
          }
        }

        this.size += current.generatePointers();
        prev = current;
      }
    }
  }

  buf = new Buffer(this.size);
  o = 0;

  for (i = 0, l = this.items.length; i < l; i++) {
    item = this.items[i];
    if (typeof item === 'number') {
      buf[o++] = item;
    } else {
      o = item.copy(buf, o);
    }
  }

  // free the buffer pool
  for (i = 0; i < this.pool.length; i++) {
    this.pool[i].used = 0;
  }

  this.items = [];
  this.data = [];
  this.size = 0;

  return buf;
};

module.exports = OutputBuffer;
