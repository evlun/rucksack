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
      assert.deepEqual(actual, expected);
    };
  })(label);
}

// add test to make sure inherited properties
exports['ignore inherited properties when packing objects'] = function() {
  var actual = rucksack.pack((function() {
    function X() { this.y = 1; }
    X.prototype.z = 2;
    return new X();
  })());

  assert.deepEqual(inspect(actual), 'd1 01 79 01');
};
