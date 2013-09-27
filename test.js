
var keese = require('./');
var assert = require('assert');

basicTest();
overflowTest();

function basicTest() {
  var b = keese(null, null);
  var d = keese(b, null);
  assert(b < d); // forwards
  var c = keese(b, d);
  assert(b < c); // between
  assert(c < d);
  var a = keese(null, b);
  assert(a < b); // backwards
}

function overflowTest() {
  function testExtremeNext() {
    var biggest_single_digit;
    var multi_digits = [];
    var previous = null;
    var n = keese();
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
      n = keese(n, null);
    }
    if (multi_digits[1]) {
      testBetween(biggest_single_digit, multi_digits[1]);
    }
    function testBetween(a, c) {
      var b = keese(a, c);
      assertLessThan(a, b);
      assertLessThan(b, c);
    }
    return n;
  }
  var big_number = testExtremeNext();

  function testExtremeBetween(lower, upper, forward_func) {
    for (var i = 0; i < 1000; i++) {
      var middle = keese(lower, upper);
      assertLessThan(lower, middle);
      assertLessThan(middle, upper);

      if (forward_func(i)) {
        lower = middle;
      } else {
        upper = middle;
      }
    }
  }
  (function() {
    var one = keese();
    var two = keese(one, null);
    var forward_funcs = [
      function() { return true; },
      function() { return false; },
      // arbitrarilly descend forwards or backwards pseudo randomly or whatever
      function(i) { return i % 3 === 0 || i % 7 > 3; },
    ];
    var boundses = [
      [one, two],
      [one, big_number],
    ];
    for (var i = 0; i < boundses.length; i++) {
      for (var j = 0; j < forward_funcs.length; j++) {
        testExtremeBetween(boundses[i][0], boundses[i][1], forward_funcs[j]);
      }
    }
  })();

  assert.throws(function() { keese(keese(), keese()); });

  function assertLessThan(a, b) {
    assert(a < b, JSON.stringify(a) + " < " + JSON.stringify(b));
  }
}

