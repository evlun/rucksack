var a = []; a[0] = a;
var b = {}; b.self = b;
var c = [1, 2, 3, 4, 5, 6]; c[3] = [c];

module.exports = {
  'circular array':                    [a,       'd1 a0 00'],
  'circular object':                   [b,       'c1 04 73 65 6c 66 a0 00'],
  'duplicate circular array elements': [[a, a],  'd2 d1 a0 01 a0 01'],
  'two-leveled circular array':        [c,       'd6 01 02 03 d1 a0 00 05 06']
};
