var pack = require('./pack'),
    unpack = require('./unpack'),
    WriteHandle = require('./write'),
    ReadHandle = require('./read');

// both these objects are reused for, performance reasons
var output = new WriteHandle(),
    input = new ReadHandle();

exports.pack = function(value, custom) {
  var refs, mediate, proceed;

  if (typeof custom === 'function') {
    refs = [];

    // ...
    mediate = function(next, value, out, refs) {
      if (custom(value, output.write, refs, proceed) === false) {
        return;
      }

      pack(mediate, value, output, refs);
    };

    // ...
    proceed = function(value, useCustom) {
      if (useCustom === false) {
        pack(pack, value, output, refs);
      } else {
        pack(mediate, value, output, refs);
      }

      // this is to let custom packing procedures to use `return proceed(...);`
      // instead of `proceed(...); return false;`
      return false;
    };

    mediate(null, value, output, refs);
  }
  else {
    pack(pack, value, output, []);
  }

  return output.flush();
};

exports.unpack = function(buffer, custom) {
  var refs, mediate, proceed;

  // reset the input handle
  input.source = buffer;
  input.offset = 0;

  if (typeof custom === 'function') {
    refs = [];

    // simply invokes the custom packing function
    mediate = function(next, input, refs) {
      return custom(input.handle, refs, proceed);
    };

    // ...
    proceed = function(useCustom) {
      if (useCustom === false) {
        return unpack(unpack, input, refs);
      } else {
        return unpack(mediate, input, refs);
      }
    };

    return mediate(null, input, refs);
  }
  else {
    return unpack(unpack, input, []);
  }
};
