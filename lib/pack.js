var OutputBuffer = require('./output');

var MAXIMUM_VARINT_VALUE = Math.pow(2, 53),
    MINIMUM_VARINT_VALUE = -Math.pow(2, 53);

function pack(value, out, refs, custom) {
  var i, length, str, size, ref, key, keys;

  // @todo: actually use `custom`

  switch (typeof value) {
    case 'string':
      str = out.prepareUtf8(value);
      size = str.length;

      if (size === 0) {
        out.write(0xe0);
        break;
      }

      if (size < 31) {
        out.write(0xe0 + size);
      } else {
        out.write(0xff);
        out.writeVarint(size - 31);
      }

      out.insertUtf8(str);
      break;

    case 'number':
      if (value % 1 === 0) {
        if (value > 0 || (value === 0 && 1 / value > 0)) {
          if (value < 128) {
            out.write(value);
            break;
          } else if (value <= MAXIMUM_VARINT_VALUE) {
            out.write(0xa8);
            out.writeVarint(value - 128);
            break;
          }
        } else if (value > -32) {
          out.write(0x80 - value);
          break;
        } else if (value >= MINIMUM_VARINT_VALUE) {
          out.write(0xa9);
          out.writeVarint(-value - 32);
          break;
        }
      } else if (value !== value) {
        out.write(0xa5);
        break;
      } else if (value === Infinity) {
        out.write(0xa6);
        break;
      } else if (value === -Infinity) {
        out.write(0xa7);
        break;
      }

      // we'll only ever find ourselves here if `value` is
      //   a) an integer greater than MAXIMUM_VARINT_VALUE,
      //   b) an integer less than MINIMUM_VARINT_VALUE, or
      //   c) a decimal number,
      // but in any case it should be encoded as a double

      out.write(0xaa);
      out.writeDouble(value);
      break;

    case 'boolean':
      out.write(value ? 0xa3 : 0xa4);
      break;

    case 'object':
      if (value === null) {
        out.write(0xa2);
        break;
      }

      if ((ref = refs.indexOf(value)) !== -1) {
        out.write(0xa0);
        out.writeVarint(ref);
        break;
      }

      refs.push(value);

      if (value instanceof Array) {
        length = value.length;

        if (length === 0) {
          out.write(0xd0);
          break;
        } else if (length < 15) {
          out.write(0xd0 + length);
        } else {
          out.write(0xd0);
          out.writeVarint(length - 15);
        }

        for (i = 0; i < length; i++) {
          pack(value[i], out, refs, custom);
        }
        break;
      }

      if (value instanceof RegExp) {
        out.write(0xac);
        out.write(0 | (value.ignoreCase ? 1 : 0)
                    | (value.global     ? 2 : 0)
                    | (value.multiline  ? 4 : 0));

        str = out.prepareUtf8(value.source);
        out.writeVarint(str.length);
        out.insertUtf8(str);
        break;
      }

      if (value instanceof Date) {
        out.write(0xad);
        out.writeVarint(value.getTime());
        break;
      }

      if (value instanceof Buffer) {
        // @todo: buffer support
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
        out.write(0xc0);
        break;
      }

      if (length < 15) {
        out.write(0xc0 + length);
      } else {
        out.write(0xcf);
        out.writeVarint(length - 15);
      }

      for (i = 0; i < length; i++) {
        key = keys[i];

        str = out.prepareUtf8(key);
        out.writeVarint(str.length);
        out.insertUtf8(str);

        pack(value[key], out, refs, custom);
      }
      break;

    default:
      out.write(0xa1);
      break;
  }
}

var out = new OutputBuffer();

module.exports = function(value, custom) {
  pack(value, out, [], typeof custom !== 'function' ? null : custom);
  return out.flush();
};
