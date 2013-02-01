
function closureGenerator(char_list) {
  if (typeof char_list === "string") {
    if (char_list.length < 3) throw new Error("we need more chars");
  } else {
    char_list = "0123456789?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~";
  }
  // make sure the chars are sorted
  char_list = char_list.split("");
  char_list.sort();
  char_list = char_list.join("");
  // the top char is the order specifier
  var order_specifier = char_list.charAt(char_list.length - 1);
  char_list = char_list.substr(0, char_list.length - 1);
  // cache some things
  var zero = char_list.charAt(0);
  var radix = char_list.length;
  var values = {};
  (function() {
    for (var i = 0; i < char_list.length; i++)
      values[char_list[i]] = i;
  })();

  function parse(s) {
    var order_length = s.lastIndexOf(order_specifier) + 1;
    return {
      order_length: order_length,
      digits: s.substr(order_length)
    };
  }
  function construct(order_length, digits) {
    var result = "";
    for (var i = 0; i < order_length; i++)
      result += order_specifier;
    return result + digits;
  }

  function pad_to_equal_order(a, b) {
    pad_in_place(a, b.order_length);
    pad_in_place(b, a.order_length);
  }
  function pad_in_place(n, order_length) {
    while (n.order_length < order_length) {
      n.digits = zero + n.digits;
      n.order_length++;
    }
  }

  function add(a, b) {
    pad_to_equal_order(a, b);
    var result_digits = "";
    var order_length = a.order_length;
    var value = 0;
    for (var i = Math.max(a.digits.length, b.digits.length) - 1; i >= 0; i--) {
      value += values[a.digits[i] || zero];
      value += values[b.digits[i] || zero];
      result_digits = char_list[value % radix] + result_digits;
      value = Math.floor(value / radix);
    }
    // overflow up to moar digits
    while (value > 0) {
      result_digits = char_list[value % radix] + result_digits;
      value = Math.floor(value / radix);
      order_length++;
    }
    return construct(order_length, result_digits);
  }

  // public exports

  var keese = function(char_list) {
    return closureGenerator(char_list);
  };

  keese.zero = function() { return zero; };

  keese.next = function(s) {
    var n = parse(s);
    // drop the fraction
    n.digits = n.digits.substr(0, n.order_length + 1);
    return add(n, parse(char_list[1]));
  };

  keese.between = function(s1, s2) {
    if (s1 > s2) throw new Error;
    if (s1 === s2) return s1;
    var a = parse(s1);
    var b = parse(s2);
    pad_to_equal_order(a, b);
    var b_carry = 0;
    for (var i = 0; i < a.digits.length || b_carry > 0; i++) {
      var a_value = values[a.digits[i] || zero];
      var b_value = values[b.digits[i] || zero] + b_carry;
      if (a_value === b_value) continue;
      if (a_value === b_value - 1) {
        // we need more digits, but remember that b is ahead
        b_carry = radix;
        continue;
      }
      // we have a distance of at least 2 between the values.
      // half the distance floored is sure to be a positive single digit.
      var half_distance_value = Math.floor((b_value - a_value) / 2);
      var half_distance_digits = "";
      for (var j = 0; j < i; j++)
        half_distance_digits += zero;
      half_distance_digits += char_list[half_distance_value];
      var half_distance = parse(construct(a.order_length, half_distance_digits));
      // truncate insignificant digits of a
      a.digits = a.digits.substr(0, i);
      return add(a, half_distance);
    }
    throw new Error; // unreachable
  };

  return keese;
}
module.exports = closureGenerator();
