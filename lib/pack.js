var OutputBuffer = require('./output');

var MAXIMUM_VARINT_VALUE = Math.pow(2, 53),
    MINIMUM_VARINT_VALUE = -Math.pow(2, 53);

function pack(value, out, refs, custom) {
  var i, length, str, size, ref, key, keys;

  if (custom !== null && custom(value) === false) {
    return;
  }

  switch (typeof value) {
    case 'string':
      str = out.generateUtf8(value);
      size = str.length;

      if (size === 0) {
        out.writeByte(0xe0);
        break;
      }

      if (size < 31) {
        out.writeByte(0xe0 + size);
      } else {
        out.writeByte(0xff);
        out.writeVarint(size - 31);
      }

      out.items.push(str);
      out.size += str.length;
      break;

    case 'number':
      if (value % 1 === 0) {
        if (value > 0 || (value === 0 && 1 / value > 0)) {
          if (value < 128) {
            out.writeByte(value);
            break;
          } else if (value <= MAXIMUM_VARINT_VALUE) {
            out.writeByte(0xa8);
            out.writeVarint(value - 128);
            break;
          }
        } else if (value > -32) {
          out.writeByte(0x80 - value);
          break;
        } else if (value >= MINIMUM_VARINT_VALUE) {
          out.writeByte(0xa9);
          out.writeVarint(-value - 32);
          break;
        }
      } else if (value !== value) {
        out.writeByte(0xa5);
        break;
      } else if (value === Infinity) {
        out.writeByte(0xa6);
        break;
      } else if (value === -Infinity) {
        out.writeByte(0xa7);
        break;
      }

      // we'll only ever find ourselves here if `value` is
      //   a) an integer greater than MAXIMUM_VARINT_VALUE,
      //   b) an integer less than MINIMUM_VARINT_VALUE, or
      //   c) a decimal number,
      // but in any case it should be encoded as a double

      out.writeByte(0xaa);
      out.writeDouble(value);
      break;

    case 'boolean':
      out.writeByte(value ? 0xa3 : 0xa4);
      break;

    case 'object':
      if (value === null) {
        out.writeByte(0xa2);
        break;
      }

      if ((ref = refs.indexOf(value)) !== -1) {
        out.writeByte(0xa0);
        out.writeVarint(ref);
        break;
      }

      refs.push(value);

      if (value instanceof Array) {
        length = value.length;

        if (length === 0) {
          out.writeByte(0xd0);
          break;
        } else if (length < 15) {
          out.writeByte(0xd0 + length);
        } else {
          out.writeByte(0xd0);
          out.writeVarint(length - 15);
        }

        for (i = 0; i < length; i++) {
          pack(value[i], out, refs, custom);
        }
        break;
      }

      if (value instanceof RegExp) {
        out.writeByte(0xac);
        out.writeByte(0 | (value.ignoreCase ? 1 : 0)
                        | (value.global     ? 2 : 0)
                        | (value.multiline  ? 4 : 0));

        str = out.generateUtf8(value.source);
        out.writeVarint(str.length);
        out.items.push(str);
        out.size += str.length;
        break;
      }

      if (value instanceof Date) {
        out.writeByte(0xad);
        out.writeVarint(value.getTime());
        break;
      }

      if (value instanceof Buffer) {
        out.writeByte(0xab);
        out.writeBuffer(value.parent, value.offset,
          value.offset + value.length);
        break;
      }

      // from this point forward we'll treat `value` like an object literal

      keys = [];

      for (key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          keys.push(key);
        }
      }

      if ((length = keys.length) === 0) {
        out.writeByte(0xc0);
        break;
      }

      if (length < 15) {
        out.writeByte(0xc0 + length);
      } else {
        out.writeByte(0xcf);
        out.writeVarint(length - 15);
      }

      for (i = 0; i < length; i++) {
        key = keys[i];

        str = out.generateUtf8(key);
        out.writeVarint(str.length);
        out.items.push(str);
        out.size += str.length;

        pack(value[key], out, refs, custom);
      }
      break;

    default:
      out.writeByte(0xa1);
      break;
  }
}

var out = new OutputBuffer();

module.exports = function(value, custom) {
  var refs = [],
      skip, cust, pck;

  if (typeof custom === 'function') {
    skip = false;

    cust = function(value) {
      if (skip) return !(skip = false);
      return custom(value, out, refs, pck);
    };

    pck = function(value) {
      skip = true;
      pack(value, out, refs, cust);
    };

    pack(value, out, refs, cust);
  } else {
    pack(value, out, refs, null);
  }
  return out.flush();
};
