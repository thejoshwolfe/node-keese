
var keese = require('./')
  , assert = require('assert')
  ;

var previous = null;
var n = keese.zero
for (var i = 0; i < 10000; i++) {
  if (previous !== null) {
    assert(previous < n, "well ordering: '" + previous + "' < '" + n + "'");
  }
  previous = n;
  n = keese.next(n);
}

var zero = keese.zero;
var one = keese.next(zero);
var half = keese.between(zero, one);
assert(zero < half, "zero < half");
assert(half < one,  "half < one");

assert.throws(function() { keese.between(one,  zero); });
assert.throws(function() { keese.between(one,  half); });
assert.throws(function() { keese.between(half, zero); });

