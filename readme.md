node-keese
==========

Generator for ordered values, useful for use as sort keys.

Given any two values, keese can generate a value between them.
This would be trivial with numbers (`middle = (low + high) / 2`), except that numbers eventually run out of precision in JavaScript.
Instead of using `Number`, keese effectively encodes arbitrary-precision floating-point numbers as strings.
The values are comparable with the builtin operators (such as `<`), but most everything else about the string is unspecified.

```js
var keese = require('keese');
var something = keese();
var bigger = keese(something, null);
var smaller = keese(null, something);

var middle = keese(low, high);
```

Where:
* `low` and `high` must each either be `== null` or be the result of a previous call to `keese`.
* If both `low` and `high` are `!= null`, then `low` must be `< high`.
* If `low` is `!= null`, then `low` will be `< middle`.
* If `high` is `!= null`, then `middle` will be `< high`.
* `keese` is a [pure function](http://en.wikipedia.org/wiki/Pure_function).

Comparison of Number and keese strings:
---------------------------------------

This code snippet shows how many times you can obtain a middle value
using a JavaScript `Number` still get a meaningful result.

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
