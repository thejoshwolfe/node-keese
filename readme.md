node-keese
==========

Generator for well-ordered values, appropriate for use as sorting keys.

keese can always generate a bigger value, a smaller value, and a value between two other values.
This is trivial using numbers with `x+1`, `x-1`, and `(x+y)/2` respectively.
However, numbers have limited precision in JavaScript (see below), so instead keese uses strings.

The string values are comparable with the builtin comparison operators (such as `<`),
and keese can *always* generate a new value that satisfies the constraints (limited only by system resources).

```js
var keese = require('keese');

var something = keese();
var bigger = keese(something, null);
var smaller = keese(null, something);
// smaller < something < bigger
var medium = keese(smaller, bigger);
// smaller < medium < bigger
// but no guarantee about middle vs something
```

Formally:

```js
var middle = keese(low, high);
```

Where:
* `low` and `high` must each either be `== null` or be the result of a previous call to `keese`.
* If `low` and `high` are both `== null`, then `middle` will be some arbitrary value to get you started.
* If `low` is `!= null`, then `low` will be `< middle`.
* If `high` is `!= null`, then `middle` will be `< high`.
* If `low` and `high` are both `!= null`, then `low < middle < high` (so `low` must be `< high`).

`keese` is a [pure function](http://en.wikipedia.org/wiki/Pure_function).


Why would I want this?
----------------------

Say you have a client-server architecture where clients can edit an ordered list of items.
Clients can insert, delete, and move items around in the list.
([Groove Basin](https://github.com/superjoe30/groovebasin) does this with the current playlist of songs.)

The naive approach would be to use an Array, and communicate about where an operation is happening by using an index into the array.
For example, "add item x at index 5", or "delete item at index 2" or "move item at index 7 to index 10", etc.
This works well enough, but race conditions can cause sad behavior.

Imagine all three of the above commands are sent to the server at once from different clients.
Say the server receives the "delete" command first, and shifts all the items above index 2 down 1.
Now the "move" command referencing the item at index 7 is actually talking about a different item, one that was originally at index 8.
The "add" command is similarly misinterpreted, because the client may have specifically wanted "item x" to be inserted immediately after a particular item.

Another naive approach is to communicate about locations relative to existing items.
For example, "add item x just after item y", or "delete item y".
Do you see the problem here?
Say a client wants to insert "item x" in the middle of a range of 10 items, but another client deletes those 10 items before the insert request can be processed.
There's no guarantee that the item(s) a client refers to will still exist on the server by the time the request is processed.

The most robust solution is to communicate about locations using arbitrary sorting keys.
Give every item a different value such that when the items are sorted using the values, they are ordered appropriately.
For example, start out by giving each of 10 items in the list the values 1 through 10 as their sorting keys.

Now if a client deletes the item with the sorting key of 2, there's no need to shift anything; just leave the other sorting keys where they are.
When a client wants to insert an item between 5 and 6, give the new item a sorting key of 5.5.
When a client wants to move an item, change the items sorting key to some other value.
After performing each of these operations, simply sort the list again, and the items will be in the desired order.

By using sorting keys, the opportunity for race conditions is almost entirely eliminated.
There can still be race conditions when there is truly no possible automatic solution,
such as two clients inserting different items into the same location, or two clients both trying to delete the same item at once.
However, these problems usually have trivial solutions, and they are outside the scope of this project.

keese exists for the purpose of generating sorting keys that never run out of precision.


Numbers have limited precision
------------------------------

This code snippet shows how many times you can obtain a middle value
using a JavaScript `Number` and still get a meaningful result.

```js
var a = 1;
var b = 2;
var count = 0;
while (a !== b) {
  count += 1;
  a = (a + b) / 2.0;
}
console.log(count);
```

Output: 53

Comparing that to keese, we generate a middle value 53 times and then
check the result.

```js
var keese = require('keese');
var low = keese();
var high = keese(low, null);
for (var i = 0; i < 53; i += 1) {
  high = keese(low, high);
}
console.log(high);
```

Output: "1000000002"

This takes up a few more bytes than a `Number`. However, unlike what happens
when you generate a middle value 53 times with a `Number`, we actually have
a usable value to compare.


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


Algorithmic Complexity
----------------------

The runtime performance of calling `keese` once is proportional to the size of the inputs.
Formally, the runtime of `keese(low, high)` is `O(low.length + high.length)`.

The size of the return value depends on the value of the input parameters.
Informally:
* initializing: `keese()` is `O(1)`
* increasing: `keese(low, null)` is `O(log(n))`
* decreasing: `keese(null, high)` is `O(n)` (probably could be improved)
* betweening: `keese(low, high)` is `O(n)`

Where `n` is how many times `keese` has been called to get the input value.

More formally, start with `var x = keese()`, run the below code,
then analyze the size of `x` in terms of `n`.

Increasing (`O(log(n))`):
```js
for (var i = 0; i < n; i++) {
  x = keese(x, null);
}
```

Decreasing (`O(n)` - probably could be improved):
```js
for (var i = 0; i < n; i++) {
  x = keese(null, x);
}
```

Betweening (`O(n)`):
```js
var y = keese(x, null); // or any other value
for (var i = 0; i < n; i++) {
  if (Math.random() > 0.5) {
    x = keese(x, y);
  } else {
    y = keese(x, y);
  }
}
```

I believe it is provable that betweening cannot do any better than `O(n)`:
* Each value returned from `keese(x, y)` could be assigned to either `x` or `y`.
* The next call to `keese(x, y)` must return a value that takes into account whether `x` or `y` was chosen in the previous step.
  Because of this, the return value effectively encodes the decision of whether `x` or `y` was chosen.
* This information is not lost on the next call to `keese(x, y)`.
  Therefore, a value obtained through the algorithm above must encode a complete history of each decision.
* Each of the `n` decisions must occupy up a minimum of 1 bit of space in the string, therefore the size of the string is `O(n)`.

