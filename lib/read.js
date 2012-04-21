function ReadHandle() {
  this.source = null;
  this.offset = 0;
}

ReadHandle.prototype.readByte = function() {
  return this.source[this.offset++];
};

ReadHandle.prototype.readVarint = function() {
  // @todo: inline this
  var byte,
      result = 0,
      shift = 1;

  do {
    byte = this.readByte();
    result += (byte & 0x7f) * shift;
    shift *= 0x80;
  } while (byte & 0x80);

  return result;
};

ReadHandle.prototype.readUtf8 = function(length) {
  var i, offset, string, byte, end;

  if (length > 10) {
    offset = this.source.offset + this.offset;
    string = this.source.parent.utf8Slice(offset, offset + length);
    this.offset += length;
  }
  else {
    string = '';
    end = this.offset + length;

    while (this.offset < end) {
      byte = this.source[this.offset++];

      if (byte < 128) {
        string += String.fromCharCode(byte);
      } else if ((byte > 191) && (byte < 224)) {
        string += String.fromCharCode(((byte & 31) << 6) |
                    (this.source[this.offset++] & 63));
      } else {
        string += String.fromCharCode(((byte & 15) << 12) |
                    ((this.source[this.offset++] & 63) << 6) |
                    (this.source[this.offset++] & 63));
      }
    }
  }

  return string;
};

ReadHandle.prototype.readDouble = function() {
  var e, m, s = this.source[this.offset + 7];

  e = (s & 127) * 256 + this.source[this.offset + 6];
  m = (e & 15) * 281474976710656;
  m += this.source[this.offset + 5] * 1099511627776;
  m += this.source[this.offset + 4] * 4294967296;
  m += this.source[this.offset + 3] * 16777216;
  m += this.source[this.offset + 2] * 65536;
  m += this.source[this.offset + 1] * 256;
  m += this.source[this.offset + 0];

  e >>= 4;
  if (e === 0) {
    e = -1022;
  } else if (e !== 2047) {
    m += Math.pow(2, 52);
    e -= 1023;
  }

  this.offset += 8;

  return (s >> 7 ? -1 : 1) * m * Math.pow(2, e - 52);
};

module.exports = ReadHandle;
