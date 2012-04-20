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



// objects
define('{}', 'd0');
define('{ a: 1 }', 'd1 01 61 01');
define('{ b: 2, c: 3 }', 'd2 01 62 02 01 63 03');
define('{ "√3.": 4 }', 'd1 05 e2 88 9a 33 2e 04');
define('{ d: { e: { f: 5, g: 6 } } }',
  'd1 01 64 d1 01 65 d2 01 66 05 01 67 06');
define('{ h: "abc", i: "åäö" }',
  'd2 01 68 e3 61 62 63 01 69 e6 c3 a5 c3 a4 c3 b6');


// references
var a, b, c, d, e, f;

a = []; a.push(a);
b = {}; b.self = b;
c = [[]]; c.push(c); c.push(c);
d = [[]]; d.push({ top: d });
e = [[], []]; f = [e]; e[1].push(f);

define('[[Circular]]', a, 'c1 a0 00');
define('{ self: [Circular] }', b, 'd1 04 73 65 6c 66 a0 00');
define('[[], [Circular], [Circular]]', c, 'c3 c0 a0 00 a0 00');
define('[[], { top: [Circular] }]', d, 'c2 c0 d1 03 74 6f 70 a0 00');
define('[[], [[Circular]]]', e, 'c2 c0 c1 c1 a0 00');
