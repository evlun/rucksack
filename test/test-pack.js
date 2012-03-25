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

function build(input, expected, custom) {
  return function() {
    assert.deepEqual(inspect(pack(input, custom)), expected);
  };
}

function stage(path) {
  var suite = require(path),
      tests = {},
      label, test;

  for (label in suite) {
    test = suite[label];
    tests[label] = build(test[0], test[1], test[2]);
  }

  return tests;
}

fs.readdirSync('./test/fixtures').forEach(function(path) {
  if (path.substr(0, 18) === 'serialization-key-') {
    exports[path.substr(18, path.length - 21)] = stage('./fixtures/' + path);
  }
});

exports['object prototypes should be ignored'] =
  require('./test-pack-ignore-prototype.js');

exports.custom = stage('./test-custom-pack');
