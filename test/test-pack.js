var label,
    assert = require('assert'),
    definitions = require('./definitions'),
    rucksack = require('../');

// converts `new Buffer([0x01, 0x02, 0x03, 0x04])` to '01 02 03 04'
function inspect(buffer) {
  var i, hex, byte, bytes = [];

  for (i = 0; i < buffer.length; i++) {
    byte = buffer[i];
    hex = byte.toString(16);
    bytes.push(byte < 16 ? '0' + hex : hex);
  }

  return bytes.join(' ');
}

for (label in definitions) {
  (function(label) {
    var def = definitions[label],
        input = def.value,
        expected = def.serialized;

    exports['pack ' + label + ' according to the spec'] = function() {
      var actual = inspect(rucksack.pack(input));
      assert.equal(actual, expected);
    };
  })(label);
}

exports['ignore objects\' inherited properties'] = function() {
  function X() {}
  X.prototype.y = 2;
  X.prototype.z = function() {};

  var actual = rucksack.pack(new X());
  assert.equal(inspect(actual), 'd0');
};

exports['treat String objects like strings'] = function() {
  var actual = inspect(rucksack.pack(new String('abcdef'))),
      expected = inspect(rucksack.pack('abcdef'));

  assert.equal(actual, expected);
};

exports['treat Boolean objects like booleans'] = function() {
  var actual = inspect(rucksack.pack(new Boolean(false))),
      expected = inspect(rucksack.pack(false));

  assert.equal(actual, expected);
};

exports['treat Number objects like numbers'] = function() {
  var actual = inspect(rucksack.pack(new Number(10))),
      expected = inspect(rucksack.pack(10));

  assert.equal(actual, expected);
};

exports['don\'t reuse chunks of memory when packing'] = function() {
  var buf = rucksack.pack(0);
  rucksack.pack(1);
  assert.equal(buf[0], 0);
};

