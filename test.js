
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

function assertLessThan(a, b) {
  assert(a < b, JSON.stringify(a) + " < " + JSON.stringify(b));
}
function testBetween(a, c) {
  var b = keese.between(a, c);
  assertLessThan(a, b);
  assertLessThan(b, c);
}

testBetween(keese.zero, keese.next(keese.zero));
testBetween("z", "~11");
assert.throws(function() { keese.between(keese.next(keese.zero),  keese.zero); });

assert.strictEqual(keese.zero, keese.between(keese.zero, keese.zero));

