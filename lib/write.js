var MIN_SIZE = Buffer.poolSize;

function WriteHandle() {
  this.buffer = new Buffer(MIN_SIZE);
  this.size = MIN_SIZE;
  this.start = 0;
  this.offset = 0;
  this.preceding = [];
  this.precedingBytes = 0;
}

WriteHandle.prototype.flush = function() {
  var i, buffer, offset;

  // without any preceding chunks, simply return a slice of the current buffer
  if (this.precedingBytes === 0) {
    buffer = this.buffer.slice(this.start, this.offset);
  }
  else {
    // create a buffer large enough to fit the whole output chunk
    buffer = new Buffer(this.offset - this.start + this.precedingBytes);
    offset = 0;

    // copy all preceding slices to the buffer
    for (i = 0; i < this.preceding.length; i++) {
      offset += this.preceding[i].copy(buffer, offset, 0);
    }

    // copy the current buffer
    this.buffer.copy(buffer, offset, this.start, this.offset);

    this.preceding = [];
    this.precedingBytes = 0;
  }

  // make sure not to re-use bytes
  this.start = this.offset;

  return buffer;
};

// makes sure that `WriteHandle.buffer` has room for `required` more bytes
WriteHandle.prototype.allocate = function(required) {
  var slice;

  if (this.offset > this.size - required) {
    slice = this.buffer.slice(this.start, this.offset);
    this.preceding.push(slice);
    this.precedingBytesSize += slice.length;

    this.size = Math.max(required, MIN_SIZE);
    this.buffer = new Buffer(this.size);
    this.start = this.offset = 0;
  }
};

WriteHandle.prototype.writeByte = function(byte) {
  this.allocate(1);
  this.buffer[this.offset++] = byte;
};

WriteHandle.prototype.writeVarint = function(num) {
  if (num < 128) {
    this.allocate(1);
    this.buffer[this.offset++] = num;
  }
  else if (num < 16384) {
    this.allocate(2);
    this.buffer[this.offset++] = num & 0xff | 0x80;
    this.buffer[this.offset++] = num / 128 & 0x7f;
  }
  else if (num < 2097152) {
    this.allocate(3);
    this.buffer[this.offset++] = num & 0xff | 0x80;
    this.buffer[this.offset++] = num / 128 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 16384 & 0x7f;
  }
  else if (num < 268435456) {
    this.allocate(4);
    this.buffer[this.offset++] = num & 0xff | 0x80;
    this.buffer[this.offset++] = num / 128 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 16384 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 2097152 & 0x7f;
  }
  else if (num < 34359738368) {
    this.allocate(5);
    this.buffer[this.offset++] = num & 0xff | 0x80;
    this.buffer[this.offset++] = num / 128 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 16384 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 2097152 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 268435456 & 0x7f;
  }
  else if (num < 4398046511104) {
    this.allocate(6);
    this.buffer[this.offset++] = num & 0xff | 0x80;
    this.buffer[this.offset++] = num / 128 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 16384 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 2097152 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 268435456 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 34359738368 & 0x7f;
  }
  else if (num < 562949953421312) {
    this.allocate(7);
    this.buffer[this.offset++] = num & 0xff | 0x80;
    this.buffer[this.offset++] = num / 128 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 16384 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 2097152 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 268435456 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 34359738368 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 4398046511104 & 0x7f;
  }
  else {
    this.allocate(8);
    this.buffer[this.offset++] = num & 0xff | 0x80;
    this.buffer[this.offset++] = num / 128 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 16384 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 2097152 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 268435456 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 34359738368 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 4398046511104 & 0xff | 0x80;
    this.buffer[this.offset++] = num / 562949953421312 & 0x7f;
  }
};

WriteHandle.prototype.writeDouble = function(num) {
  var m, abs = Math.abs(num),
      e = Math.floor(Math.log(abs) / Math.LN2),
      c = Math.pow(2, -e);

  this.allocate(8);

  if (abs * c < 1) { e -= 1; c *= 2; }
  if (abs * c >= 2) { e += 1; c /= 2; }

  if (e >= 1024) {
    m = 0;
    e = 2047;
  } else if (e >= -1022) {
    m = (abs * c - 1) * Math.pow(2, 52);
    e += 1023;
  } else {
    // @todo: can this be removed?
    m = abs * Math.pow(2, 1022) * Math.pow(2, 52);
    e = 0;
  }

  e = (e << 4) | (m / 0x1000000000000);

  this.buffer[this.offset++] = m & 0xff;
  this.buffer[this.offset++] = m / 0x100 & 0xff;
  this.buffer[this.offset++] = m / 0x10000 & 0xff;
  this.buffer[this.offset++] = m / 0x1000000 & 0xff;
  this.buffer[this.offset++] = m / 0x100000000 & 0xff;
  this.buffer[this.offset++] = m / 0x10000000000 & 0xff;
  this.buffer[this.offset++] = e & 0xff;

  if (num < 0 || (num === 0 && 1 / num < 0)) {
    this.buffer[this.offset++] = (e / 0x100 & 0xff) | 0x80;
  } else {
    this.buffer[this.offset++] = e / 0x100 & 0x7f;
  }
};

WriteHandle.prototype.writeUtf8 = function(value) {
  var i, char, start, buffer, bytes,
      len = value.length;

  // `SlowBuffer.utf8Write()` is fast, but calling it involved quite a bit of
  // overhead, so we'll only use it for longer strings
  if (len >= 100) {
    buffer = this.buffer;
    bytes = buffer.parent.utf8Write(value, buffer.offset + this.offset);
    this.offset += bytes;

    return bytes;
  }
  else {
    start = this.offset;

    for (i = 0; i < len; i++) {
      char = value.charCodeAt(i);

      if (char < 128) {
        this.buffer[this.offset++] = char;
      } else if (char < 2048) {
        this.buffer[this.offset++] = (char >> 6) | 192;
        this.buffer[this.offset++] = (char & 63) | 128;
      } else {
        this.buffer[this.offset++] = (char >> 12) | 224;
        this.buffer[this.offset++] = (char >> 6 & 63) | 128;
        this.buffer[this.offset++] = (char & 63) | 128;
      }
    }

    return this.offset - start;
  }
};

module.exports = WriteHandle;
