var assert = require('assert'),
    definitions = require('./definitions'),
    rucksack = require('../');

// this is more or less a port of assert.strictDeepEqual, but with added support
// for circular objects and arrays
function isEqual(actual, expected, actualStack, expectedStack) {
  var i, index, key, actualValue, expectedValue, actualKeys, expectedKeys;

  if (actual === expected) {
    return true;
  }

  // handle NaN
  if (expected !== expected) {
    return actual !== actual;
  }

  if (typeof actual !== typeof expected) {
    return false;
  }

  // non-object values can be evaluated with the `===` operator
  if (typeof expected !== 'object' || expected === null) {
    return actual === expected;
  }

  if (expected instanceof Buffer) {
    if (actual.length !== expected.length) {
      return false;
    }

    for (i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        return false;
      }
    }

    return true;
  }

  if (expected instanceof Array) {
    if (actual.length !== expected.length) {
      return false;
    }

    for (i = 0; i < expected.length; i++) {
      actualValue = actual[i];
      expectedValue = expected[i];

      // see if we have visited this value before
      index = expectedStack.indexOf(expectedValue);
      if (index !== -1) {
        return actualStack.indexOf(actualValue) === index;
      }

      actualStack.push(actualValue);
      expectedStack.push(expectedValue);

      if (!isEqual(actualValue, expectedValue, actualStack, expectedStack)) {
        return false;
      }

      actualStack.pop();
      expectedStack.pop();
    }

    return true;
  }

  // we don't care about `x.lastIndex`
  if (expected instanceof RegExp) {
    return actual instanceof RegExp &&
           actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.ignoreCase === expected.ignoreCase;
  }

  if (expected instanceof Date) {
    return actual instanceof Date &&
           actual.getTime() === expected.getTime();
  }

  // from this point forward we'll treat the value like an object literal
  (expectedKeys = Object.keys(expected)).sort();
  (actualKeys = Object.keys(actual)).sort();

  if (expectedKeys.length !== actualKeys.length) {
    return false;
  }

  for (i = 0; i < expectedKeys.length; i++) {
    key = expectedKeys[i];

    if (actualKeys[i] !== key) {
      return false;
    }

    actualValue = actual[key];
    expectedValue = expected[key];

    // is the value an object lower down in the stack?
    index = expectedStack.indexOf(expectedValue);
    if (index !== -1) {
      return actualStack.indexOf(actualValue) === index;
    }

    actualStack.push(actualValue);
    expectedStack.push(expectedValue);

    if (!isEqual(actualValue, expectedValue, actualStack, expectedStack)) {
      return false;
    }

    actualStack.pop();
    expectedStack.pop();
  }

  return true;
}

// creates a buffer out of a space-delimited byte sequence string (for example:
// '01 02 03' to `new Buffer([0x01, 0x02, 0x03])`)
function createBuffer(str) {
  var i, bytes = str.split(' ');

  for (i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bytes[i], 16);
  }

  return new Buffer(bytes);
}

for (var label in definitions) {
  (function(label) {
    var def = definitions[label],
        input = createBuffer(def.serialized),
        expected = def.value;

    exports['unpack ' + label + ' according to the spec'] = function() {
      var actual = rucksack.unpack(input);

      if (!isEqual(actual, expected, [actual], [expected])) {
        throw new assert.AssertionError({
          'actual': actual,
          'expected': expected,
          'operator': '!==',
          'message': '',
          'stackStactualStacktFunction': this
        });
      }
    };
  })(label);
}
