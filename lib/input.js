function InputHandle(data) {
  this.data = data;
  this.offset = 0;
}

InputHandle.prototype.readByte = function() {
  return this.data[this.offset++];
};

InputHandle.prototype.readVarint = function() {
  var byte,
      result = 0,
      shift = 1;

  // @todo: inline this
  do {
    byte = this.readByte();
    result += (byte & 0x7f) * shift;
    shift *= 0x80;
  } while (byte & 0x80);

  return result;
};

InputHandle.prototype.readUtf8 = function(length) {
  // @todo: inline this
  var str = this.data.toString('utf8', this.offset, this.offset + length);
  this.offset += length;
  return str;
};

InputHandle.prototype.readDouble = function() {
  // @todo: inline this
  var value = this.data.readDoubleLE(this.offset);
  this.offset += 8;
  return value;
};

module.exports = InputHandle;
