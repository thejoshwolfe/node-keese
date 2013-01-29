
var char_list = "0123456789?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var radix = char_list.length;
var values = {};
(function() {
  for (var i = 0; i < char_list.length; i++)
    values[char_list[i]] = i;
})();

var zero = char_list[0];
exports.zero = zero;

exports.next = function(n) {
  var integer = parse(n).integer;
  var result = "";
  var carry = 1;
  var orders = 0;
  for (var i = integer.length - 1; i >= 0 || carry > 0; i--) {
    orders++;
    var value = values[integer[i] || zero];
    value += carry;
    carry = 0;
    while (value >= radix) {
      value -= radix;
      carry++;
    }
    result = char_list[value] + result;
  }
  for (i = 0; i < orders - 1; i++) {
    result = '~' + result;
  }
  return result;
};

exports.between = function(a, b) {
  if (a > b) throw new Error;
  if (a === b) return a;
  a = parse(a);
  b = parse(b);
  var a_digits = a.integer + a.fraction;
  var b_digits = b.integer + b.fraction;
  var i;
  // pad the front of a with zeros to align the significance of the digitis
  for (i = a.order.length; i < b.order.length; i++)
    a_digits = zero + a_digits;
  // pad the end of a with zeros so we can substr it later
  while (a_digits.length < b_digits.length)
    a_digits += zero;
  var b_carry = 0;
  for (i = 0; i < b_digits.length || b_carry > 0; i++) {
    var a_value = values[a_digits[i] || zero];
    var b_value = values[b_digits[i] || zero] + b_carry;
    if (a_value === b_value) continue;
    if (a_value === b_value - 1) {
      // we need more digits, but remember that b is ahead
      b_carry = radix;
      continue;
    }
    // we have a distance of at least 2 between the values.
    // choose a digit halfway between them.
    var new_value = 0 | (a_value + b_value) / 2;
    var result_digits = a_digits.substr(0, i) + char_list[new_value];
    // strip away any zeros we added to the front
    result_digits = result_digits.substr(b.order.length - a.order.length);
    return a.order + result_digits;
  }
  throw new Error; // unreachable
};

function parse(n) {
  var order = /^~*/.exec(n)[0];
  return {
    order:    order,
    integer:  n.substr(order.length, order.length + 1),
    fraction: n.substr(order.length + order.length + 1),
  }
}

