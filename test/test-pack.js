var v = require('./fixtures/validate').pack;

module.exports = {
  'basic values:': {
    'undefined': v(undefined, 'a1'),
    'null':      v(null,      'a2'),
    'true':      v(true,      'a3'),
    'false':     v(false,     'a4')
  },

  'numbers:': {
    'NaN':       v(NaN,       'a5'),
    'Infinity':  v(Infinity,  'a6'),
    '-Infinity': v(-Infinity, 'a7'),

    'varints:': {
      '128':             v(128,              'a8 00'),
      '255':             v(255,              'a8 7f'),
      '256':             v(256,              'a8 80 01'),
      '16511':           v(16511,            'a8 ff 7f'),
      '16512':           v(16512,            'a8 80 80 01'),
      '2097279':         v(2097279,          'a8 ff ff 7f'),
      '2097280':         v(2097280,          'a8 80 80 80 01'),
      '268435583':       v(268435583,        'a8 ff ff ff 7f'),
      '268435584':       v(268435584,        'a8 80 80 80 80 01'),
      '34359738495':     v(34359738495,      'a8 ff ff ff ff 7f'),
      '34359738496':     v(34359738496,      'a8 80 80 80 80 80 01'),
      '4398046511231':   v(4398046511231,    'a8 ff ff ff ff ff 7f'),
      '4398046511232':   v(4398046511232,    'a8 80 80 80 80 80 80 01'),
      '562949953421439': v(562949953421439,  'a8 ff ff ff ff ff ff 7f'),
      '562949953421440': v(562949953421440,  'a8 80 80 80 80 80 80 80 01'),

      '-32':              v(-32,              'a9 00'),
      '-159':             v(-159,             'a9 7f'),
      '-160':             v(-160,             'a9 80 01'),
      '-16415':           v(-16415,           'a9 ff 7f'),
      '-16416':           v(-16416,           'a9 80 80 01'),
      '-2097183':         v(-2097183,         'a9 ff ff 7f'),
      '-2097184':         v(-2097184,         'a9 80 80 80 01'),
      '-268435487':       v(-268435487,       'a9 ff ff ff 7f'),
      '-268435488':       v(-268435488,       'a9 80 80 80 80 01'),
      '-34359738399':     v(-34359738399,     'a9 ff ff ff ff 7f'),
      '-34359738400':     v(-34359738400,     'a9 80 80 80 80 80 01'),
      '-4398046511135':   v(-4398046511135,   'a9 ff ff ff ff ff 7f'),
      '-4398046511136':   v(-4398046511136,   'a9 80 80 80 80 80 80 01'),
      '-562949953421343': v(-562949953421343, 'a9 ff ff ff ff ff ff 7f'),
      '-562949953421344': v(-562949953421344, 'a9 80 80 80 80 80 80 80 01'),

      'upper limit': v(9007199254740992,  'a8 80 ff ff ff ff ff ff 0f'),
      'lower limit': v(-9007199254740992, 'a9 e0 ff ff ff ff ff ff 0f')
    },

    'integers outside the varint limits:': {
      'high': v(9007199254740994,  'aa 01 00 00 00 00 00 40 43'),
      'low':  v(-9007199254740994, 'aa 01 00 00 00 00 00 40 c3')
    },

    'decimal numbers:': {
      '0.25':     v(0.25,     'aa 00 00 00 00 00 00 d0 3f'),
      '-0.25':    v(-0.25,    'aa 00 00 00 00 00 00 d0 bf'),
      '123.456':  v(123.456,  'aa 77 be 9f 1a 2f dd 5e 40'),
      '-123.456': v(-123.456, 'aa 77 be 9f 1a 2f dd 5e c0'),

      'lowest precision, positive':
        v(1.7976931348623157e+308, 'aa ff ff ff ff ff ff ef 7f'),

      'highest precision, positive':
        v(5e-324, 'aa 01 00 00 00 00 00 00 00'),

      'lowest precision, negative':
        v(-1.7976931348623157e+308, 'aa ff ff ff ff ff ff ef ff'),

      'highest precision, negative':
        v(-5e-324, 'aa 01 00 00 00 00 00 00 80')
    }
  },

  'strings': {
    '\'12345\'':  v('12345',    'e5 31 32 33 34 35'),
    '\'abcdef\'': v('abcdef',   'e6 61 62 63 64 65 66'),
    '\'中國低語\'':   v('中國低語', 'ec e4 b8 ad e5 9c 8b e4 bd 8e e8 aa 9e'),

    '30-char string': v('000000000000000000000000000000',
      'fe 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 ' +
      '30 30 30 30 30 30 30 30'),

    '31-char string': v('0000000000000000000000000000000',
      'ff 00 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 ' +
      '30 30 30 30 30 30 30 30 30 30'),

    '32-char string': v('00000000000000000000000000000000',
      'ff 01 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 ' +
      '30 30 30 30 30 30 30 30 30 30 30')
  },

  'arrays': {
    '[]':                v([], 'd0'),
    '[1,2,3]':           v([1,2,3], 'd3 01 02 03'),
    '[[1],2,[3],[4,5]]': v([[1],2,[3],[4,5]], 'd4 d1 01 02 d1 03 d2 04 05')
  }
};
