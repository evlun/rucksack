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
  var item = this.stump.next,
      i = 0;

  while (item != null) {
    if (item.value === value) {
      return i;
    }

    item = item.next;
    i += 1;
  }

  return -1;
};

List.prototype.get = function(index) {
  var item = this.stump.next,
      i = 0;

  while (item !== null) {
    if (i === index) {
      return item.value;
    }

    item = item.next;
    i += 1;
  }
};

module.exports = List;
