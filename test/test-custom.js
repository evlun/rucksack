var assert = require('assert'),
    rucksack = require('../');

exports['square all numbers'] = function() {
  var packed, standard, restored, expected, unpacked,
      input = [0, 1, 2, 3, 4, 5, 6];

  packed = rucksack.pack(input, function(value, output, refs, pack) {
    if (typeof value === 'number') {
      return pack(value * value);
    }
  });

  // without the custom packing function, this is what we expect to get back
  expected = [0, 1, 4, 9, 16, 25, 36];

  unpacked = rucksack.unpack(packed);
  assert.deepEqual(unpacked, expected);

  // this custom unpacking function should restore
  restored = rucksack.unpack(packed, function(input, refs, unpack) {
    var value = unpack();
    return typeof value === 'number' ? Math.sqrt(value) : value;
  });

  assert.deepEqual(restored, input);
};

exports['increase numbers by array depth'] = function() {
  var depth, packed,
      input = [0, 0, [0, [0, 0, 0], 0, 0], 0],
      expected = [1, 1, [2, [3, 3, 3], 2, 2], 1];

  depth = 0;
  packed = rucksack.pack(input, function(value, output, refs, pack) {
    if (typeof value === 'number') {
      pack(value + depth);
    } else {
      depth += 1;
      pack(value);
      depth -= 1;
    }

    return false;
  });

  assert.deepEqual(rucksack.unpack(packed), expected);
};
