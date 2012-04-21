var key,
    pack = require('./test-pack'),
    unpack = require('./test-unpack'),
    custom = require('./test-custom');

exports['rucksack.pack'] = {};
exports['rucksack.unpack'] = {};
exports['custom packing/unpacking'] = {};

for (key in pack) {
  exports['rucksack.pack']['should ' + key] = pack[key];
}

for (key in unpack) {
  exports['rucksack.unpack']['should ' + key] = unpack[key];
}

for (key in custom) {
  exports['custom packing/unpacking'][key] = custom[key];
}
