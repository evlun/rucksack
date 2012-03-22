var fs = require('fs'),
    assert = require('assert'),
    pack = require('../').pack;

function inspect(buffer) {
  if (!(buffer instanceof Buffer)) return buffer;

  return Array.prototype.map.call(buffer, function(byte) {
    var hex = byte.toString(16);
    return (byte < 16 ? '0' + hex : hex);
  }).join(' ');
}

function prepare(raw) {
  var tests = {},
      label, test, input, expected;

  for (label in raw) {
    if (Object.prototype.hasOwnProperty.call(raw, label)) {
      test = raw[label];
      tests[label] = (function(input, expected) {
        return function() {
          assert.deepEqual(inspect(pack(input)), expected);
        };
      }(test[0], test[1]));
    }
  }

  return tests;
}

var files = fs.readdirSync('./test/fixtures');

files = files.filter(function(path) {
  return (path.substr(0, 18) === 'serialization-key-');
});

files.forEach(function(path) {
  var label = path.substr(18, path.length - 21);
  exports[label] = prepare(require('./fixtures/' + path));
});
