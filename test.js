
var keese = require('./')
  , assert = require('assert')
  ;

testKeese(keese);
testKeese(keese("0123456789@"));

function testKeese(keese) {
  var zero = keese.zero();

  var biggest_single_digit;
  var multi_digits = [];
  var previous = null;
  var n = zero
  for (var i = 0; i < 10000; i++) {
    if (previous !== null) {
      assertLessThan(previous, n);
      testBetween(previous, n);
    }
    if (n.length === 1) {
      biggest_single_digit = n;
    } else if (multi_digits.length < 2) {
      multi_digits.push(n);
    }
    previous = n;
    n = keese.next(n);
  }
  testBetween(biggest_single_digit, multi_digits[1]);

  assert.throws(function() { keese.between(keese.next(zero),  zero); });

  assert.strictEqual(zero, keese.between(zero, zero));

  function assertLessThan(a, b) {
    assert(a < b, JSON.stringify(a) + " < " + JSON.stringify(b));
  }
  function testBetween(a, c) {
    var b = keese.between(a, c);
    assertLessThan(a, b);
    assertLessThan(b, c);
  }
}

