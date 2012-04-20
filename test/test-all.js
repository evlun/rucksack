var key,
    pack = require('./test-pack'),
    unpack = require('./test-unpack');

exports['rucksack.pack'] = {};
exports['rucksack.unpack'] = {};

for (key in pack) {
  exports['rucksack.pack']['should ' + key] = pack[key];
}

for (key in unpack) {
  exports['rucksack.unpack']['should ' + key] = unpack[key];
}
