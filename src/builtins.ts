export const builtins = {
  abs: {
    documentation:
      "## `abs`\n\nThe builtin function `abs` is defined naively as: `if . < 0 then - . else . end`.\n\nFor numeric input, this is the absolute value.  See the\nsection on the identity filter for the implications of this\ndefinition for numeric input.\n\nTo compute the absolute value of a number as a floating point number, you may wish use `fabs`.\n\n- `jq map(abs)`\nInput: `[-10, -1.1, -1e-1]`\nOutput: `[10,1.1,1e-1]`\n\n",
  },
  length: {
    documentation:
      '## `length`\n\nThe builtin function `length` gets the length of various\ndifferent types of value:\n\n- The length of a **string** is the number of Unicode\n  codepoints it contains (which will be the same as its\n  JSON-encoded length in bytes if it\'s pure ASCII).\n\n- The length of a **number** is its absolute value.\n\n- The length of an **array** is the number of elements.\n\n- The length of an **object** is the number of key-value pairs.\n\n- The length of **null** is zero.\n\n- It is an error to use `length` on a **boolean**.\n\n- `jq .[] | length`\nInput: `[[1,2], "string", {"a":2}, null, -5]`\nOutput: `2,6,1,0,5`\n\n',
  },
  utf8bytelength: {
    documentation:
      '## `utf8bytelength`\n\nThe builtin function `utf8bytelength` outputs the number of\nbytes used to encode a string in UTF-8.\n\n- `jq utf8bytelength`\nInput: `"\\u03bc"`\nOutput: `2`\n\n',
  },
  keys: {
    documentation:
      '## `keys`, `keys_unsorted`\n\nThe builtin function `keys`, when given an object, returns\nits keys in an array.\n\nThe keys are sorted "alphabetically", by unicode codepoint\norder. This is not an order that makes particular sense in\nany particular language, but you can count on it being the\nsame for any two objects with the same set of keys,\nregardless of locale settings.\n\nWhen `keys` is given an array, it returns the valid indices\nfor that array: the integers from 0 to length-1.\n\nThe `keys_unsorted` function is just like `keys`, but if\nthe input is an object then the keys will not be sorted,\ninstead the keys will roughly be in insertion order.\n\n- `jq keys`\nInput: `{"abc": 1, "abcd": 2, "Foo": 3}`\nOutput: `["Foo", "abc", "abcd"]`\n\n- `jq keys`\nInput: `[42,3,35]`\nOutput: `[0,1,2]`\n\n',
  },
  keys_unsorted: {
    documentation:
      '## `keys`, `keys_unsorted`\n\nThe builtin function `keys`, when given an object, returns\nits keys in an array.\n\nThe keys are sorted "alphabetically", by unicode codepoint\norder. This is not an order that makes particular sense in\nany particular language, but you can count on it being the\nsame for any two objects with the same set of keys,\nregardless of locale settings.\n\nWhen `keys` is given an array, it returns the valid indices\nfor that array: the integers from 0 to length-1.\n\nThe `keys_unsorted` function is just like `keys`, but if\nthe input is an object then the keys will not be sorted,\ninstead the keys will roughly be in insertion order.\n\n- `jq keys`\nInput: `{"abc": 1, "abcd": 2, "Foo": 3}`\nOutput: `["Foo", "abc", "abcd"]`\n\n- `jq keys`\nInput: `[42,3,35]`\nOutput: `[0,1,2]`\n\n',
  },
  has: {
    documentation:
      '## `has(key)`\n\nThe builtin function `has` returns whether the input object\nhas the given key, or the input array has an element at the\ngiven index.\n\n`has($key)` has the same effect as checking whether `$key`\nis a member of the array returned by `keys`, although `has`\nwill be faster.\n\n- `jq map(has("foo"))`\nInput: `[{"foo": 42}, {}]`\nOutput: `[true, false]`\n\n- `jq map(has(2))`\nInput: `[[0,1], ["a","b","c"]]`\nOutput: `[false, true]`\n\n',
  },
  in: {
    documentation:
      '## `in`\n\nThe builtin function `in` returns whether or not the input key is in the\ngiven object, or the input index corresponds to an element\nin the given array. It is, essentially, an inversed version\nof `has`.\n\n- `jq .[] | in({"foo": 42})`\nInput: `["foo", "bar"]`\nOutput: `true,false`\n\n- `jq map(in([0,1]))`\nInput: `[2, 0]`\nOutput: `[false, true]`\n\n',
  },
  map: {
    documentation:
      '## `map(f)`, `map_values(f)`\n\nFor any filter `f`, `map(f)` and `map_values(f)` apply `f`\nto each of the values in the input array or object, that is,\nto the values of `.[]`.\n\nIn the absence of errors, `map(f)` always outputs an array\nwhereas `map_values(f)` outputs an array if given an array,\nor an object if given an object.\n\nWhen the input to `map_values(f)` is an object, the output\nobject has the same keys as the input object except for\nthose keys whose values when piped to `f` produce no values\nat all.\n\nThe key difference between `map(f)` and `map_values(f)` is\nthat the former simply forms an array from all the values of\n`($x|f)` for each value, `$x`, in the input array or object,\nbut `map_values(f)` only uses `first($x|f)`.\n\nSpecifically, for object inputs, `map_values(f)` constructs\nthe output object by examining in turn the value of\n`first(.[$k]|f)` for each key, `$k`, of the input.  If this\nexpression produces no values, then the corresponding key\nwill be dropped; otherwise, the output object will have that\nvalue at the key, `$k`.\n\nHere are some examples to clarify the behavior of `map` and\n`map_values` when applied to arrays. These examples assume the\ninput is `[1]` in all cases:\n\n    map(.+1)          #=>  [2]\n    map(., .)         #=>  [1,1]\n    map(empty)        #=>  []\n\n    map_values(.+1)   #=>  [2]\n    map_values(., .)  #=>  [1]\n    map_values(empty) #=>  []\n\n`map(f)` is equivalent to `[.[] | f]` and\n`map_values(f)` is equivalent to `.[] |= f`.\n\nIn fact, these are their implementations.\n\n- `jq map(.+1)`\nInput: `[1,2,3]`\nOutput: `[2,3,4]`\n\n- `jq map_values(.+1)`\nInput: `{"a": 1, "b": 2, "c": 3}`\nOutput: `{"a": 2, "b": 3, "c": 4}`\n\n- `jq map(., .)`\nInput: `[1,2]`\nOutput: `[1,1,2,2]`\n\n- `jq map_values(. // empty)`\nInput: `{"a": null, "b": true, "c": false}`\nOutput: `{"b":true}`\n\n',
  },
  map_values: {
    documentation:
      '## `map(f)`, `map_values(f)`\n\nFor any filter `f`, `map(f)` and `map_values(f)` apply `f`\nto each of the values in the input array or object, that is,\nto the values of `.[]`.\n\nIn the absence of errors, `map(f)` always outputs an array\nwhereas `map_values(f)` outputs an array if given an array,\nor an object if given an object.\n\nWhen the input to `map_values(f)` is an object, the output\nobject has the same keys as the input object except for\nthose keys whose values when piped to `f` produce no values\nat all.\n\nThe key difference between `map(f)` and `map_values(f)` is\nthat the former simply forms an array from all the values of\n`($x|f)` for each value, `$x`, in the input array or object,\nbut `map_values(f)` only uses `first($x|f)`.\n\nSpecifically, for object inputs, `map_values(f)` constructs\nthe output object by examining in turn the value of\n`first(.[$k]|f)` for each key, `$k`, of the input.  If this\nexpression produces no values, then the corresponding key\nwill be dropped; otherwise, the output object will have that\nvalue at the key, `$k`.\n\nHere are some examples to clarify the behavior of `map` and\n`map_values` when applied to arrays. These examples assume the\ninput is `[1]` in all cases:\n\n    map(.+1)          #=>  [2]\n    map(., .)         #=>  [1,1]\n    map(empty)        #=>  []\n\n    map_values(.+1)   #=>  [2]\n    map_values(., .)  #=>  [1]\n    map_values(empty) #=>  []\n\n`map(f)` is equivalent to `[.[] | f]` and\n`map_values(f)` is equivalent to `.[] |= f`.\n\nIn fact, these are their implementations.\n\n- `jq map(.+1)`\nInput: `[1,2,3]`\nOutput: `[2,3,4]`\n\n- `jq map_values(.+1)`\nInput: `{"a": 1, "b": 2, "c": 3}`\nOutput: `{"a": 2, "b": 3, "c": 4}`\n\n- `jq map(., .)`\nInput: `[1,2]`\nOutput: `[1,1,2,2]`\n\n- `jq map_values(. // empty)`\nInput: `{"a": null, "b": true, "c": false}`\nOutput: `{"b":true}`\n\n',
  },
  pick: {
    documentation:
      '## `pick(pathexps)`\n\nEmit the projection of the input object or array defined by the\nspecified sequence of path expressions, such that if `p` is any\none of these specifications, then `(. | p)` will evaluate to the\nsame value as `(. | pick(pathexps) | p)`. For arrays, negative\nindices and `.[m:n]` specifications should not be used.\n\n- `jq pick(.a, .b.c, .x)`\nInput: `{"a": 1, "b": {"c": 2, "d": 3}, "e": 4}`\nOutput: `{"a":1,"b":{"c":2},"x":null}`\n\n- `jq pick(.[2], .[0], .[0])`\nInput: `[1,2,3,4]`\nOutput: `[1,null,3]`\n\n',
  },
  path: {
    documentation:
      '## `path(path_expression)`\n\nOutputs array representations of the given path expression\nin `.`.  The outputs are arrays of strings (object keys)\nand/or numbers (array indices).\n\nPath expressions are jq expressions like `.a`, but also `.[]`.\nThere are two types of path expressions: ones that can match\nexactly, and ones that cannot.  For example, `.a.b.c` is an\nexact match path expression, while `.a[].b` is not.\n\n`path(exact_path_expression)` will produce the array\nrepresentation of the path expression even if it does not\nexist in `.`, if `.` is `null` or an array or an object.\n\n`path(pattern)` will produce array representations of the\npaths matching `pattern` if the paths exist in `.`.\n\nNote that the path expressions are not different from normal\nexpressions.  The expression\n`path(..|select(type=="boolean"))` outputs all the paths to\nboolean values in `.`, and only those paths.\n\n- `jq path(.a[0].b)`\nInput: `null`\nOutput: `["a",0,"b"]`\n\n- `jq [path(..)]`\nInput: `{"a":[{"b":1}]}`\nOutput: `[[],["a"],["a",0],["a",0,"b"]]`\n\n',
  },
  del: {
    documentation:
      '## `del(path_expression)`\n\nThe builtin function `del` removes a key and its corresponding\nvalue from an object.\n\n- `jq del(.foo)`\nInput: `{"foo": 42, "bar": 9001, "baz": 42}`\nOutput: `{"bar": 9001, "baz": 42}`\n\n- `jq del(.[1, 2])`\nInput: `["foo", "bar", "baz"]`\nOutput: `["foo"]`\n\n',
  },
  getpath: {
    documentation:
      '## `getpath(PATHS)`\n\nThe builtin function `getpath` outputs the values in `.` found\nat each path in `PATHS`.\n\n- `jq getpath(["a","b"])`\nInput: `null`\nOutput: `null`\n\n- `jq [getpath(["a","b"], ["a","c"])]`\nInput: `{"a":{"b":0, "c":1}}`\nOutput: `[0, 1]`\n\n',
  },
  setpath: {
    documentation:
      '## `setpath(PATHS; VALUE)`\n\nThe builtin function `setpath` sets the `PATHS` in `.` to `VALUE`.\n\n- `jq setpath(["a","b"]; 1)`\nInput: `null`\nOutput: `{"a": {"b": 1}}`\n\n- `jq setpath(["a","b"]; 1)`\nInput: `{"a":{"b":0}}`\nOutput: `{"a": {"b": 1}}`\n\n- `jq setpath([0,"a"]; 1)`\nInput: `null`\nOutput: `[{"a":1}]`\n\n',
  },
  delpaths: {
    documentation:
      '## `delpaths(PATHS)`\n\nThe builtin function `delpaths` deletes the `PATHS` in `.`.\n`PATHS` must be an array of paths, where each path is an array\nof strings and numbers.\n\n- `jq delpaths([["a","b"]])`\nInput: `{"a":{"b":1},"x":{"y":2}}`\nOutput: `{"a":{},"x":{"y":2}}`\n\n',
  },
  to_entries: {
    documentation:
      '## `to_entries`, `from_entries`, `with_entries(f)`\n\nThese functions convert between an object and an array of\nkey-value pairs. If `to_entries` is passed an object, then\nfor each `k: v` entry in the input, the output array\nincludes `{"key": k, "value": v}`.\n\n`from_entries` does the opposite conversion, and `with_entries(f)`\nis a shorthand for `to_entries | map(f) | from_entries`, useful for\ndoing some operation to all keys and values of an object.\n`from_entries` accepts `"key"`, `"Key"`, `"name"`, `"Name"`,\n`"value"`, and `"Value"` as keys.\n\n- `jq to_entries`\nInput: `{"a": 1, "b": 2}`\nOutput: `[{"key":"a", "value":1}, {"key":"b", "value":2}]`\n\n- `jq from_entries`\nInput: `[{"key":"a", "value":1}, {"key":"b", "value":2}]`\nOutput: `{"a": 1, "b": 2}`\n\n- `jq with_entries(.key |= "KEY_" + .)`\nInput: `{"a": 1, "b": 2}`\nOutput: `{"KEY_a": 1, "KEY_b": 2}`\n\n',
  },
  from_entries: {
    documentation:
      '## `to_entries`, `from_entries`, `with_entries(f)`\n\nThese functions convert between an object and an array of\nkey-value pairs. If `to_entries` is passed an object, then\nfor each `k: v` entry in the input, the output array\nincludes `{"key": k, "value": v}`.\n\n`from_entries` does the opposite conversion, and `with_entries(f)`\nis a shorthand for `to_entries | map(f) | from_entries`, useful for\ndoing some operation to all keys and values of an object.\n`from_entries` accepts `"key"`, `"Key"`, `"name"`, `"Name"`,\n`"value"`, and `"Value"` as keys.\n\n- `jq to_entries`\nInput: `{"a": 1, "b": 2}`\nOutput: `[{"key":"a", "value":1}, {"key":"b", "value":2}]`\n\n- `jq from_entries`\nInput: `[{"key":"a", "value":1}, {"key":"b", "value":2}]`\nOutput: `{"a": 1, "b": 2}`\n\n- `jq with_entries(.key |= "KEY_" + .)`\nInput: `{"a": 1, "b": 2}`\nOutput: `{"KEY_a": 1, "KEY_b": 2}`\n\n',
  },
  with_entries: {
    documentation:
      '## `to_entries`, `from_entries`, `with_entries(f)`\n\nThese functions convert between an object and an array of\nkey-value pairs. If `to_entries` is passed an object, then\nfor each `k: v` entry in the input, the output array\nincludes `{"key": k, "value": v}`.\n\n`from_entries` does the opposite conversion, and `with_entries(f)`\nis a shorthand for `to_entries | map(f) | from_entries`, useful for\ndoing some operation to all keys and values of an object.\n`from_entries` accepts `"key"`, `"Key"`, `"name"`, `"Name"`,\n`"value"`, and `"Value"` as keys.\n\n- `jq to_entries`\nInput: `{"a": 1, "b": 2}`\nOutput: `[{"key":"a", "value":1}, {"key":"b", "value":2}]`\n\n- `jq from_entries`\nInput: `[{"key":"a", "value":1}, {"key":"b", "value":2}]`\nOutput: `{"a": 1, "b": 2}`\n\n- `jq with_entries(.key |= "KEY_" + .)`\nInput: `{"a": 1, "b": 2}`\nOutput: `{"KEY_a": 1, "KEY_b": 2}`\n\n',
  },
  select: {
    documentation:
      '## `select(boolean_expression)`\n\nThe function `select(f)` produces its input unchanged if\n`f` returns true for that input, and produces no output\notherwise.\n\nIt\'s useful for filtering lists: `[1,2,3] | map(select(. >= 2))`\nwill give you `[2,3]`.\n\n- `jq map(select(. >= 2))`\nInput: `[1,5,3,0,7]`\nOutput: `[5,3,7]`\n\n- `jq .[] | select(.id == "second")`\nInput: `[{"id": "first", "val": 1}, {"id": "second", "val": 2}]`\nOutput: `{"id": "second", "val": 2}`\n\n',
  },
  arrays: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  objects: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  iterables: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  booleans: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  numbers: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  normals: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  finites: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  strings: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  nulls: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  values: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  scalars: {
    documentation:
      '## `arrays`, `objects`, `iterables`, `booleans`, `numbers`, `normals`, `finites`, `strings`, `nulls`, `values`, `scalars`\n\nThese built-ins select only inputs that are arrays, objects,\niterables (arrays or objects), booleans, numbers, normal\nnumbers, finite numbers, strings, null, non-null values, and\nnon-iterables, respectively.\n\n- `jq .[]|numbers`\nInput: `[[],{},1,"foo",null,true,false]`\nOutput: `1`\n\n',
  },
  empty: {
    documentation:
      "## `empty`\n\n`empty` returns no results. None at all. Not even `null`.\n\nIt's useful on occasion. You'll know if you need it :)\n\n- `jq 1, empty, 2`\nInput: `null`\nOutput: `1,2`\n\n- `jq [1,2,empty,3]`\nInput: `null`\nOutput: `[1,2,3]`\n\n",
  },
  error: {
    documentation:
      '## `error`, `error(message)`\n\nProduces an error with the input value, or with the message\ngiven as the argument. Errors can be caught with try/catch;\nsee below.\n\n- `jq try error catch .`\nInput: `"error message"`\nOutput: `"error message"`\n\n- `jq try error("invalid value: \\(.)") catch .`\nInput: `42`\nOutput: `"invalid value: 42"`\n\n',
  },
  halt: {
    documentation:
      "## `halt`\n\nStops the jq program with no further outputs.  jq will exit\nwith exit status `0`.\n\n",
  },
  halt_error: {
    documentation:
      '## `halt_error`, `halt_error(exit_code)`\n\nStops the jq program with no further outputs.  The input will\nbe printed on `stderr` as raw output (i.e., strings will not\nhave double quotes) with no decoration, not even a newline.\n\nThe given `exit_code` (defaulting to `5`) will be jq\'s exit\nstatus.\n\nFor example, `"Error: something went wrong\\n"|halt_error(1)`.\n\n',
  },
  paths: {
    documentation:
      '## `paths`, `paths(node_filter)`\n\n`paths` outputs the paths to all the elements in its input\n(except it does not output the empty list, representing .\nitself).\n\n`paths(f)` outputs the paths to any values for which `f` is `true`.\nThat is, `paths(type == "number")` outputs the paths to all numeric\nvalues.\n\n- `jq [paths]`\nInput: `[1,[[],{"a":2}]]`\nOutput: `[[0],[1],[1,0],[1,1],[1,1,"a"]]`\n\n- `jq [paths(type == "number")]`\nInput: `[1,[[],{"a":2}]]`\nOutput: `[[0],[1,1,"a"]]`\n\n',
  },
  add: {
    documentation:
      '## `add`, `add(generator)`\n\nThe filter `add` takes as input an array, and produces as\noutput the elements of the array added together. This might\nmean summed, concatenated or merged depending on the types\nof the elements of the input array - the rules are the same\nas those for the `+` operator (described above).\n\nIf the input is an empty array, `add` returns `null`.\n\n`add(generator)` operates on the given generator rather than\nthe input.\n\n- `jq add`\nInput: `["a","b","c"]`\nOutput: `"abc"`\n\n- `jq add`\nInput: `[1, 2, 3]`\nOutput: `6`\n\n- `jq add`\nInput: `[]`\nOutput: `null`\n\n- `jq add(.[].a)`\nInput: `[{"a":3}, {"a":5}, {"b":6}]`\nOutput: `8`\n\n',
  },
  any: {
    documentation:
      "## `any`, `any(condition)`, `any(generator; condition)`\n\nThe filter `any` takes as input an array of boolean values,\nand produces `true` as output if any of the elements of\nthe array are `true`.\n\nIf the input is an empty array, `any` returns `false`.\n\nThe `any(condition)` form applies the given condition to the\nelements of the input array.\n\nThe `any(generator; condition)` form applies the given\ncondition to all the outputs of the given generator.\n\n- `jq any`\nInput: `[true, false]`\nOutput: `true`\n\n- `jq any`\nInput: `[false, false]`\nOutput: `false`\n\n- `jq any`\nInput: `[]`\nOutput: `false`\n\n",
  },
  all: {
    documentation:
      "## `all`, `all(condition)`, `all(generator; condition)`\n\nThe filter `all` takes as input an array of boolean values,\nand produces `true` as output if all of the elements of\nthe array are `true`.\n\nThe `all(condition)` form applies the given condition to the\nelements of the input array.\n\nThe `all(generator; condition)` form applies the given\ncondition to all the outputs of the given generator.\n\nIf the input is an empty array, `all` returns `true`.\n\n- `jq all`\nInput: `[true, false]`\nOutput: `false`\n\n- `jq all`\nInput: `[true, true]`\nOutput: `true`\n\n- `jq all`\nInput: `[]`\nOutput: `true`\n\n",
  },
  flatten: {
    documentation:
      '## `flatten`, `flatten(depth)`\n\nThe filter `flatten` takes as input an array of nested arrays,\nand produces a flat array in which all arrays inside the original\narray have been recursively replaced by their values. You can pass\nan argument to it to specify how many levels of nesting to flatten.\n\n`flatten(2)` is like `flatten`, but going only up to two\nlevels deep.\n\n- `jq flatten`\nInput: `[1, [2], [[3]]]`\nOutput: `[1, 2, 3]`\n\n- `jq flatten(1)`\nInput: `[1, [2], [[3]]]`\nOutput: `[1, 2, [3]]`\n\n- `jq flatten`\nInput: `[[]]`\nOutput: `[]`\n\n- `jq flatten`\nInput: `[{"foo": "bar"}, [{"foo": "baz"}]]`\nOutput: `[{"foo": "bar"}, {"foo": "baz"}]`\n\n',
  },
  range: {
    documentation:
      "## `range(upto)`, `range(from; upto)`, `range(from; upto; by)`\n\nThe `range` function produces a range of numbers. `range(4; 10)`\nproduces 6 numbers, from 4 (inclusive) to 10 (exclusive). The numbers\nare produced as separate outputs. Use `[range(4; 10)]` to get a range as\nan array.\n\nThe one argument form generates numbers from 0 to the given\nnumber, with an increment of 1.\n\nThe two argument form generates numbers from `from` to `upto`\nwith an increment of 1.\n\nThe three argument form generates numbers `from` to `upto`\nwith an increment of `by`.\n\n- `jq range(2; 4)`\nInput: `null`\nOutput: `2,3`\n\n- `jq [range(2; 4)]`\nInput: `null`\nOutput: `[2,3]`\n\n- `jq [range(4)]`\nInput: `null`\nOutput: `[0,1,2,3]`\n\n- `jq [range(0; 10; 3)]`\nInput: `null`\nOutput: `[0,3,6,9]`\n\n- `jq [range(0; 10; -1)]`\nInput: `null`\nOutput: `[]`\n\n- `jq [range(0; -5; -1)]`\nInput: `null`\nOutput: `[0,-1,-2,-3,-4]`\n\n",
  },
  floor: {
    documentation:
      "## `floor`\n\nThe `floor` function returns the floor of its numeric input.\n\n- `jq floor`\nInput: `3.14159`\nOutput: `3`\n\n",
  },
  sqrt: {
    documentation:
      "## `sqrt`\n\nThe `sqrt` function returns the square root of its numeric input.\n\n- `jq sqrt`\nInput: `9`\nOutput: `3`\n\n",
  },
  tonumber: {
    documentation:
      '## `tonumber`\n\nThe `tonumber` function parses its input as a number. It\nwill convert correctly-formatted strings to their numeric\nequivalent, leave numbers alone, and give an error on all other input.\n\n- `jq .[] | tonumber`\nInput: `[1, "1"]`\nOutput: `1,1`\n\n',
  },
  toboolean: {
    documentation:
      '## `toboolean`\n\nThe `toboolean` function parses its input as a boolean. It\nwill convert correctly-formatted strings to their boolean\nequivalent, leave booleans alone, and give an error on all other input.\n\n- `jq .[] | toboolean`\nInput: `["true", "false", true, false]`\nOutput: `true,false,true,false`\n\n',
  },
  tostring: {
    documentation:
      '## `tostring`\n\nThe `tostring` function prints its input as a\nstring. Strings are left unchanged, and all other values are\nJSON-encoded.\n\n- `jq .[] | tostring`\nInput: `[1, "1", [1]]`\nOutput: `"1","1","[1]"`\n\n',
  },
  type: {
    documentation:
      '## `type`\n\nThe `type` function returns the type of its argument as a\nstring, which is one of null, boolean, number, string, array\nor object.\n\n- `jq map(type)`\nInput: `[0, false, [], {}, null, "hello"]`\nOutput: `["number", "boolean", "array", "object", "null", "string"]`\n\n',
  },
  infinite: {
    documentation:
      '## `infinite`, `nan`, `isinfinite`, `isnan`, `isfinite`, `isnormal`\n\nSome arithmetic operations can yield infinities and "not a\nnumber" (NaN) values.  The `isinfinite` builtin returns `true`\nif its input is infinite.  The `isnan` builtin returns `true`\nif its input is a NaN.  The `infinite` builtin returns a\npositive infinite value.  The `nan` builtin returns a NaN.\nThe `isnormal` builtin returns true if its input is a normal\nnumber.\n\nNote that division by zero raises an error.\n\nCurrently most arithmetic operations operating on infinities,\nNaNs, and sub-normals do not raise errors.\n\n- `jq .[] | (infinite * .) < 0`\nInput: `[-1, 1]`\nOutput: `true,false`\n\n- `jq infinite, nan | type`\nInput: `null`\nOutput: `"number","number"`\n\n',
  },
  nan: {
    documentation:
      '## `infinite`, `nan`, `isinfinite`, `isnan`, `isfinite`, `isnormal`\n\nSome arithmetic operations can yield infinities and "not a\nnumber" (NaN) values.  The `isinfinite` builtin returns `true`\nif its input is infinite.  The `isnan` builtin returns `true`\nif its input is a NaN.  The `infinite` builtin returns a\npositive infinite value.  The `nan` builtin returns a NaN.\nThe `isnormal` builtin returns true if its input is a normal\nnumber.\n\nNote that division by zero raises an error.\n\nCurrently most arithmetic operations operating on infinities,\nNaNs, and sub-normals do not raise errors.\n\n- `jq .[] | (infinite * .) < 0`\nInput: `[-1, 1]`\nOutput: `true,false`\n\n- `jq infinite, nan | type`\nInput: `null`\nOutput: `"number","number"`\n\n',
  },
  isinfinite: {
    documentation:
      '## `infinite`, `nan`, `isinfinite`, `isnan`, `isfinite`, `isnormal`\n\nSome arithmetic operations can yield infinities and "not a\nnumber" (NaN) values.  The `isinfinite` builtin returns `true`\nif its input is infinite.  The `isnan` builtin returns `true`\nif its input is a NaN.  The `infinite` builtin returns a\npositive infinite value.  The `nan` builtin returns a NaN.\nThe `isnormal` builtin returns true if its input is a normal\nnumber.\n\nNote that division by zero raises an error.\n\nCurrently most arithmetic operations operating on infinities,\nNaNs, and sub-normals do not raise errors.\n\n- `jq .[] | (infinite * .) < 0`\nInput: `[-1, 1]`\nOutput: `true,false`\n\n- `jq infinite, nan | type`\nInput: `null`\nOutput: `"number","number"`\n\n',
  },
  isnan: {
    documentation:
      '## `infinite`, `nan`, `isinfinite`, `isnan`, `isfinite`, `isnormal`\n\nSome arithmetic operations can yield infinities and "not a\nnumber" (NaN) values.  The `isinfinite` builtin returns `true`\nif its input is infinite.  The `isnan` builtin returns `true`\nif its input is a NaN.  The `infinite` builtin returns a\npositive infinite value.  The `nan` builtin returns a NaN.\nThe `isnormal` builtin returns true if its input is a normal\nnumber.\n\nNote that division by zero raises an error.\n\nCurrently most arithmetic operations operating on infinities,\nNaNs, and sub-normals do not raise errors.\n\n- `jq .[] | (infinite * .) < 0`\nInput: `[-1, 1]`\nOutput: `true,false`\n\n- `jq infinite, nan | type`\nInput: `null`\nOutput: `"number","number"`\n\n',
  },
  isfinite: {
    documentation:
      '## `infinite`, `nan`, `isinfinite`, `isnan`, `isfinite`, `isnormal`\n\nSome arithmetic operations can yield infinities and "not a\nnumber" (NaN) values.  The `isinfinite` builtin returns `true`\nif its input is infinite.  The `isnan` builtin returns `true`\nif its input is a NaN.  The `infinite` builtin returns a\npositive infinite value.  The `nan` builtin returns a NaN.\nThe `isnormal` builtin returns true if its input is a normal\nnumber.\n\nNote that division by zero raises an error.\n\nCurrently most arithmetic operations operating on infinities,\nNaNs, and sub-normals do not raise errors.\n\n- `jq .[] | (infinite * .) < 0`\nInput: `[-1, 1]`\nOutput: `true,false`\n\n- `jq infinite, nan | type`\nInput: `null`\nOutput: `"number","number"`\n\n',
  },
  isnormal: {
    documentation:
      '## `infinite`, `nan`, `isinfinite`, `isnan`, `isfinite`, `isnormal`\n\nSome arithmetic operations can yield infinities and "not a\nnumber" (NaN) values.  The `isinfinite` builtin returns `true`\nif its input is infinite.  The `isnan` builtin returns `true`\nif its input is a NaN.  The `infinite` builtin returns a\npositive infinite value.  The `nan` builtin returns a NaN.\nThe `isnormal` builtin returns true if its input is a normal\nnumber.\n\nNote that division by zero raises an error.\n\nCurrently most arithmetic operations operating on infinities,\nNaNs, and sub-normals do not raise errors.\n\n- `jq .[] | (infinite * .) < 0`\nInput: `[-1, 1]`\nOutput: `true,false`\n\n- `jq infinite, nan | type`\nInput: `null`\nOutput: `"number","number"`\n\n',
  },
  sort: {
    documentation:
      '## `sort`, `sort_by(path_expression)`\n\nThe `sort` functions sorts its input, which must be an\narray. Values are sorted in the following order:\n\n* `null`\n* `false`\n* `true`\n* numbers\n* strings, in alphabetical order (by unicode codepoint value)\n* arrays, in lexical order\n* objects\n\nThe ordering for objects is a little complex: first they\'re\ncompared by comparing their sets of keys (as arrays in\nsorted order), and if their keys are equal then the values\nare compared key by key.\n\n`sort_by` may be used to sort by a particular field of an\nobject, or by applying any jq filter. `sort_by(f)` compares\ntwo elements by comparing the result of `f` on each element.\nWhen `f` produces multiple values, it firstly compares the\nfirst values, and the second values if the first values are\nequal, and so on.\n\n- `jq sort`\nInput: `[8,3,null,6]`\nOutput: `[null,3,6,8]`\n\n- `jq sort_by(.foo)`\nInput: `[{"foo":4, "bar":10}, {"foo":3, "bar":10}, {"foo":2, "bar":1}]`\nOutput: `[{"foo":2, "bar":1}, {"foo":3, "bar":10}, {"foo":4, "bar":10}]`\n\n- `jq sort_by(.foo, .bar)`\nInput: `[{"foo":4, "bar":10}, {"foo":3, "bar":20}, {"foo":2, "bar":1}, {"foo":3, "bar":10}]`\nOutput: `[{"foo":2, "bar":1}, {"foo":3, "bar":10}, {"foo":3, "bar":20}, {"foo":4, "bar":10}]`\n\n',
  },
  sort_by: {
    documentation:
      '## `sort`, `sort_by(path_expression)`\n\nThe `sort` functions sorts its input, which must be an\narray. Values are sorted in the following order:\n\n* `null`\n* `false`\n* `true`\n* numbers\n* strings, in alphabetical order (by unicode codepoint value)\n* arrays, in lexical order\n* objects\n\nThe ordering for objects is a little complex: first they\'re\ncompared by comparing their sets of keys (as arrays in\nsorted order), and if their keys are equal then the values\nare compared key by key.\n\n`sort_by` may be used to sort by a particular field of an\nobject, or by applying any jq filter. `sort_by(f)` compares\ntwo elements by comparing the result of `f` on each element.\nWhen `f` produces multiple values, it firstly compares the\nfirst values, and the second values if the first values are\nequal, and so on.\n\n- `jq sort`\nInput: `[8,3,null,6]`\nOutput: `[null,3,6,8]`\n\n- `jq sort_by(.foo)`\nInput: `[{"foo":4, "bar":10}, {"foo":3, "bar":10}, {"foo":2, "bar":1}]`\nOutput: `[{"foo":2, "bar":1}, {"foo":3, "bar":10}, {"foo":4, "bar":10}]`\n\n- `jq sort_by(.foo, .bar)`\nInput: `[{"foo":4, "bar":10}, {"foo":3, "bar":20}, {"foo":2, "bar":1}, {"foo":3, "bar":10}]`\nOutput: `[{"foo":2, "bar":1}, {"foo":3, "bar":10}, {"foo":3, "bar":20}, {"foo":4, "bar":10}]`\n\n',
  },
  group_by: {
    documentation:
      '## `group_by(path_expression)`\n\n`group_by(.foo)` takes as input an array, groups the\nelements having the same `.foo` field into separate arrays,\nand produces all of these arrays as elements of a larger\narray, sorted by the value of the `.foo` field.\n\nAny jq expression, not just a field access, may be used in\nplace of `.foo`. The sorting order is the same as described\nin the `sort` function above.\n\n- `jq group_by(.foo)`\nInput: `[{"foo":1, "bar":10}, {"foo":3, "bar":100}, {"foo":1, "bar":1}]`\nOutput: `[[{"foo":1, "bar":10}, {"foo":1, "bar":1}], [{"foo":3, "bar":100}]]`\n\n',
  },
  min: {
    documentation:
      '## `min`, `max`, `min_by(path_exp)`, `max_by(path_exp)`\n\nFind the minimum or maximum element of the input array.\n\nThe `min_by(path_exp)` and `max_by(path_exp)` functions allow\nyou to specify a particular field or property to examine, e.g.\n`min_by(.foo)` finds the object with the smallest `foo` field.\n\n- `jq min`\nInput: `[5,4,2,7]`\nOutput: `2`\n\n- `jq max_by(.foo)`\nInput: `[{"foo":1, "bar":14}, {"foo":2, "bar":3}]`\nOutput: `{"foo":2, "bar":3}`\n\n',
  },
  max: {
    documentation:
      '## `min`, `max`, `min_by(path_exp)`, `max_by(path_exp)`\n\nFind the minimum or maximum element of the input array.\n\nThe `min_by(path_exp)` and `max_by(path_exp)` functions allow\nyou to specify a particular field or property to examine, e.g.\n`min_by(.foo)` finds the object with the smallest `foo` field.\n\n- `jq min`\nInput: `[5,4,2,7]`\nOutput: `2`\n\n- `jq max_by(.foo)`\nInput: `[{"foo":1, "bar":14}, {"foo":2, "bar":3}]`\nOutput: `{"foo":2, "bar":3}`\n\n',
  },
  min_by: {
    documentation:
      '## `min`, `max`, `min_by(path_exp)`, `max_by(path_exp)`\n\nFind the minimum or maximum element of the input array.\n\nThe `min_by(path_exp)` and `max_by(path_exp)` functions allow\nyou to specify a particular field or property to examine, e.g.\n`min_by(.foo)` finds the object with the smallest `foo` field.\n\n- `jq min`\nInput: `[5,4,2,7]`\nOutput: `2`\n\n- `jq max_by(.foo)`\nInput: `[{"foo":1, "bar":14}, {"foo":2, "bar":3}]`\nOutput: `{"foo":2, "bar":3}`\n\n',
  },
  max_by: {
    documentation:
      '## `min`, `max`, `min_by(path_exp)`, `max_by(path_exp)`\n\nFind the minimum or maximum element of the input array.\n\nThe `min_by(path_exp)` and `max_by(path_exp)` functions allow\nyou to specify a particular field or property to examine, e.g.\n`min_by(.foo)` finds the object with the smallest `foo` field.\n\n- `jq min`\nInput: `[5,4,2,7]`\nOutput: `2`\n\n- `jq max_by(.foo)`\nInput: `[{"foo":1, "bar":14}, {"foo":2, "bar":3}]`\nOutput: `{"foo":2, "bar":3}`\n\n',
  },
  unique: {
    documentation:
      '## `unique`, `unique_by(path_exp)`\n\nThe `unique` function takes as input an array and produces\nan array of the same elements, in sorted order, with\nduplicates removed.\n\nThe `unique_by(path_exp)` function will keep only one element\nfor each value obtained by applying the argument. Think of it\nas making an array by taking one element out of every group\nproduced by `group`.\n\n- `jq unique`\nInput: `[1,2,5,3,5,3,1,3]`\nOutput: `[1,2,3,5]`\n\n- `jq unique_by(.foo)`\nInput: `[{"foo": 1, "bar": 2}, {"foo": 1, "bar": 3}, {"foo": 4, "bar": 5}]`\nOutput: `[{"foo": 1, "bar": 2}, {"foo": 4, "bar": 5}]`\n\n- `jq unique_by(length)`\nInput: `["chunky", "bacon", "kitten", "cicada", "asparagus"]`\nOutput: `["bacon", "chunky", "asparagus"]`\n\n',
  },
  unique_by: {
    documentation:
      '## `unique`, `unique_by(path_exp)`\n\nThe `unique` function takes as input an array and produces\nan array of the same elements, in sorted order, with\nduplicates removed.\n\nThe `unique_by(path_exp)` function will keep only one element\nfor each value obtained by applying the argument. Think of it\nas making an array by taking one element out of every group\nproduced by `group`.\n\n- `jq unique`\nInput: `[1,2,5,3,5,3,1,3]`\nOutput: `[1,2,3,5]`\n\n- `jq unique_by(.foo)`\nInput: `[{"foo": 1, "bar": 2}, {"foo": 1, "bar": 3}, {"foo": 4, "bar": 5}]`\nOutput: `[{"foo": 1, "bar": 2}, {"foo": 4, "bar": 5}]`\n\n- `jq unique_by(length)`\nInput: `["chunky", "bacon", "kitten", "cicada", "asparagus"]`\nOutput: `["bacon", "chunky", "asparagus"]`\n\n',
  },
  reverse: {
    documentation:
      "## `reverse`\n\nThis function reverses an array.\n\n- `jq reverse`\nInput: `[1,2,3,4]`\nOutput: `[4,3,2,1]`\n\n",
  },
  contains: {
    documentation:
      '## `contains(element)`\n\nThe filter `contains(b)` will produce true if b is\ncompletely contained within the input. A string B is\ncontained in a string A if B is a substring of A. An array B\nis contained in an array A if all elements in B are\ncontained in any element in A. An object B is contained in\nobject A if all of the values in B are contained in the\nvalue in A with the same key. All other types are assumed to\nbe contained in each other if they are equal.\n\n- `jq contains("bar")`\nInput: `"foobar"`\nOutput: `true`\n\n- `jq contains(["baz", "bar"])`\nInput: `["foobar", "foobaz", "blarp"]`\nOutput: `true`\n\n- `jq contains(["bazzzzz", "bar"])`\nInput: `["foobar", "foobaz", "blarp"]`\nOutput: `false`\n\n- `jq contains({foo: 12, bar: [{barp: 12}]})`\nInput: `{"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]}`\nOutput: `true`\n\n- `jq contains({foo: 12, bar: [{barp: 15}]})`\nInput: `{"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]}`\nOutput: `false`\n\n',
  },
  indices: {
    documentation:
      '## `indices(s)`\n\nOutputs an array containing the indices in `.` where `s`\noccurs.  The input may be an array, in which case if `s` is an\narray then the indices output will be those where all elements\nin `.` match those of `s`.\n\n- `jq indices(", ")`\nInput: `"a,b, cd, efg, hijk"`\nOutput: `[3,7,12]`\n\n- `jq indices(1)`\nInput: `[0,1,2,1,3,1,4]`\nOutput: `[1,3,5]`\n\n- `jq indices([1,2])`\nInput: `[0,1,2,3,1,4,2,5,1,2,6,7]`\nOutput: `[1,8]`\n\n',
  },
  index: {
    documentation:
      '## `index(s)`, `rindex(s)`\n\nOutputs the index of the first (`index`) or last (`rindex`)\noccurrence of `s` in the input.\n\n- `jq index(", ")`\nInput: `"a,b, cd, efg, hijk"`\nOutput: `3`\n\n- `jq index(1)`\nInput: `[0,1,2,1,3,1,4]`\nOutput: `1`\n\n- `jq index([1,2])`\nInput: `[0,1,2,3,1,4,2,5,1,2,6,7]`\nOutput: `1`\n\n- `jq rindex(", ")`\nInput: `"a,b, cd, efg, hijk"`\nOutput: `12`\n\n- `jq rindex(1)`\nInput: `[0,1,2,1,3,1,4]`\nOutput: `5`\n\n- `jq rindex([1,2])`\nInput: `[0,1,2,3,1,4,2,5,1,2,6,7]`\nOutput: `8`\n\n',
  },
  rindex: {
    documentation:
      '## `index(s)`, `rindex(s)`\n\nOutputs the index of the first (`index`) or last (`rindex`)\noccurrence of `s` in the input.\n\n- `jq index(", ")`\nInput: `"a,b, cd, efg, hijk"`\nOutput: `3`\n\n- `jq index(1)`\nInput: `[0,1,2,1,3,1,4]`\nOutput: `1`\n\n- `jq index([1,2])`\nInput: `[0,1,2,3,1,4,2,5,1,2,6,7]`\nOutput: `1`\n\n- `jq rindex(", ")`\nInput: `"a,b, cd, efg, hijk"`\nOutput: `12`\n\n- `jq rindex(1)`\nInput: `[0,1,2,1,3,1,4]`\nOutput: `5`\n\n- `jq rindex([1,2])`\nInput: `[0,1,2,3,1,4,2,5,1,2,6,7]`\nOutput: `8`\n\n',
  },
  inside: {
    documentation:
      '## `inside`\n\nThe filter `inside(b)` will produce true if the input is\ncompletely contained within b. It is, essentially, an\ninversed version of `contains`.\n\n- `jq inside("foobar")`\nInput: `"bar"`\nOutput: `true`\n\n- `jq inside(["foobar", "foobaz", "blarp"])`\nInput: `["baz", "bar"]`\nOutput: `true`\n\n- `jq inside(["foobar", "foobaz", "blarp"])`\nInput: `["bazzzzz", "bar"]`\nOutput: `false`\n\n- `jq inside({"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]})`\nInput: `{"foo": 12, "bar": [{"barp": 12}]}`\nOutput: `true`\n\n- `jq inside({"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]})`\nInput: `{"foo": 12, "bar": [{"barp": 15}]}`\nOutput: `false`\n\n',
  },
  startswith: {
    documentation:
      '## `startswith(str)`\n\nOutputs `true` if . starts with the given string argument.\n\n- `jq [.[]|startswith("foo")]`\nInput: `["fo", "foo", "barfoo", "foobar", "barfoob"]`\nOutput: `[false, true, false, true, false]`\n\n',
  },
  endswith: {
    documentation:
      '## `endswith(str)`\n\nOutputs `true` if . ends with the given string argument.\n\n- `jq [.[]|endswith("foo")]`\nInput: `["foobar", "barfoo"]`\nOutput: `[false, true]`\n\n',
  },
  combinations: {
    documentation:
      "## `combinations`, `combinations(n)`\n\nOutputs all combinations of the elements of the arrays in the\ninput array. If given an argument `n`, it outputs all combinations\nof `n` repetitions of the input array.\n\n- `jq combinations`\nInput: `[[1,2], [3, 4]]`\nOutput: `[1, 3],[1, 4],[2, 3],[2, 4]`\n\n- `jq combinations(2)`\nInput: `[0, 1]`\nOutput: `[0, 0],[0, 1],[1, 0],[1, 1]`\n\n",
  },
  ltrimstr: {
    documentation:
      '## `ltrimstr(str)`\n\nOutputs its input with the given prefix string removed, if it\nstarts with it.\n\n- `jq [.[]|ltrimstr("foo")]`\nInput: `["fo", "foo", "barfoo", "foobar", "afoo"]`\nOutput: `["fo","","barfoo","bar","afoo"]`\n\n',
  },
  rtrimstr: {
    documentation:
      '## `rtrimstr(str)`\n\nOutputs its input with the given suffix string removed, if it\nends with it.\n\n- `jq [.[]|rtrimstr("foo")]`\nInput: `["fo", "foo", "barfoo", "foobar", "foob"]`\nOutput: `["fo","","bar","foobar","foob"]`\n\n',
  },
  trimstr: {
    documentation:
      '## `trimstr(str)`\n\nOutputs its input with the given string removed at both ends, if it\nstarts or ends with it.\n\n- `jq [.[]|trimstr("foo")]`\nInput: `["fo", "foo", "barfoo", "foobarfoo", "foob"]`\nOutput: `["fo","","bar","bar","b"]`\n\n',
  },
  trim: {
    documentation:
      '## `trim`, `ltrim`, `rtrim`\n\n`trim` trims both leading and trailing whitespace.\n\n`ltrim` trims only leading (left side) whitespace.\n\n`rtrim` trims only trailing (right side) whitespace.\n\nWhitespace characters are the usual `" "`, `"\\n"` `"\\t"`, `"\\r"`\nand also all characters in the Unicode character database with the\nwhitespace property. Note that what considers whitespace might\nchange in the future.\n\n- `jq trim, ltrim, rtrim`\nInput: `" abc "`\nOutput: `"abc","abc "," abc"`\n\n',
  },
  ltrim: {
    documentation:
      '## `trim`, `ltrim`, `rtrim`\n\n`trim` trims both leading and trailing whitespace.\n\n`ltrim` trims only leading (left side) whitespace.\n\n`rtrim` trims only trailing (right side) whitespace.\n\nWhitespace characters are the usual `" "`, `"\\n"` `"\\t"`, `"\\r"`\nand also all characters in the Unicode character database with the\nwhitespace property. Note that what considers whitespace might\nchange in the future.\n\n- `jq trim, ltrim, rtrim`\nInput: `" abc "`\nOutput: `"abc","abc "," abc"`\n\n',
  },
  rtrim: {
    documentation:
      '## `trim`, `ltrim`, `rtrim`\n\n`trim` trims both leading and trailing whitespace.\n\n`ltrim` trims only leading (left side) whitespace.\n\n`rtrim` trims only trailing (right side) whitespace.\n\nWhitespace characters are the usual `" "`, `"\\n"` `"\\t"`, `"\\r"`\nand also all characters in the Unicode character database with the\nwhitespace property. Note that what considers whitespace might\nchange in the future.\n\n- `jq trim, ltrim, rtrim`\nInput: `" abc "`\nOutput: `"abc","abc "," abc"`\n\n',
  },
  explode: {
    documentation:
      '## `explode`\n\nConverts an input string into an array of the string\'s\ncodepoint numbers.\n\n- `jq explode`\nInput: `"foobar"`\nOutput: `[102,111,111,98,97,114]`\n\n',
  },
  implode: {
    documentation:
      '## `implode`\n\nThe inverse of explode.\n\n- `jq implode`\nInput: `[65, 66, 67]`\nOutput: `"ABC"`\n\n',
  },
  split: {
    documentation:
      '## `split(regex; flags)`\n\nSplits an input string on each regex match.\n\nFor backwards compatibility, when called with a single argument,\n`split` splits on a string, not a regex.\n\n- `jq split(", *"; null)`\nInput: `"ab,cd, ef"`\nOutput: `["ab","cd","ef"]`\n\n',
  },
  join: {
    documentation:
      '## `join(str)`\n\nJoins the array of elements given as input, using the\nargument as separator. It is the inverse of `split`: that is,\nrunning `split("foo") | join("foo")` over any input string\nreturns said input string.\n\nNumbers and booleans in the input are converted to strings.\nNull values are treated as empty strings. Arrays and objects\nin the input are not supported.\n\n- `jq join(", ")`\nInput: `["a","b,c,d","e"]`\nOutput: `"a, b,c,d, e"`\n\n- `jq join(" ")`\nInput: `["a",1,2.3,true,null,false]`\nOutput: `"a 1 2.3 true  false"`\n\n',
  },
  ascii_downcase: {
    documentation:
      '## `ascii_downcase`, `ascii_upcase`\n\nEmit a copy of the input string with its alphabetic characters (a-z and A-Z)\nconverted to the specified case.\n\n- `jq ascii_upcase`\nInput: `"useful but not for é"`\nOutput: `"USEFUL BUT NOT FOR é"`\n\n',
  },
  ascii_upcase: {
    documentation:
      '## `ascii_downcase`, `ascii_upcase`\n\nEmit a copy of the input string with its alphabetic characters (a-z and A-Z)\nconverted to the specified case.\n\n- `jq ascii_upcase`\nInput: `"useful but not for é"`\nOutput: `"USEFUL BUT NOT FOR é"`\n\n',
  },
  while: {
    documentation:
      "## `while(cond; update)`\n\nThe `while(cond; update)` function allows you to repeatedly\napply an update to `.` until `cond` is false.\n\nNote that `while(cond; update)` is internally defined as a\nrecursive jq function.  Recursive calls within `while` will\nnot consume additional memory if `update` produces at most one\noutput for each input.  See advanced topics below.\n\n- `jq [while(.<100; .*2)]`\nInput: `1`\nOutput: `[1,2,4,8,16,32,64]`\n\n",
  },
  repeat: {
    documentation:
      "## `repeat(exp)`\n\nThe `repeat(exp)` function allows you to repeatedly\napply expression `exp` to `.` until an error is raised.\n\nNote that `repeat(exp)` is internally defined as a\nrecursive jq function.  Recursive calls within `repeat` will\nnot consume additional memory if `exp` produces at most one\noutput for each input.  See advanced topics below.\n\n- `jq [repeat(.*2, error)?]`\nInput: `1`\nOutput: `[2]`\n\n",
  },
  until: {
    documentation:
      "## `until(cond; next)`\n\nThe `until(cond; next)` function allows you to repeatedly\napply the expression `next`, initially to `.` then to its own\noutput, until `cond` is true.  For example, this can be used\nto implement a factorial function (see below).\n\nNote that `until(cond; next)` is internally defined as a\nrecursive jq function.  Recursive calls within `until()` will\nnot consume additional memory if `next` produces at most one\noutput for each input.  See advanced topics below.\n\n- `jq [.,1]|until(.[0] < 1; [.[0] - 1, .[1] * .[0]])|.[1]`\nInput: `4`\nOutput: `24`\n\n",
  },
  recurse: {
    documentation:
      '## `recurse(f)`, `recurse`, `recurse(f; condition)`\n\nThe `recurse(f)` function allows you to search through a\nrecursive structure, and extract interesting data from all\nlevels. Suppose your input represents a filesystem:\n\n    {"name": "/", "children": [\n      {"name": "/bin", "children": [\n        {"name": "/bin/ls", "children": []},\n        {"name": "/bin/sh", "children": []}]},\n      {"name": "/home", "children": [\n        {"name": "/home/stephen", "children": [\n          {"name": "/home/stephen/jq", "children": []}]}]}]}\n\nNow suppose you want to extract all of the filenames\npresent. You need to retrieve `.name`, `.children[].name`,\n`.children[].children[].name`, and so on. You can do this\nwith:\n\n    recurse(.children[]) | .name\n\nWhen called without an argument, `recurse` is equivalent to\n`recurse(.[]?)`.\n\n`recurse(f)` is identical to `recurse(f; true)` and can be\nused without concerns about recursion depth.\n\n`recurse(f; condition)` is a generator which begins by\nemitting . and then emits in turn .|f, .|f|f, .|f|f|f, ...  so long\nas the computed value satisfies the condition. For example,\nto generate all the integers, at least in principle, one\ncould write `recurse(.+1; true)`.\n\nThe recursive calls in `recurse` will not consume additional\nmemory whenever `f` produces at most a single output for each\ninput.\n\n- `jq recurse(.foo[])`\nInput: `{"foo":[{"foo": []}, {"foo":[{"foo":[]}]}]}`\nOutput: `{"foo":[{"foo":[]},{"foo":[{"foo":[]}]}]},{"foo":[]},{"foo":[{"foo":[]}]},{"foo":[]}`\n\n- `jq recurse`\nInput: `{"a":0,"b":[1]}`\nOutput: `{"a":0,"b":[1]},0,[1],1`\n\n- `jq recurse(. * .; . < 20)`\nInput: `2`\nOutput: `2,4,16`\n\n',
  },
  walk: {
    documentation:
      '## `walk(f)`\n\nThe `walk(f)` function applies f recursively to every\ncomponent of the input entity.  When an array is\nencountered, f is first applied to its elements and then to\nthe array itself; when an object is encountered, f is first\napplied to all the values and then to the object.  In\npractice, f will usually test the type of its input, as\nillustrated in the following examples.  The first example\nhighlights the usefulness of processing the elements of an\narray of arrays before processing the array itself.  The second\nexample shows how all the keys of all the objects within the\ninput can be considered for alteration.\n\n- `jq walk(if type == "array" then sort else . end)`\nInput: `[[4, 1, 7], [8, 5, 2], [3, 6, 9]]`\nOutput: `[[1,4,7],[2,5,8],[3,6,9]]`\n\n- `jq walk( if type == "object" then with_entries( .key |= sub( "^_+"; "") ) else . end )`\nInput: `[ { "_a": { "__b": 2 } } ]`\nOutput: `[{"a":{"b":2}}]`\n\n',
  },
  have_literal_numbers: {
    documentation:
      "## `have_literal_numbers`\n\nThis builtin returns true if jq's build configuration\nincludes support for preservation of input number literals.\n\n",
  },
  have_decnum: {
    documentation:
      '## `have_decnum`\n\nThis builtin returns true if jq was built with "decnum",\nwhich is the current literal number preserving numeric\nbackend implementation for jq.\n\n',
  },
  env: {
    documentation:
      '## `$ENV`, `env`\n\n`$ENV` is an object representing the environment variables as\nset when the jq program started.\n\n`env` outputs an object representing jq\'s current environment.\n\nAt the moment there is no builtin for setting environment\nvariables.\n\n- `jq $ENV.PAGER`\nInput: `null`\nOutput: `"less"`\n\n- `jq env.PAGER`\nInput: `null`\nOutput: `"less"`\n\n',
  },
  transpose: {
    documentation:
      "## `transpose`\n\nTranspose a possibly jagged matrix (an array of arrays).\nRows are padded with nulls so the result is always rectangular.\n\n- `jq transpose`\nInput: `[[1], [2,3]]`\nOutput: `[[1,2],[null,3]]`\n\n",
  },
  bsearch: {
    documentation:
      "## `bsearch(x)`\n\n`bsearch(x)` conducts a binary search for x in the input\narray.  If the input is sorted and contains x, then\n`bsearch(x)` will return its index in the array; otherwise, if\nthe array is sorted, it will return (-1 - ix) where ix is an\ninsertion point such that the array would still be sorted\nafter the insertion of x at ix.  If the array is not sorted,\n`bsearch(x)` will return an integer that is probably of no\ninterest.\n\n- `jq bsearch(0)`\nInput: `[0,1]`\nOutput: `0`\n\n- `jq bsearch(0)`\nInput: `[1,2,3]`\nOutput: `-1`\n\n- `jq bsearch(4) as $ix | if $ix < 0 then .[-(1+$ix)] = 4 else . end`\nInput: `[1,2,3]`\nOutput: `[1,2,3,4]`\n\n",
  },
  builtins: {
    documentation:
      "## `builtins`\n\nReturns a list of all builtin functions in the format `name/arity`.\nSince functions with the same name but different arities are considered\nseparate functions, `all/0`, `all/1`, and `all/2` would all be present\nin the list.\n\n",
  },
  not: {
    documentation:
      '## `and`, `or`, `not`\n\njq supports the normal Boolean operators `and`, `or`, `not`.\nThey have the same standard of truth as if expressions -\n`false` and `null` are considered "false values", and\nanything else is a "true value".\n\nIf an operand of one of these operators produces multiple\nresults, the operator itself will produce a result for each input.\n\n`not` is in fact a builtin function rather than an operator,\nso it is called as a filter to which things can be piped\nrather than with special syntax, as in `.foo and .bar |\nnot`.\n\nThese three only produce the values `true` and `false`, and\nso are only useful for genuine Boolean operations, rather\nthan the common Perl/Python/Ruby idiom of\n"value_that_may_be_null or default". If you want to use this\nform of "or", picking between two values rather than\nevaluating a condition, see the `//` operator below.\n\n- `jq 42 and "a string"`\nInput: `null`\nOutput: `true`\n\n- `jq (true, false) or false`\nInput: `null`\nOutput: `true,false`\n\n- `jq (true, true) and (true, false)`\nInput: `null`\nOutput: `true,false,true,false`\n\n- `jq [true, false | not]`\nInput: `null`\nOutput: `[false, true]`\n\n',
  },
  test: {
    documentation:
      '## `test(val)`, `test(regex; flags)`\n\nLike `match`, but does not return match objects, only `true` or `false`\nfor whether or not the regex matches the input.\n\n- `jq test("foo")`\nInput: `"foo"`\nOutput: `true`\n\n- `jq .[] | test("a b c # spaces are ignored"; "ix")`\nInput: `["xabcd", "ABC"]`\nOutput: `true,true`\n\n',
  },
  match: {
    documentation:
      '## `match(val)`, `match(regex; flags)`\n\n**match** outputs an object for each match it finds.  Matches have\nthe following fields:\n\n* `offset` - offset in UTF-8 codepoints from the beginning of the input\n* `length` - length in UTF-8 codepoints of the match\n* `string` - the string that it matched\n* `captures` - an array of objects representing capturing groups.\n\nCapturing group objects have the following fields:\n\n* `offset` - offset in UTF-8 codepoints from the beginning of the input\n* `length` - length in UTF-8 codepoints of this capturing group\n* `string` - the string that was captured\n* `name` - the name of the capturing group (or `null` if it was unnamed)\n\nCapturing groups that did not match anything return an offset of -1\n\n- `jq match("(abc)+"; "g")`\nInput: `"abc abc"`\nOutput: `{"offset": 0, "length": 3, "string": "abc", "captures": [{"offset": 0, "length": 3, "string": "abc", "name": null}]},{"offset": 4, "length": 3, "string": "abc", "captures": [{"offset": 4, "length": 3, "string": "abc", "name": null}]}`\n\n- `jq match("foo")`\nInput: `"foo bar foo"`\nOutput: `{"offset": 0, "length": 3, "string": "foo", "captures": []}`\n\n- `jq match(["foo", "ig"])`\nInput: `"foo bar FOO"`\nOutput: `{"offset": 0, "length": 3, "string": "foo", "captures": []},{"offset": 8, "length": 3, "string": "FOO", "captures": []}`\n\n- `jq match("foo (?<bar123>bar)? foo"; "ig")`\nInput: `"foo bar foo foo  foo"`\nOutput: `{"offset": 0, "length": 11, "string": "foo bar foo", "captures": [{"offset": 4, "length": 3, "string": "bar", "name": "bar123"}]},{"offset": 12, "length": 8, "string": "foo  foo", "captures": [{"offset": -1, "length": 0, "string": null, "name": "bar123"}]}`\n\n- `jq [ match("."; "g")] | length`\nInput: `"abc"`\nOutput: `3`\n\n',
  },
  capture: {
    documentation:
      '## `capture(val)`, `capture(regex; flags)`\n\nCollects the named captures in a JSON object, with the name\nof each capture as the key, and the matched string as the\ncorresponding value.\n\n- `jq capture("(?<a>[a-z]+)-(?<n>[0-9]+)")`\nInput: `"xyzzy-14"`\nOutput: `{ "a": "xyzzy", "n": "14" }`\n\n',
  },
  scan: {
    documentation:
      '## `scan(regex)`, `scan(regex; flags)`\n\nEmit a stream of the non-overlapping substrings of the input\nthat match the regex in accordance with the flags, if any\nhave been specified.  If there is no match, the stream is empty.\nTo capture all the matches for each input string, use the idiom\n`[ expr ]`, e.g. `[ scan(regex) ]`.  If the regex contains capturing\ngroups, the filter emits a stream of arrays, each of which contains\nthe captured strings.\n\n- `jq scan("c")`\nInput: `"abcdefabc"`\nOutput: `"c","c"`\n\n- `jq scan("(a+)(b+)")`\nInput: `"abaabbaaabbb"`\nOutput: `["a","b"],["aa","bb"],["aaa","bbb"]`\n\n',
  },
  splits: {
    documentation:
      '## `splits(regex)`, `splits(regex; flags)`\n\nThese provide the same results as their `split` counterparts,\nbut as a stream instead of an array.\n\n- `jq splits(", *")`\nInput: `"ab,cd,   ef, gh"`\nOutput: `"ab","cd","ef","gh"`\n\n- `jq splits(",? *"; "n")`\nInput: `"ab,cd ef,  gh"`\nOutput: `"ab","cd","ef","gh"`\n\n',
  },
  sub: {
    documentation:
      '## `sub(regex; tostring)`, `sub(regex; tostring; flags)`\n\nEmit the string obtained by replacing the first match of\nregex in the input string with `tostring`, after\ninterpolation.  `tostring` should be a jq string or a stream\nof such strings, each of which may contain references to\nnamed captures. The named captures are, in effect, presented\nas a JSON object (as constructed by `capture`) to\n`tostring`, so a reference to a captured variable named "x"\nwould take the form: `"\\(.x)"`.\n\n- `jq sub("[^a-z]*(?<x>[a-z]+)"; "Z\\(.x)"; "g")`\nInput: `"123abc456def"`\nOutput: `"ZabcZdef"`\n\n- `jq [sub("(?<a>.)"; "\\(.a|ascii_upcase)", "\\(.a|ascii_downcase)")]`\nInput: `"aB"`\nOutput: `["AB","aB"]`\n\n',
  },
  gsub: {
    documentation:
      '## `gsub(regex; tostring)`, `gsub(regex; tostring; flags)`\n\n`gsub` is like `sub` but all the non-overlapping occurrences of the regex are\nreplaced by `tostring`, after interpolation. If the second argument is a stream\nof jq strings, then `gsub` will produce a corresponding stream of JSON strings.\n\n- `jq gsub("(?<x>.)[^a]*"; "+\\(.x)-")`\nInput: `"Abcabc"`\nOutput: `"+A-+a-"`\n\n- `jq [gsub("p"; "a", "b")]`\nInput: `"p"`\nOutput: `["a","b"]`\n\n',
  },
  isempty: {
    documentation:
      "## `isempty(exp)`\n\nReturns true if `exp` produces no outputs, false otherwise.\n\n- `jq isempty(empty)`\nInput: `null`\nOutput: `true`\n\n- `jq isempty(.[])`\nInput: `[]`\nOutput: `true`\n\n- `jq isempty(.[])`\nInput: `[1,2,3]`\nOutput: `false`\n\n",
  },
  limit: {
    documentation:
      "## `limit(n; expr)`\n\nThe `limit` function extracts up to `n` outputs from `expr`.\n\n- `jq [limit(3; .[])]`\nInput: `[0,1,2,3,4,5,6,7,8,9]`\nOutput: `[0,1,2]`\n\n",
  },
  skip: {
    documentation:
      "## `skip(n; expr)`\n\nThe `skip` function skips the first `n` outputs from `expr`.\n\n- `jq [skip(3; .[])]`\nInput: `[0,1,2,3,4,5,6,7,8,9]`\nOutput: `[3,4,5,6,7,8,9]`\n\n",
  },
  first: {
    documentation:
      "## `first`, `last`, `nth(n)`\n\nThe `first` and `last` functions extract the first\nand last values from any array at `.`.\n\nThe `nth(n)` function extracts the nth value of any array at `.`.\n\n- `jq [range(.)]|[first, last, nth(5)]`\nInput: `10`\nOutput: `[0,9,5]`\n\n",
  },
  last: {
    documentation:
      "## `first`, `last`, `nth(n)`\n\nThe `first` and `last` functions extract the first\nand last values from any array at `.`.\n\nThe `nth(n)` function extracts the nth value of any array at `.`.\n\n- `jq [range(.)]|[first, last, nth(5)]`\nInput: `10`\nOutput: `[0,9,5]`\n\n",
  },
  nth: {
    documentation:
      "## `first`, `last`, `nth(n)`\n\nThe `first` and `last` functions extract the first\nand last values from any array at `.`.\n\nThe `nth(n)` function extracts the nth value of any array at `.`.\n\n- `jq [range(.)]|[first, last, nth(5)]`\nInput: `10`\nOutput: `[0,9,5]`\n\n",
  },
  input: {
    documentation:
      "## `input`\n\nOutputs one new input.\n\nNote that when using `input` it is generally necessary to\ninvoke jq with the `-n` command-line option, otherwise\nthe first entity will be lost.\n\n    echo 1 2 3 4 | jq '[., input]' # [1,2] [3,4]\n\n",
  },
  inputs: {
    documentation:
      "## `inputs`\n\nOutputs all remaining inputs, one by one.\n\nThis is primarily useful for reductions over a program's\ninputs.  Note that when using `inputs` it is generally necessary\nto invoke jq with the `-n` command-line option, otherwise\nthe first entity will be lost.\n\n    echo 1 2 3 | jq -n 'reduce inputs as $i (0; . + $i)' # 6\n\n",
  },
  debug: {
    documentation:
      '## `debug`, `debug(msgs)`\n\nThese two filters are like `.` but have as a side-effect the\nproduction of one or more messages on stderr.\n\nThe message produced by the `debug` filter has the form\n\n    ["DEBUG:",<input-value>]\n\nwhere `<input-value>` is a compact rendition of the input\nvalue.  This format may change in the future.\n\nThe `debug(msgs)` filter is defined as `(msgs | debug | empty), .`\nthus allowing great flexibility in the content of the message,\nwhile also allowing multi-line debugging statements to be created.\n\nFor example, the expression:\n\n    1 as $x | 2 | debug("Entering function foo with $x == \\($x)", .) | (.+1)\n\nwould produce the value 3 but with the following two lines\nbeing written to stderr:\n\n    ["DEBUG:","Entering function foo with $x == 1"]\n    ["DEBUG:",2]\n\n',
  },
  stderr: {
    documentation:
      "## `stderr`\n\nPrints its input in raw and compact mode to stderr with no\nadditional decoration, not even a newline.\n\n",
  },
  input_filename: {
    documentation:
      "## `input_filename`\n\nReturns the name of the file whose input is currently being\nfiltered.  Note that this will not work well unless jq is\nrunning in a UTF-8 locale.\n\n",
  },
  input_line_number: {
    documentation:
      "## `input_line_number`\n\nReturns the line number of the input currently being filtered.\n\n",
  },
  truncate_stream: {
    documentation:
      '## `truncate_stream(stream_expression)`\n\nConsumes a number as input and truncates the corresponding\nnumber of path elements from the left of the outputs of the\ngiven streaming expression.\n\n- `jq truncate_stream([[0],"a"],[[1,0],"b"],[[1,0]],[[1]])`\nInput: `1`\nOutput: `[[0],"b"],[[0]]`\n\n',
  },
  fromstream: {
    documentation:
      '## `fromstream(stream_expression)`\n\nOutputs values corresponding to the stream expression\'s\noutputs.\n\n- `jq fromstream(1|truncate_stream([[0],"a"],[[1,0],"b"],[[1,0]],[[1]]))`\nInput: `null`\nOutput: `["b"]`\n\n',
  },
  tostream: {
    documentation:
      '## `tostream`\n\nThe `tostream` builtin outputs the streamed form of its input.\n\n- `jq . as $dot|fromstream($dot|tostream)|.==$dot`\nInput: `[0,[1,{"a":1},{"b":2}]]`\nOutput: `true`\n\n',
  },
  modulemeta: {
    documentation:
      "## `modulemeta`\n\nTakes a module name as input and outputs the module's metadata\nas an object, with the module's imports (including metadata)\nas an array value for the `deps` key and the module's defined\nfunctions as an array value for the `defs` key.\n\nPrograms can use this to query a module's metadata, which they\ncould then use to, for example, search for, download, and\ninstall missing dependencies.\n\n",
  },
} as const;
