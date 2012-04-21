function define(label, value, serialized) {
  if (arguments.length === 2) {
    serialized = value;
    value = eval('(' + label + ')');
  }

  exports[label] = { 'value': value, 'serialized': serialized };
}


// basic values
define('undefined', 'a1');
define('null', 'a2');
define('true', 'a3');
define('false', 'a4');
define('NaN', 'a5');
define('Infinity', 'a6');
define('-Infinity', 'a7');


// fixnums
define('0', '00');
define('1', '01');
define('127', '7f');

define('-0', '80');
define('-1', '81');
define('-31', '9f');


// varints
define('128', 'a8 00');
define('255', 'a8 7f');
define('256', 'a8 80 01');
define('16511', 'a8 ff 7f');
define('16512', 'a8 80 80 01');
define('2097279', 'a8 ff ff 7f');
define('2097280', 'a8 80 80 80 01');
define('268435583', 'a8 ff ff ff 7f');
define('268435584', 'a8 80 80 80 80 01');
define('34359738495', 'a8 ff ff ff ff 7f');
define('34359738496', 'a8 80 80 80 80 80 01');
define('4398046511231', 'a8 ff ff ff ff ff 7f');
define('4398046511232', 'a8 80 80 80 80 80 80 01');
define('562949953421439', 'a8 ff ff ff ff ff ff 7f');
define('562949953421440', 'a8 80 80 80 80 80 80 80 01');

define('-32', 'a9 00');
define('-159', 'a9 7f');
define('-160', 'a9 80 01');
define('-16415', 'a9 ff 7f');
define('-16416', 'a9 80 80 01');
define('-2097183', 'a9 ff ff 7f');
define('-2097184', 'a9 80 80 80 01');
define('-268435487', 'a9 ff ff ff 7f');
define('-268435488', 'a9 80 80 80 80 01');
define('-34359738399', 'a9 ff ff ff ff 7f');
define('-34359738400', 'a9 80 80 80 80 80 01');
define('-4398046511135', 'a9 ff ff ff ff ff 7f');
define('-4398046511136', 'a9 80 80 80 80 80 80 01');
define('-562949953421343', 'a9 ff ff ff ff ff ff 7f');
define('-562949953421344', 'a9 80 80 80 80 80 80 80 01');

define('9007199254740992', 'a8 80 ff ff ff ff ff ff 0f');
define('-9007199254740992', 'a9 e0 ff ff ff ff ff ff 0f');


// integers too beyond the varint limits
define('9007199254740994', 'aa 01 00 00 00 00 00 40 43');
define('-9007199254740994', 'aa 01 00 00 00 00 00 40 c3');


// doubles
define('0.25', 'aa 00 00 00 00 00 00 d0 3f');
define('-0.25', 'aa 00 00 00 00 00 00 d0 bf');
define('123.456', 'aa 77 be 9f 1a 2f dd 5e 40');
define('-123.456', 'aa 77 be 9f 1a 2f dd 5e c0');

define('1.7976931348623157e+308', 'aa ff ff ff ff ff ff ef 7f');
define('-1.7976931348623157e+308', 'aa ff ff ff ff ff ff ef ff');

define('5e-324', 'aa 01 00 00 00 00 00 00 00');
define('-5e-324', 'aa 01 00 00 00 00 00 00 80');


// strings
define('"12345"', 'e5 31 32 33 34 35');
define('"abcdef"', 'e6 61 62 63 64 65 66');
define('"中國低語"', 'ec e4 b8 ad e5 9c 8b e4 bd 8e e8 aa 9e');

define('a 30-char string', 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'fe 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 ' +
  '78 78 78 78 78 78 78 78 78 78 78 78 78 78');

define('a 31-char string', 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'ff 00 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 ' +
  '78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78');

define('a 32-char string', 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'ff 01 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 ' +
  '78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78 78');

var i, char,
    base = 'a'.charCodeAt(0),
    str = '',
    exp = 'ff c9 07';

