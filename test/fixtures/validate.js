var assert = require('assert'),
    square = require('../../');

function inspect(buffer) {
  return Array.prototype.map.call(buffer, function(byte) {
    return (byte < 16 ? '0' + byte.toString(16) : byte.toString(16));
  }).join(' ');
};

function pack(input, expected) {
  return function() {
    var result = square.pack(input);
    assert.deepEqual(inspect(result), expected);
  };
};

pack.batch = function(arr) {
  return function() {
    for (var i = 0, l = arr.length; i < l; i += 2) {
      pack(arr[i], arr[i + 1])();
    }
  };
};

module.exports = {
  'pack': pack
};
