
var keese = require('..')
  , assert = require('assert')
  ;

var previous = null;
var n = keese.zero
for (var i = 0; i < 10000; i++) {
  assert.strictEqual(i, keese.toNumber(n));
  if (previous !== null) {
    assert(previous < n, "well ordering: '" + previous + "' < '" + n + "'");
  }
  previous = n;
  n = keese.next(n);
}

var zero = keese.zero;
var one = keese.next(zero);
var half = keese.between(zero, one);
console.log([zero, half, one]);
assert(zero < half, "zero < half");
assert(half < one,  "half < one");
assert(keese.toNumber(zero) < keese.toNumber(half), "numbers: zero < half");
assert(keese.toNumber(half) < keese.toNumber(one),  "numbers: half < one");

assert.throws(function() { keese.between(one,  zero); });
assert.throws(function() { keese.between(one,  half); });
assert.throws(function() { keese.between(half, zero); });