for (i = 0; i < 1000; i++) {
  char = base + i % 26;
  str += String.fromCharCode(char);
  exp += ' ' + char.toString(16);
}

define('a 1000-char string', str, exp);


// regular expressions
define('/abc/', 'ad 00 03 61 62 63');
define('/def/i', 'ad 01 03 64 65 66');
define('/ghi/g', 'ad 02 03 67 68 69');
define('/jkl/m', 'ad 04 03 6a 6b 6c');
define('/mno/igm', 'ad 07 03 6d 6e 6f');


// dates
define('new Date(0)', 'ac 00');
define('new Date(123456789)', 'ac 95 9a ef 3a');

define('new Date(-1)', 'ab 00');
define('new Date(-123456789)', 'ab 94 9a ef 3a');


// arrays
define('[]', 'c0');
define('[[], []]', 'c2 c0 c0');
define('[1, 2, 3]', 'c3 01 02 03');
define('[[1], 2, [3], [4, 5]]', 'c4 c1 01 02 c1 03 c2 04 05');
define(
  '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]',
  'cf 05 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10 11 12 13 14'
);


// objects
define('{}', 'd0');
define('{ a: 1 }', 'd1 01 61 01');
define('{ b: 2, c: 3 }', 'd2 01 62 02 01 63 03');
define('{ "√3.": 4 }', 'd1 05 e2 88 9a 33 2e 04');
define('{ d: { e: { f: 5, g: 6 } } }',
  'd1 01 64 d1 01 65 d2 01 66 05 01 67 06');
define('{ h: "abc", i: "åäö" }',
  'd2 01 68 e3 61 62 63 01 69 e6 c3 a5 c3 a4 c3 b6');
define(
  '{ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10, k: 11, ' +
    'l: 12, m: 13, n: 14, o: 15, p: 16, q: 17, r: 18, s: 19, t: 20 }',
  'df 05 01 61 01 01 62 02 01 63 03 01 64 04 01 65 05 01 66 06 01 67 07 01 ' +
    '68 08 01 69 09 01 6a 0a 01 6b 0b 01 6c 0c 01 6d 0d 01 6e 0e 01 6f 0f ' +
    '01 70 10 01 71 11 01 72 12 01 73 13 01 74 14'
);


// references
var a = [];
a.push(a);
define('[[Circular]]', a, 'c1 a0 00');

var b = {};
b.self = b;
define('{ self: [Circular] }', b, 'd1 04 73 65 6c 66 a0 00');

var c = [[]];
c.push(c);
c.push(c);
define('[[], [Circular], [Circular]]', c, 'c3 c0 a0 00 a0 00');

var d = [[]];
d.push({ top: d });
define('[[], { top: [Circular] }]', d, 'c2 c0 d1 03 74 6f 70 a0 00');

var e = [[], []],
    f = [e[1]];
e[1].push(f);
define('[[], [[Circular]]]', e, 'c2 c0 c1 c1 a0 02');


// mixed values
var arr = [
  [],
  null,
  false,
  '◊ˆ∑∆Ü',
  9, -0, 0.102, 0.2, 987654321, -123456789,
  { 3: 'abc', undef: undefined }
];
arr[0].push(arr);

define(
  '[[[Circular]], null, false, "◊ˆ∑∆Ü", 9, -0, 0.102, 0.2, 987654321, ' +
    '-123456789, { 3: "abc", undef: undefined }]',
  arr,
  'cb c1 a0 00 a2 a4 ed e2 97 8a cb 86 e2 88 91 e2 88 86 c3 9c 09 80 aa e9 ' +
    '26 31 08 ac 1c ba 3f aa 9a 99 99 99 99 99 c9 3f a8 b1 d0 f9 d6 03 a9 ' +
    'f5 99 ef 3a d2 01 33 e3 61 62 63 05 75 6e 64 65 66 a1'
);
