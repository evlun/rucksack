function X() {
  this.y = 10;
}
X.prototype.z = 20;
var instance = new X();

module.exports = {
  '{}':             [{},             'c0'],
  '{ a: 1 }':       [{ a: 1 },       'c1 01 61 01'],
  '{ b: 2, c: 3 }': [{ b: 2, c: 3 }, 'c2 01 62 02 01 63 03'],
  '{ \'√3.\': 4 }': [{ '√3.': 4 },   'c1 05 e2 88 9a 33 2e 04'],

  '{ d: { e: { f: 5, g: 6 } } }': [
    { d: { e: { f: 5, g: 6 } } }, 'c1 01 64 c1 01 65 c2 01 66 05 01 67 06'
  ],

  '{ h: \'abc\', i: \'åäö\' }': [
    { h: 'abc', i: 'åäö' }, 'c2 01 68 e3 61 62 63 01 69 e6 c3 a5 c3 a4 c3 b6'
  ],

  'ignore inherited/prototype properties': [instance, 'c1 01 79 0a']
};
