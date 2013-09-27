node-keese
==========

Generator for well-ordered values, appropriate for use as sort keys.

Given any two values, keese can generate a value between them.
This would be trivial with numbers (`middle = (low + high) / 2`), except that numbers eventually run out of precision in JavaScript.
Instead of using `Number`, keese effectively encodes arbitrary-precision floating-point numbers into strings.
The values are comparable with the builtin operators (such as `<`), but most everything else about the string is unspecified.

```js
var keese = require('keese');

var something = keese();
var bigger = keese(something, null);
var smaller = keese(null, something);
// smaller < something < bigger
```

In general:

```js
var middle = keese(low, high);
```

Where:
* `low` and `high` must each either be `== null` or be the result of a previous call to `keese`.
* If both `low` and `high` are `!= null`, then `low` must be `< high`.
* If `low` is `!= null`, then `low` will be `< middle`.
* If `high` is `!= null`, then `middle` will be `< high`.
* `keese` is a [pure function](http://en.wikipedia.org/wiki/Pure_function).

How it works
------------

The problem with JavaScript `Number`s is that they have limited precision.
In order to get arbitrary numeric precision, we need more than a single primitive number value;
we need an arbitrarily-large array of numbers.
We could use JavaScript `Array`s, but `String`s are better for the following reasons:
strings are more compact in JSON (and probably in memory),
and strings can be compared easily with a builtin function (the `<` operator),
which is convenient (and probably much more efficient that writing a custom Array comparator).
Being able to compare strings using `<` (called lexicographical ordering) is a driving principle in the design of this library.

So how do we encode arbitrary precision numbers in strings in such a way as to preserve lexicographical ordering?
Base 10 is a good place to start.
What comes between `"0.1"` and `"0.2"`?
The numeric answer `"0.15"` satisfies the lexicographical ordering;
adding digits to the end of the smaller string is a good way to implement going in between two values.

The problem with a naive base 10 encoding is that adding digits to the left breaks lexicographical ordering.
`9 < 10` but `"9" > "10"`.
The problem is that the "ones" digit `"9"` is being compared to the "tens" digit `"1"` in `"10"`.
The common way to solve this frame-shift error is to pad any small numbers with `"0"`s.
`"09" < "10"`.
This is obviously problematic, because we are forced to limit the number of digits with this strategy, thereby failing to have arbitrary precision.

The solution is to reserve a special digit `"~"` that has a larger character value than any other character in the alphabet,
and use this character to make sure we never get frame shift errors.
`"9" < "~10"`. `"~99" < "~~100"`.
If two values have different orders of magnitude, then a `"~"` will inevitably be compared against a character that is not a `"~"`,
and no actual digit values will ever be compared.
(While this doubles the number of digits for large integers, remember that the number of digits is still O(n).)

With this lexicographically-correct magnitude specification, we have no need for any decimal points,
which in common notation accomplish the same purpose.
We can write `"21"` instead of `"2.1"`, because we know that `"~12"` is bigger due to the `"~"`.

One last problem remains, which is how to generate a value smaller than the parameter.
We have no way of encoding negative numbers lexicographically correctly;
all the digit values would be inverted, and comparisons would be all wrong.
The solution to this is surprisingly trivial;
keep a "smallest value" secret from the client,
and implement the "smaller" function by going in between the "smallest value" and the parameter.
We reserve the number `0`, encoded as `""`, as the smallest value, and effectively halve any parameter to generate a smaller value.

(It would be more efficient to use a special character, such as `"!"`, to signify negative magnitude.
Oh well. Maybe in a future version of keese.)

As a matter of efficiency, using base 10 would only encode 10 values per character, but we can easily encode many more.
JavaScript strings are made of 16-bit characters, so the maximum density we can achieve is radix 65536 (not counting the magnitude specifier).
However, many characters in this range are unreadable and untypable,
and some JSON libraries (such as in python) will escape non-ascii values with `"\x1234"` notation by default,
so radix 65536 may not be worth the trouble.
Following the example of the base64 encoding, keese uses radix 64 with all printable ascii characters.

This is the alphabet:

```
0123456789?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
```

plus `"~"` for the magnitude specification.

Here are some example encoded values:

* `keese()` returns "1", the number `1`.
* `"z"` is the number `63`.
* `keese("z", null)` returns "~10", the number `64`.
* `keese("1", "2")` returns "1U", the number `1.5`.

