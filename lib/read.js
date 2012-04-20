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
  // @todo: inline this
  var str = this.source.toString('utf8', this.offset, this.offset + length);
  this.offset += length;
  return str;
};

ReadHandle.prototype.readDouble = function() {
  // @todo: inline this
  var value = this.source.readDoubleLE(this.offset);
  this.offset += 8;
  return value;
};

module.exports = ReadHandle;
