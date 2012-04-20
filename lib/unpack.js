function unpack(next, input, refs) {
  var i, key, len, count, obj, arr, src, f, flags,
      token = input.readByte();

  // string unserialization
  if (token >= 0xe0) {
    if (token === 0xd0) {
      return '';
    }

    if (token === 0xff) {
      len = input.readVarint() + 31;
    } else {
      len = token - 0xe0;
    }

    return input.readUtf8(len);
  }
  // object unserialization
  else if (token >= 0xd0) {
    obj = {};
    refs.push(obj);

    if (token === 0xd0) {
      return obj;
    }

    if (token === 0xdf) {
      count = input.readVarint() + 15;
    } else {
      count = token - 0xd0;
    }

    for (i = 0; i < count; i++) {
      len = input.readVarint();
      key = input.readUtf8(len);
      obj[key] = next(next, input, refs);
    }

    return obj;
  }
  // array unserialization
  else if (token >= 0xc0) {
    arr = [];
    refs.push(arr);

    if (token === 0xc0) {
      return arr;
    }

    if (token === 0xcf) {
      count = input.readVarint() + 15;
    } else {
      count = token - 0xc0;
    }

    for (i = 0; i < count; i++) {
      arr.push(next(next, input, refs));
    }

    return arr;
  }
  // various
  else if (token >= 0xa0) {
    switch (token) {
      case 0xa0: return refs[input.readVarint()];

      case 0xa1: return undefined;
      case 0xa2: return null;
      case 0xa3: return true;
      case 0xa4: return false;
      case 0xa5: return NaN;
      case 0xa6: return Infinity;
      case 0xa7: return -Infinity;

      case 0xa8: return input.readVarint() + 128;
      case 0xa9: return -(input.readVarint() + 32);
      case 0xaa: return input.readDouble();

      case 0xab: return new Date(-(input.readVarint() + 1));
      case 0xac: return new Date(input.readVarint());
      case 0xad:
        flags = '';
        f = input.readByte();

        if (f & 1) flags += 'i';
        if (f & 2) flags += 'g';
        if (f & 4) flags += 'm';

        len = input.readVarint();
        src = input.readUtf8(len);

        return new RegExp(src, flags);

      default:
        return undefined;
    }
  }
  // negative fixnum unserialization
  else if (token >= 0x80) {
    return token === 0x80 ? -0 : 0x80 - token;
  }
  // positive fixnum unserialization
  else {
    return token;
  }
}

module.exports = unpack;
