var InputHandle = require('./input');

function unpack(input, refs, custom) {
  var i, len, f, src, key, obj, arr,
      byte = input.data[input.offset++];

  if (byte < 0x80) {
    return byte;
  } else if (byte < 0xa0) {
    return byte === 0x80 ? -0 : 0x80 - byte;
  } else if (byte < 0xc0) {
    switch (byte) {
      case 0xa0: return refs[input.readVarint()];
      case 0xa1: return undefined;
      case 0xa2: return null;
      case 0xa3: return true;
      case 0xa4: return false;
      case 0xa5: return NaN;
      case 0xa6: return Infinity;
      case 0xa7: return -Infinity;
      case 0xa8: return 128 + input.readVarint();
      case 0xa9: return -32 - input.readVarint();
      case 0xaa: return input.readDouble();
      case 0xab: return new Date(input.readVarint());

      case 0xac:
        f = input.data[input.offset++];
        return new RegExp(input.readUtf8(input.readVarint()),
                          (f&1?'i':'')+(f&2?'g':'')+(f&4?'m':''));

      case 0xad:
      case 0xae:
      case 0xaf:
      case 0xb0:
      case 0xb1:
      case 0xb2:
      case 0xb3:
      case 0xb4:
      case 0xb5:
      case 0xb6:
      case 0xb7:
      case 0xb8:
      case 0xb9:
        // these tokens are reserved for future use, return undefined for now
        return undefined;

      case 0xba:
      case 0xbb:
      case 0xbc:
      case 0xbd:
      case 0xbe:
      case 0xbf:
        // reserved for custom unpacking, default to undefined
        return custom == null ? undefined : custom();
    }
  } else if (byte < 0xd0) {
    if (byte === 0xc0)
      return {};

    refs.push(obj = {});
    len = byte === 0xcf ? input.readVarint() : byte - 0xc0;

    for (i = 0; i < len; i++) {
      key = input.readUtf8(input.readVarint());
      obj[key] = unpack(input, refs, custom);
    }

    return obj;
  } else if (byte < 0xe0) {
    if (byte === 0xd0)
      return [];

    refs.push(arr = []);
    len = byte === 0xdf ? input.readVarint() : byte - 0xd0;

    for (i = 0; i < len; i++) {
      arr.push(unpack(input, refs, custom));
    }

    return arr;
  } else {
    if (byte === 0xe0)
      return '';

    return input.readUtf8(byte === 0xff ? input.readVarint() + 31 : byte - 0xe0);
  }
}

var input = new InputHandle(null);

module.exports = function(buffer, custom) {
  var _custom, _unpack,
      refs = [];

  input.data = buffer;
  input.offset = 0;

  if (typeof custom === 'function') {
    _custom = function() {
      return custom(input, refs, _unpack);
    };

    _unpack = function() {
      unpack(input, refs, _custom);
    };

    return unpack(input, refs, _custom);
  } else {
    return unpack(input, refs, null);
  }
};
