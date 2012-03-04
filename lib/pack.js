var List = require('./list');

var REGEX_FLAG_IGNORECASE = 1,
    REGEX_FLAG_MULTILINE = 2,
    REGEX_FLAG_GLOBAL = 4;

function OutputBuffer() {
  this.stump = this.tail = new Byte(null);
  this.length = 0;
};

function Byte(value) {
  this.value = value;
  this.next = null;
};

OutputBuffer.prototype.writeByte = function(value) {
  this.tail.next = this.tail = new Byte(value);
  this.length += 1;
};

OutputBuffer.prototype.writeVarint = function(value) {
  while (value > 0x7f) {
    this.writeByte((value & 0x7f) | 0x80);
    value /= 0x80;
  }

  this.writeByte(value & 0x7f);
};

OutputBuffer.prototype.writeUtf8 = function(string) {
  var code;

  for (var i = 0; i < string.length; i++) {
    code = string.charCodeAt(i);

    if (code < 128) {
      this.writeByte(code);
    } else if (code < 2048) {
      this.writeByte((code >> 6) | 192);
      this.writeByte((code & 63) | 128);
    } else {
      this.writeByte((code >> 12) | 224);
      this.writeByte(((code >> 6) & 63) | 128);
      this.writeByte((code & 63) | 128);
    }
  }
};

OutputBuffer.prototype.writeDouble = function(value) {
  var v = Math.abs(value),
      ml = 52,
      n = 8,
      el = 8 * n - ml - 1,
      em = (1 << el) - 1,
      eb = em >> 1,
      e = Math.floor(Math.log(value) / Math.LN2),
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0,
      c = Math.pow(2, -e),
      m;

  if (v * c < 1) {
    e -= 1;
    c *= 2;
  }

  if (v * c >= 2) {
    e += 1;
    c /= 2;
  }

  if (e + eb >= em) {
    m = 0;
    e = em;
  } else if (e + eb >= 1) {
    m = (v * c - 1) * Math.pow(2, ml);
    e = e + eb;
  } else {
    m = v * Math.pow(2, eb - 1) * Math.pow(2, ml);
    e = 0;
  }

  while (ml >= 8) {
    this.writeByte(m & 0xff);
    m /= 256;
    ml -= 8;
  }

  e = (e << ml) | m;
  el += ml;

  while (el > 8) {
    this.writeByte(e & 0xff);
    e /= 256;
    el -= 8;
  }

  this.writeByte((e & 0xff) | (s * 128));
};

OutputBuffer.prototype.toBuffer = function() {
  var buffer = new Buffer(this.length),
      item = this.stump.next,
      i = 0;

  while (item !== null) {
    buffer[i++] = item.value;
    item = item.next;
  }

  return buffer;
};

var pack = function(value, out, objs, custom) {
  if (custom !== null && custom(value, out, objs) === false) {
    return;
  }

  var type = typeof value;

  switch (type) {
    case 'string':
      var tmp = new OutputBuffer(),
          len;

      tmp.writeUtf8(value);
      len = tmp.length;

      if (len === 0) {
        out.writeByte(0xd0);
      } else {
        if (len < 31) {
          out.writeByte(0xd0 + len);
        } else {
          out.writeByte(0xef);
          out.writeVarint(len);
        }

        out.tail.next = tmp.stump.next;
        out.tail = tmp.tail;
        out.length += len;
      }

      break;

    case 'number':
      if ((value % 1) === 0) {
        if (value >= 0 && !(value === 0 && 1 / value < 0)) {
          if (value < 128) {
            out.writeByte(value);
          } else {
            out.writeByte(0xa8);
            out.writeVarint(value - 128);
          }
        } else {
          if (value > -32) {
            out.writeByte(0x80 - value);
          } else {
            out.writeByte(0xa9);
            out.writeVarint(-value - 32);
          }
        }
      } else if (value === NaN) {
        out.writeByte(0xa5);
      } else if (value === Infinity) {
        out.writeByte(0xa6);
      } else if (value === -Infinity) {
        out.writeByte(0xa7);
      } else {
        out.writeByte(0xaa);
        out.writeDouble(value);
      }

      break;

    case 'object':
      if (value === null) {
        out.writeByte(0xa2);
      } else if (value instanceof Date) {
        out.writeByte(0xae);
        out.writeVarint(value.getTime());
      } else if (value instanceof RegExp) {
        var tmp = new OutputBuffer(),
            flags = 0,
            len;

        out.writeByte(0xaf);

        tmp.writeUtf8(value.source);
        len = tmp.length;

        out.writeVarint(len);

        if (len !== 0) {
          out.tail.next = tmp.stump.next;
          out.tail = tmp.tail;
          out.length += len;
        }

        if (value.ignoreCase) flags |= REGEX_FLAG_IGNORECASE;
        if (value.multiline) flags |= REGEX_FLAG_MULTILINE;
        if (value.global) flags |= REGEX_FLAG_GLOBAL;

        out.writeByte(flags);
      } else {
        var dup = objs.indexOf(value);

        if (dup !== -1) {
          out.writeByte(0xa0);
          out.writeVarint(dup);
          break;
        } else {
          objs.append(value);
        }

        if (value instanceof Array) {
          var length = value.length;

          if (length < 15) {
            out.writeByte(0xc0 + length);
          } else {
            out.writeByte(0xcf);
            out.writeVarint(length);
          }

          for (var i = 0; i < length; i++) {
            pack(value[i], out, objs, custom);
          }
        }
        else {
          var size = 0,
              tmp = new OutputBuffer();

          for (var key in value) {
            if (Object.hasOwnProperty.call(value, key)) {
              pack(key, tmp, objs, custom);
              pack(value[key], tmp, objs, custom);

              size += 1;
            }
          }

          if (size === 0) {
            out.writeByte(0xb0);
          } else {
            if (size < 15) {
              out.writeByte(0xb0 + size);
            } else {
              out.writeByte(0xbf);
              out.writeVarint(size);
            }

            out.tail.next = tmp.stump.next;
            out.tail = tmp.tail;
            out.length += tmp.length;
          }
        }
      }

      break;

    case 'boolean':
      out.writeByte(value ? 0xa3 : 0xa4);
      break;

    default:
      out.writeByte(0xa1);
      break;
  }
};

module.exports = function(value, custom) {
  var out = new OutputBuffer(),
      objs = new List();

  pack(value, out, objs, typeof custom === 'function' ? custom : null);

  return out.toBuffer();
};
