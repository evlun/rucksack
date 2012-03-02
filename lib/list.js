function Item(value) {
  this.value = value;
  this.next = null;
};

function List() {
  this.stump = this.tail = new Item(null);
};

List.prototype.append = function(value) {
  this.tail.next = this.tail = new Item(value);
};

List.prototype.indexOf = function(value) {
  var
    pos = 0,
    item = this.stump.next;

  while (item != null) {
    if (item.value === value) {
      return pos;
    } else {
      item = item.next;
      pos += 1;
    }
  }

  return -1;
};

List.prototype.get = function(index) {
  var i = 0,
      item = this.stump.next;

  while (item !== null) {
    if (i === index) {
      return item.value;
    }
    item = item.next;
    i += 1;
  }
};

module.exports = List;
