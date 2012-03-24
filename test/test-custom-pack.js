function pass() { }
function cancel() { return false; }

function increase(value, out, refs, pack) {
  if (typeof value === 'number') {
    pack(value + 1);
    return false;
  }
}

module.exports = {
  'cancel':   [0, '',   cancel],
  'pass':     [0, '00', pass],
  'increase': [0, '01', increase],

  'increase all elements in an array': [
    [1, 2, 3], 'd3 02 03 04', increase
  ]
};
