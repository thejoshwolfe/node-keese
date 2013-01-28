
var keese = require('..')
  , assert = require('assert')
  ;

var previous = null;
var n = keese.zero
for (var i = 0; i < 10000; i++) {
  assert.strictEqual(i, keese.toNumber(n));
  if (previous !== null) {
    assert(previous < n);
  }
  previous = n;
  n = keese.next(n);
}

var zero = keese.zero;
var one = keese.next(zero);
var half = keese.average(zero, one);
assert(zero < half);
assert(half < one);

