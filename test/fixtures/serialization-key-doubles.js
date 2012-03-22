module.exports = {
  '0.25':     [0.25,     'aa 00 00 00 00 00 00 d0 3f'],
  '-0.25':    [-0.25,    'aa 00 00 00 00 00 00 d0 bf'],
  '123.456':  [123.456,  'aa 77 be 9f 1a 2f dd 5e 40'],
  '-123.456': [-123.456, 'aa 77 be 9f 1a 2f dd 5e c0'],

  '1.7976931348623157e+308 (lowest precision, positive)': [
    1.7976931348623157e+308, 'aa ff ff ff ff ff ff ef 7f'
  ],

  '-1.7976931348623157e+308 (lowest precision, negative)': [
    -1.7976931348623157e+308, 'aa ff ff ff ff ff ff ef ff'
  ],

  '5e-324 (highest precision, positive)': [
    5e-324, 'aa 01 00 00 00 00 00 00 00'
  ],

  '-5e-324 (highest precision, negative)': [
    -5e-324, 'aa 01 00 00 00 00 00 00 80'
  ],

  '9007199254740994 (greater than maximum varint value)': [
    9007199254740994, 'aa 01 00 00 00 00 00 40 43'
  ],

  '-9007199254740994 (less than minimum varint value)':  [
    -9007199254740994, 'aa 01 00 00 00 00 00 40 c3'
  ]
};
