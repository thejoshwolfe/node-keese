
exports.zero = "0";

exports.toNumber = function(n) {
  var ref = splitAtDecimalPoint(n)
    , integer = ref[0]
    , fraction = ref[1]
    ;
  var result = 0;
  while (integer.length > 0) {
    result *= radix;
    result += values[integer[0]];
    integer = integer.substr(1);
  }
  return result;
};

exports.next = function(n) {
  var ref = splitAtDecimalPoint(n)
    , integer = ref[0]
    , fraction = ref[1]
    ;
  var result = "";
  var carry = 1;
  var orders = 0;
  for (var i = integer.length - 1; i >= 0 || carry > 0; i--) {
    orders++;
    var value = values[integer[i]] || 0;
    value += carry;
    carry = 0;
    while (value >= radix) {
      value -= radix;
      carry++;
    }
    result = char_list[value] + result;
  }
  for (i = 0; i < orders - 1; i++) {
    result = order_signifier + result;
  }
  return result;
};

exports.average = function(a, b) {
  // TODO
};

function splitAtDecimalPoint(n) {
  var orders = 1;
  while (n.substr(0, 1) === order_signifier) {
    orders++;
    n = n.substr(1);
  }
  return [n.substr(0, orders), n.substr(orders)];
}

var order_signifier = '~';
var char_list = "0123456789?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var radix = char_list.length;
var values = {};
(function() {
  for (var i = 0; i < char_list.length; i++)
    values[char_list[i]] = i;
})();

