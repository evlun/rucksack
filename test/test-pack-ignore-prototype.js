var assert = require('assert'),
    pack = require('../').pack;

function X() {
  this.y = 10;
}
X.prototype.z = 20;

module.exports = function() {
  assert.deepEqual(pack(new X()), new Buffer([0xc1, 0x01, 0x79, 0x0a]));
};
