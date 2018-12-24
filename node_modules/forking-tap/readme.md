# forking-tap [![Build Status](https://travis-ci.org/jamestalmage/forking-tap.svg?branch=master)](https://travis-ci.org/jamestalmage/forking-tap) [![Coverage Status](https://coveralls.io/repos/jamestalmage/forking-tap/badge.svg?branch=master&service=github)](https://coveralls.io/github/jamestalmage/forking-tap?branch=master)

> Run every single tap test in its own process. 

`forking tap` takes a single tap-mocha test file:

```js
require('tap').mochaGlobals()
var foo = 'bar';

describe('foo', function () {
	function fooHelper() {}

	it('foo-1', function () {});

	it('foo-2', function () {});
});

describe('bar', function () {
	function barHelper() {}

	it('bar-1', function () {});
});
```

And splits it into multiple files with one test each:

```js
require('tap').mochaGlobals();
var foo = 'bar';

describe('foo', function () {
	function fooHelper() {}

	it('foo-1', function () {});
});
```

```js
require('tap').mochaGlobals();
var foo = 'bar';

describe('foo', function () {
	function fooHelper() {}

	it('foo-2', function () {});
});
```

```js
require('tap').mochaGlobals();
var foo = 'bar';

describe('bar', function () {
	function barHelper() {}

	it('bar-1', function () {});
});
```

Notice how all the appropriate helper functions and shared variables make it into each test. `tap` already forks and runs each file in a new process, so you just need to run the standard `tap` command and pass in the generated files.

## Install

```
$ npm install --save forking-tap
```


## Usage

```js
const forkingTap = require('forking-tap');

const results = forkingTap(fs.readFileSync('./all-the-tests.js', 'utf8'));

results.forEach((result, testNum) => {
  fs.writeFileSync('./test-number-' + testNum, result.code);
});
```

*Note: * `forking-tap` currently only provides a transform. It does not provide a means of reading in file(s) or writing the results to disk. That may change in the future. (Help wanted!) 


## API

### testList = forkingTap(source, [options])

Returns `testList` an array of `testResult` objects that represent the input `source` split into individual test files with one test per file.

#### source

Type: `string`

The original source code.

#### options

##### options.filename

Type: `string`  

The name of the file being split up. Required for source map support.

##### options.sourceMaps

Type: `boolean`  
Default: `true`

Forcefully turn off source map support by setting this to `false`. Otherwise, source map support is turned on if the `filename` option is present.

##### options.attachComment

Type: `boolean`  
Default: `false`

Automatically attach an inline source map comment to the end of the generated code.

### testResult

##### testResult.code

Type: `string`

The full source code for an individual test

##### testResult.map

Type: `object`

The source map descriptor object for the transform (or `undefined` if `filename` was not provided, or `options.sourceMaps === false`).

##### testResult.nestedName

Type: `Array.<string>`

A representation of the test name. The last element of the array will always be the string value passed to `it(str, fn)` test. The preceding elements of the array represent the names of any enclosing `describe` blocks.

For example, the following:

```js
describe('foo', function () {
  describe('bar', function () {
    it('baz', function () { /* ... */ });
  });
});
```

would produce a `nestedName` of`:

```js
['foo', 'bar', 'baz']
```

## License

MIT © [James Talmage](http://github.com/jamestalmage)
