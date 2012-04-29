// @todo: explain why these limits exist
var MAX_VARINT = Math.pow(2, 53),
    MIN_VARINT = -Math.pow(2, 53);

// very basic utf-8 byte length memoization
var lengths = {};

function byteLength(string) {
  if (string in lengths) {
    return lengths[string];
  } else {
    return (lengths[string] = Buffer.byteLength(string, 'utf8'));
  }
}

function pack(next, value, output, refs) {
  var i, count, len, bytes, ref, key, keys, anchor, time, src;

  switch (typeof value) {
    case 'number':

      if (value === Infinity) {
        output.writeByte(0xa6);
        break;
      } else if (value === -Infinity) {
        output.writeByte(0xa7);
        break;
      }

      // is `value` an integer?
      if (value === Math.floor(value)) {

        // remember to check for negative zero
        if (value > 0 || (value === 0 && 1 / value > 0)) {
          if (value < 128) {
            output.writeByte(value);
            break;
          }

          else if (value <= MAX_VARINT) {
            output.writeByte(0xa8);
            output.writeVarint(value - 128);
            break;
          }

          // positive integers above MAX_VARINT will fall through and be encoded
          // the same way as a floating point number
        }

        else if (value > -32) {
          output.writeByte(0x80 - value);
          break;
        }

        else if (value >= MIN_VARINT) {
          output.writeByte(0xa9);
          output.writeVarint(-value - 32);
          break;
        }

        // negative integers below MIN_VARINT will fall through and be encoded
        // the same way as a floating point number
      }

      // a NaN value is not equal to itself
      else if (value !== value) {
        output.writeByte(0xa5);
        break;
      }

      // at this point, just encode `value` as a double
      output.writeByte(0xaa);
      output.writeDouble(value);
      break;

    case 'string':

      len = value.length;

      // skip empty strings
      if (len === 0) {
        output.writeByte(0xe0);
        break;
      }

      // @todo: explain why a length of 10 characters or less is significant
      if (len <= 10) {
        output.allocate(1 + len * 3);

        // reserve a byte for the token
        anchor = output.offset++;

        // write the utf-8 representation to the buffer, and set the anchored
        // byte to a string token with the correct byte length
        output.buffer[anchor] = 0xe0 + output.writeUtf8(value);
        break;
      }

      // get the string's byte length
      bytes = byteLength(value);

      if (bytes < 31) {
        output.writeByte(0xe0 + bytes);
      } else {
        output.writeByte(0xff);
        output.writeVarint(bytes - 31);
      }

      // allocate room for the utf-8 string and write it to the buffer
      output.allocate(bytes);
      output.writeUtf8(value);
      break;

    case 'boolean':

      output.writeByte(value ? 0xa3 : 0xa4);
      break;

    case 'object':

      if (value === null) {
        output.writeByte(0xa2);
        break;
      }

      // if we encounter String or Boolean objects (should be very rare),
      // convert them to their literal values and try again
      if (value instanceof String || value instanceof Boolean) {
        return pack(next, value.valueOf(), output, refs);
      }

      // see if we have encountered this object before
      ref = refs.indexOf(value);

      // ...and if we have, write the reference number
      if (ref !== -1) {
        output.writeByte(0xa0);
        output.writeVarint(ref);
        break;
      }

      // push the object to the list of visited objects
      refs.push(value);

      if (value instanceof Array) {
        count = value.length;

        // don't waste time trying to iterate an empty array
        if (count === 0) {
          output.writeByte(0xc0);
          break;
        }

        if (count < 15) {
          output.writeByte(0xc0 + count);
        } else {
          output.writeByte(0xcf);
          output.writeVarint(count - 15);
        }

        for (i = 0; i < count; i++) {
          next(next, value[i], output, refs);
        }

        break;
      }

      if (value instanceof Date) {
        time = value.getTime();

        if (time >= 0) {
          output.writeByte(0xac);
          output.writeVarint(time);
        } else {
          output.writeByte(0xab);
          output.writeVarint(-time - 1);
        }

        break;
      }

      if (value instanceof RegExp) {
        output.writeByte(0xad);

        output.writeByte((value.ignoreCase ? 1 : 0) |
                     (value.global     ? 2 : 0) |
                     (value.multiline  ? 4 : 0));

        src = value.source;
        len = src.length;

        if (len === 0) {
          output.writeByte(0x00);
        }
        // @todo: explain why 42 is significant
        else if (len <= 42) {
          output.allocate(31);

          // reserve a byte for the token
          anchor = output.offset++;

          // write the string's utf-8 representation, also updating the
          // anchored byte with the string's byte length
          output.buffer[anchor] = output.writeUtf8(src);
        }
        else {
          bytes = byteLength(src);
          output.writeVarint(bytes - 31);
          output.allocate(bytes);
          output.writeUtf8(src);
        }

        break;
      }

      // iterating over the object first, and then over the `keys` array, is not
      // optimal, but it means we'll know how big the object is before actually
      // writing any of its properties
      keys = [];

      for (key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          keys.push(key);
        }
      }

      count = keys.length;

      // save some time if the object is empty
      if (count === 0) {
        output.writeByte(0xd0);
        break;
      }

      if (count < 15) {
        output.writeByte(0xd0 + count);
      } else {
        output.writeByte(0xdf);
        output.writeVarint(count - 15);
      }

      // iterate over the object through the array of its keys
      for (i = 0; i < count; i++) {
        key = keys[i];
        len = key.length;

        if (len === 0) {
          output.writeByte(0x00);
        }
        else {
          // @todo: explain why 42 is significant
          if (len <= 42) {
            output.allocate(1 + len * 3);

            // reserve a byte for the token
            anchor = output.offset++;

            // write the string's utf-8 representation, also updating the
            // anchored byte with the string's byte length
            output.buffer[anchor] = output.writeUtf8(key);
          }
          else {
            bytes = byteLength(key);
            output.writeVarint(bytes);
            output.allocate(bytes);
            output.writeUtf8(key);
          }
        }

        // write the property itself
        next(next, value[key], output, refs);
      }

      break;

    default:

      output.writeByte(0xa1);

  }
}

module.exports = pack;
