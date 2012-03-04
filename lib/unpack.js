var List = require('./list');

var REGEX_FLAG_IGNORECASE = 1,
    REGEX_FLAG_MULTILINE = 2,
    REGEX_FLAG_GLOBAL = 4;

function InputHandle(buffer) {
  this.buffer = buffer;
  this.offset = 0;
  this.length = buffer.length;
};

InputHandle.prototype.readByte = function() {
  return this.buffer[this.offset++];
};

InputHandle.prototype.readVarint = function() {
  var result = 0,
      shift = 1,
      byte;

  do {
    byte = this.readByte();
    result += (byte & 0x7f) * shift;
    shift *= 0x80;
  } while (byte & 0x80);

  return result;
};

InputHandle.prototype.readUtf8 = function(length) {
  var str = this.buffer.toString('utf8', this.offset, this.offset + length);
  this.offset += length;
  return str;
};

InputHandle.prototype.readDouble = function() {
  var value = this.buffer.readDoubleLE(this.offset);
  this.offset += 8;
  return value;
};

var unpack = function(input, objs, custom) {
  var buf = input.buffer,
      byte = input.readByte();

  if (byte < 0x80) {
    return byte;
  } else if (byte < 0xa0) {
    if (byte === 0x80) {
      return -0;
    } else {
      return 0x80 - byte;
    }
  } else if (byte < 0xb0) {
    switch (byte) {
      case 0xa0: return objs.get(input.readVarint());
      case 0xa1: return; // undefined
      case 0xa2: return null;
      case 0xa3: return true;
      case 0xa4: return false;
      case 0xa5: return NaN;
      case 0xa6: return Infinity;
      case 0xa7: return -Infinity;
      case 0xa8: return 128 + input.readVarint();
      case 0xa9: return -32 - input.readVarint();
      case 0xaa: return input.readDouble();

      case 0xab:
      case 0xac:
      case 0xad:
        return; // reserved

      case 0xae: return new Date(input.readVarint());
      case 0xaf:
        var source = input.readUtf8(input.readVarint()),
            flags = input.readByte(),
            lastIndex = input.readVarint(),
            f = '',
            ret;

        if (flags & REGEX_FLAG_IGNORECASE) f += 'i';
        if (flags & REGEX_FLAG_MULTILINE) f += 'm';
        if (flags & REGEX_FLAG_GLOBAL) f += 'g';

        return new RegExp(source, f);
    }
  } else if (byte < 0xc0) {
    var ret = {},
        len;

    objs.append(ret);

    if (byte === 0xbf) {
      len = input.readVarint();
    } else {
      len = byte - 0xb0;
    }

    for (var i = 0; i < len; i++) {
      ret[unpack(input, objs, custom)] = unpack(input, objs, custom);
    }

    return ret;
  } else if (byte < 0xd0) {
    var ret = [],
        len;

    objs.append(ret);

    if (byte === 0xcf) {
      len = input.readVarint();
    } else {
      len = byte - 0xc0;
    }

    for (var i = 0; i < len; i++) {
      ret.push(unpack(input, objs, custom));
    }

    return ret;
  } else if (byte < 0xf0) {
    var len;

    if (byte === 0xef) {
      len = input.readVarint();
    } else {
      len = byte - 0xd0;
    }

    return input.readUtf8(len);
  } else if (custom !== null) {
    return custom(byte, input, objs);
  } else {
    return;
  }
};

module.exports = function(buf, custom) {
  var input = new InputHandle(buf),
      objs = new List();

  custom = typeof custom === 'function' ? custom : null;

  return unpack(input, objs, custom);
};
