var buf = new Buffer('123'),
    arr = [1, 2, buf, 4],
    shared = new Buffer('0123456789');

module.exports = {
  'new Buffer(\'123\')':            [buf, 'ab 00 03 31 32 33'],
  '[1, 2, new Buffer(\'123\'), 4]': [arr, 'd4 01 02 ab 00 03 04 31 32 33'],

  '[new Buffer(\'1\'), new Buffer(\'2\')]': [
    [new Buffer('1'), new Buffer('2')], 'd2 ab 00 01 ab 01 01 31 32'
  ],

  'new Buffer(\'123\') + .slice(1, 3)': [
    [buf, buf.slice(1, 3)], 'd2 ab 00 03 ab 01 02 31 32 33'
  ],

  'two isolated views of the same buffer': [
    [shared.slice(8, 10), shared.slice(0, 2)],
    'd2 ab 02 02 ab 00 02 30 31 38 39'
  ],

  'two overlapping buffer views': [
    [shared.slice(2, 6), shared.slice(4, 8)],
    'd2 ab 00 04 ab 02 04 32 33 34 35 36 37'
  ]
};
