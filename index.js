
module.exports = configure();
function configure(alphabet) {
  // validate input
  if (typeof alphabet === "string") {
    if (alphabet.length < 3) throw new Error("we need more chars");
    // make sure the chars are sorted
    (function() {
      for (var i = 1; i < alphabet.length; i++) {
        if (!(alphabet[i - 1] < alphabet[i])) throw new Error("alphabet must contain sorted unique characters");
      }
    })();
  } else {
    alphabet = "0123456789?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~";
  }

  // setup cached variables
  var order_specifier = alphabet.charAt(alphabet.length - 1);
  alphabet = alphabet.substr(0, alphabet.length - 1);
  var zero = alphabet.charAt(0);
  var one = alphabet.charAt(1);
  var radix = alphabet.length;
  var values = {};
  (function() {
    for (var i = 0; i < alphabet.length; i++) {
      values[alphabet[i]] = i;
    }
  })();

  // extra public members
  keese.configure = configure;
  return keese;


  function keese(low, high) {
    // this is the main function
    if (low == null) {
      if (high == null) {
        // return anything above zero
        return one;
      } else {
        // go smaller
        return average(zero, high);
      }
    } else {
      if (high == null) {
        // go bigger
        return increment(low);
      } else {
        // go in between
        return average(low, high);
      }
    }
  }

  function increment(value) {
    var n = parse(value);
    // drop the fraction
    n.digits = n.digits.substr(0, n.order_length + 1);
    return add(n, parse(one));
  }

  function average(low, high) {
    if (!(low < high)) {
      throw new Error("assertion failed: " + JSON.stringify(low) + " < " + JSON.stringify(high));
    }
    var a = parse(low);
    var b = parse(high);
    pad_to_equal_order(a, b);
    var b_carry = 0;
    var max_digit_length = Math.max(a.digits.length, b.digits.length);
    for (var i = 0; i < max_digit_length || b_carry > 0; i++) {
      var a_value =            values[a.digits[i]] || 0;
      var b_value = b_carry + (values[b.digits[i]] || 0);
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
      half_distance_digits += alphabet[half_distance_value];
      var half_distance = parse(construct(a.order_length, half_distance_digits));
      // truncate insignificant digits of a
      a.digits = a.digits.substr(0, i + 1);
      return add(a, half_distance);
    }
    throw new Error; // unreachable
  }

  function add(a, b) {
    pad_to_equal_order(a, b);
    var result_digits = "";
    var order_length = a.order_length;
    var value = 0;
    for (var i = Math.max(a.digits.length, b.digits.length) - 1; i >= 0; i--) {
      value += values[a.digits[i]] || 0;
      value += values[b.digits[i]] || 0;
      result_digits = alphabet[value % radix] + result_digits;
      value = Math.floor(value / radix);
    }
    // overflow up to moar digits
    while (value > 0) {
      result_digits = alphabet[value % radix] + result_digits;
      value = Math.floor(value / radix);
      order_length++;
    }
    return construct(order_length, result_digits);
  }

  function parse(value) {
    var order_length = value.lastIndexOf(order_specifier) + 1;
    return {
      order_length: order_length,
      digits: value.substr(order_length)
    };
  }
  function construct(order_length, digits) {
    // strip unnecessary leading zeros
    while (order_length > 0 && digits.charAt(0) == zero) {
      digits = digits.substr(1);
      order_length--;
    }
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

  return keese;
}
