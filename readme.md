node-keese
==========

Generator for ordered values, useful for use as sort keys.

Given any two values, keese can generate a value between them.
This would be trivial with numbers (`middle = (low + high) / 2`), except that numbers eventually run out of precision in JavaScript.
Instead of using `Number`, keese effectively encodes arbitrary-precision floating-point numbers as strings.
The values are comparable with the builtin operators (such as `<`), but most everything else about the string is unspecified.

```js
var keese = require('keese');
var middle = keese(low, high);
```

Where:
* `low` and `high` must each either be `== null` or be the result of a previous call to `keese`.
* If both `low` and `high` are `!= null`, then `low` must be `< high`.
* If `low` is `!= null`, then `low` will be `< middle`.
* If `high` is `!= null`, then `middle` will be `< high`.
* `keese` is a [pure function](http://en.wikipedia.org/wiki/Pure_function).


advanced api
------------

You can configure the alphabet of characters keese uses to encode numbers.
An alphabet such as `"01~"` is the smallest size possible, and will result in very long values returned from `keese`.
The larger the alphabet, the more compact the values.
The default alphabet is a balance between size and readability, similar to a base64 alphabet.

```js
var keese = require('keese');
keese = keese.configure(alphabet);
```

Where `alphabet` is a string of ascending character values of at least length 3.

