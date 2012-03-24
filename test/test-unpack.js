var fs = require('fs'),
    assert = require('assert'),
    unpack = require('../').unpack;

function isStrictDeepEqual(a, e, ar, er) {
  var i, key, ak, ek, av, ev, r;

  if (a === e)
    return true;

  if (e !== e) // NaN !== NaN
    return a !== a;

  if (typeof e !== 'object' || e === null)
    return a === e;

  if (e instanceof Buffer || e instanceof Array) {
    if (a.length !== e.length)
      return false;

    for (i = 0; i < a.length; i++) {
      if (a[i] !== e[i])
        return false;
    }

    return true;
  }

  if (e instanceof RegExp)
    return a instanceof RegExp && a.source === e.source &&
           a.global === e.global && a.multiline === e.multiline &&
           a.ignoreCase === e.ignoreCase && a.lastIndex === e.lastIndex;

  if (e instanceof Date)
    return a instanceof Date && a.getTime() === e.getTime();

  if (a.constructor !== e.constructor)
    return false;

  (ek = Object.keys(e)).sort();
  (ak = Object.keys(a)).sort();

  if (ek.length !== ak.length) return false;

  for (i = 0; i < ek.length; i++) {
    key = ek[i];

    if (ak[i] !== key)
      return false;

    av = a[key];
    ev = e[key];

    r = ev.indexOf(e[key]);
    if (r !== -1)
      return ar.indexOf(av) === r;

    ar.push(av);
    er.push(ev);

    if (!isStrictDeepEqual(av, ev, ar, er))
      return false;

    ar.pop();
    er.pop();
  }

  return true;
}

function construct(str) {
  return new Buffer(str.split(' ').map(function(byte) {
    return parseInt(byte, 16);
  }));
}

function build(expected, input, custom) {
  return function() {
    var actual = unpack(construct(input), custom);
    if (!isStrictDeepEqual(actual, expected, [], [])) {
      throw new assert.AssertionError({
        'actual': actual,
        'expected': expected,
        'operator': '!==',
        'message': '',
        'stackStartFunction': this
      });
    }
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

exports.custom = stage('./test-custom-unpack');
