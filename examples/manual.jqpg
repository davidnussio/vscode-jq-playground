jq .
"Hello, world!"
# "Hello, world!"


jq .foo
{"foo": 42, "bar": "less interesting data"}
# 42


jq .foo
{"notfoo": true, "alsonotfoo": false}
# null


jq .["foo"]
{"foo": 42}
# 42


jq .foo?
{"foo": 42, "bar": "less interesting data"}
# 42


jq .foo?
{"notfoo": true, "alsonotfoo": false}
# null


jq .["foo"]?
{"foo": 42}
# 42


jq [.foo?]
[1,2]
# []


jq .[0]
[{"name":"JSON", "good":true}, {"name":"XML", "good":false}]
# {"name":"JSON", "good":true}


jq .[2]
[{"name":"JSON", "good":true}, {"name":"XML", "good":false}]
# null


jq .[-2]
[1,2,3]
# 2


jq .[2:4]
["a","b","c","d","e"]
# ["c", "d"]


jq .[2:4]
"abcdefghi"
# "cd"


jq .[:3]
["a","b","c","d","e"]
# ["a", "b", "c"]


jq .[-2:]
["a","b","c","d","e"]
# ["d", "e"]


jq .[]
[{"name":"JSON", "good":true}, {"name":"XML", "good":false}]
# {"name":"JSON", "good":true},{"name":"XML", "good":false}


jq .[]
[]
# 


jq .[]
{"a": 1, "b": 1}
# 1,1


jq .foo, .bar
{"foo": 42, "bar": "something else", "baz": true}
# 42,"something else"


jq .user, .projects[]
{"user":"stedolan", "projects": ["jq", "wikiflow"]}
# "stedolan","jq","wikiflow"


jq .[4,2]
["a","b","c","d","e"]
# "e","c"


jq .[] | .name
[{"name":"JSON", "good":true}, {"name":"XML", "good":false}]
# "JSON","XML"


jq (. + 2) * 5
1
# 15


jq [.user, .projects[]]
{"user":"stedolan", "projects": ["jq", "wikiflow"]}
# ["stedolan", "jq", "wikiflow"]


jq [ .[] | . * 2]
[1, 2, 3]
# [2, 4, 6]


jq {user, title: .titles[]}
{"user":"stedolan","titles":["JQ Primer", "More JQ"]}
# {"user":"stedolan", "title": "JQ Primer"},{"user":"stedolan", "title": "More JQ"}


jq {(.user): .titles}
{"user":"stedolan","titles":["JQ Primer", "More JQ"]}
# {"stedolan": ["JQ Primer", "More JQ"]}


jq ..|.a?
[[{"a":1}]]
# 1


jq .a + 1
{"a": 7}
# 8


jq .a + .b
{"a": [1,2], "b": [3,4]}
# [1,2,3,4]


jq .a + null
{"a": 1}
# 1


jq .a + 1
{}
# 1


jq {a: 1} + {b: 2} + {c: 3} + {a: 42}
null
# {"a": 42, "b": 2, "c": 3}


jq 4 - .a
{"a":3}
# 1


jq . - ["xml", "yaml"]
["xml", "yaml", "json"]
# ["json"]


jq 10 / . * 3
5
# 6


jq . / ", "
"a, b,c,d, e"
# ["a","b,c,d","e"]


jq {"k": {"a": 1, "b": 2}} * {"k": {"a": 0,"c": 3}}
null
# {"k": {"a": 0, "b": 2, "c": 3}}


jq .[] | (1 / .)?
[1,0,-1]
# 1,-1


jq .[] | length
[[1,2], "string", {"a":2}, null]
# 2,6,1,0


jq utf8bytelength
"\u03bc"
# 2


jq keys
{"abc": 1, "abcd": 2, "Foo": 3}
# ["Foo", "abc", "abcd"]


jq keys
[42,3,35]
# [0,1,2]


jq map(has("foo"))
[{"foo": 42}, {}]
# [true, false]


jq map(has(2))
[[0,1], ["a","b","c"]]
# [false, true]


jq .[] | in({"foo": 42})
["foo", "bar"]
# true,false


jq map(in([0,1]))
[2, 0]
# [false, true]


jq map(.+1)
[1,2,3]
# [2,3,4]


jq map_values(.+1)
{"a": 1, "b": 2, "c": 3}
# {"a": 2, "b": 3, "c": 4}


jq path(.a[0].b)
null
# ["a",0,"b"]


jq [path(..)]
{"a":[{"b":1}]}
# [[],["a"],["a",0],["a",0,"b"]]


jq del(.foo)
{"foo": 42, "bar": 9001, "baz": 42}
# {"bar": 9001, "baz": 42}


jq del(.[1, 2])
["foo", "bar", "baz"]
# ["foo"]


jq getpath(["a","b"])
null
# null


jq [getpath(["a","b"], ["a","c"])]
{"a":{"b":0, "c":1}}
# [0, 1]


jq setpath(["a","b"]; 1)
null
# {"a": {"b": 1}}


jq setpath(["a","b"]; 1)
{"a":{"b":0}}
# {"a": {"b": 1}}


jq setpath([0,"a"]; 1)
null
# [{"a":1}]


jq delpaths([["a","b"]])
{"a":{"b":1},"x":{"y":2}}
# {"a":{},"x":{"y":2}}


jq to_entries
{"a": 1, "b": 2}
# [{"key":"a", "value":1}, {"key":"b", "value":2}]


jq from_entries
[{"key":"a", "value":1}, {"key":"b", "value":2}]
# {"a": 1, "b": 2}


jq with_entries(.key |= "KEY_" + .)
{"a": 1, "b": 2}
# {"KEY_a": 1, "KEY_b": 2}


jq map(select(. >= 2))
[1,5,3,0,7]
# [5,3,7]


jq .[] | select(.id == "second")
[{"id": "first", "val": 1}, {"id": "second", "val": 2}]
# {"id": "second", "val": 2}


jq .[]|numbers
[[],{},1,"foo",null,true,false]
# 1


jq 1, empty, 2
null
# 1,2


jq [1,2,empty,3]
null
# [1,2,3]


jq try error("\($__loc__)") catch .
null
# "{\"file\":\"<top-level>\",\"line\":1}"


jq [paths]
[1,[[],{"a":2}]]
# [[0],[1],[1,0],[1,1],[1,1,"a"]]


jq [paths(scalars)]
[1,[[],{"a":2}]]
# [[0],[1,1,"a"]]


jq add
["a","b","c"]
# "abc"


jq add
[1, 2, 3]
# 6


jq add
[]
# null


jq any
[true, false]
# true


jq any
[false, false]
# false


jq any
[]
# false


jq all
[true, false]
# false


jq all
[true, true]
# true


jq all
[]
# true


jq flatten
[1, [2], [[3]]]
# [1, 2, 3]


jq flatten(1)
[1, [2], [[3]]]
# [1, 2, [3]]


jq flatten
[[]]
# []


jq flatten
[{"foo": "bar"}, [{"foo": "baz"}]]
# [{"foo": "bar"}, {"foo": "baz"}]


jq range(2;4)
null
# 2,3


jq [range(2;4)]
null
# [2,3]


jq [range(4)]
null
# [0,1,2,3]


jq [range(0;10;3)]
null
# [0,3,6,9]


jq [range(0;10;-1)]
null
# []


jq [range(0;-5;-1)]
null
# [0,-1,-2,-3,-4]


jq floor
3.14159
# 3


jq sqrt
9
# 3


jq .[] | tonumber
[1, "1"]
# 1,1


jq .[] | tostring
[1, "1", [1]]
# "1","1","[1]"


jq map(type)
[0, false, [], {}, null, "hello"]
# ["number", "boolean", "array", "object", "null", "string"]


jq .[] | (infinite * .) < 0
[-1, 1]
# true,false


jq infinite, nan | type
null
# "number","number"


jq sort
[8,3,null,6]
# [null,3,6,8]


jq sort_by(.foo)
[{"foo":4, "bar":10}, {"foo":3, "bar":100}, {"foo":2, "bar":1}]
# [{"foo":2, "bar":1}, {"foo":3, "bar":100}, {"foo":4, "bar":10}]


jq group_by(.foo)
[{"foo":1, "bar":10}, {"foo":3, "bar":100}, {"foo":1, "bar":1}]
# [[{"foo":1, "bar":10}, {"foo":1, "bar":1}], [{"foo":3, "bar":100}]]


jq min
[5,4,2,7]
# 2


jq max_by(.foo)
[{"foo":1, "bar":14}, {"foo":2, "bar":3}]
# {"foo":2, "bar":3}


jq unique
[1,2,5,3,5,3,1,3]
# [1,2,3,5]


jq unique_by(.foo)
[{"foo": 1, "bar": 2}, {"foo": 1, "bar": 3}, {"foo": 4, "bar": 5}]
# [{"foo": 1, "bar": 2}, {"foo": 4, "bar": 5}]


jq unique_by(length)
["chunky", "bacon", "kitten", "cicada", "asparagus"]
# ["bacon", "chunky", "asparagus"]


jq reverse
[1,2,3,4]
# [4,3,2,1]


jq contains("bar")
"foobar"
# true


jq contains(["baz", "bar"])
["foobar", "foobaz", "blarp"]
# true


jq contains(["bazzzzz", "bar"])
["foobar", "foobaz", "blarp"]
# false


jq contains({foo: 12, bar: [{barp: 12}]})
{"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]}
# true


jq contains({foo: 12, bar: [{barp: 15}]})
{"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]}
# false


jq indices(", ")
"a,b, cd, efg, hijk"
# [3,7,12]


jq indices(1)
[0,1,2,1,3,1,4]
# [1,3,5]


jq indices([1,2])
[0,1,2,3,1,4,2,5,1,2,6,7]
# [1,8]


jq index(", ")
"a,b, cd, efg, hijk"
# 3


jq rindex(", ")
"a,b, cd, efg, hijk"
# 12


jq inside("foobar")
"bar"
# true


jq inside(["foobar", "foobaz", "blarp"])
["baz", "bar"]
# true


jq inside(["foobar", "foobaz", "blarp"])
["bazzzzz", "bar"]
# false


jq inside({"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]})
{"foo": 12, "bar": [{"barp": 12}]}
# true


jq inside({"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]})
{"foo": 12, "bar": [{"barp": 15}]}
# false


jq [.[]|startswith("foo")]
["fo", "foo", "barfoo", "foobar", "barfoob"]
# [false, true, false, true, false]


jq [.[]|endswith("foo")]
["foobar", "barfoo"]
# [false, true]


jq combinations
[[1,2], [3, 4]]
# [1, 3],[1, 4],[2, 3],[2, 4]


jq combinations(2)
[0, 1]
# [0, 0],[0, 1],[1, 0],[1, 1]


jq [.[]|ltrimstr("foo")]
["fo", "foo", "barfoo", "foobar", "afoo"]
# ["fo","","barfoo","bar","afoo"]


jq [.[]|rtrimstr("foo")]
["fo", "foo", "barfoo", "foobar", "foob"]
# ["fo","","bar","foobar","foob"]


jq explode
"foobar"
# [102,111,111,98,97,114]


jq implode
[65, 66, 67]
# "ABC"


jq split(", ")
"a, b,c,d, e, "
# ["a","b,c,d","e",""]


jq join(", ")
["a","b,c,d","e"]
# "a, b,c,d, e"


jq join(" ")
["a",1,2.3,true,null,false]
# "a 1 2.3 true  false"


jq ascii_upcase
"useful but not for é"
# "USEFUL BUT NOT FOR é"


jq [while(.<100; .*2)]
1
# [1,2,4,8,16,32,64]


jq [.,1]|until(.[0] < 1; [.[0] - 1, .[1] * .[0]])|.[1]
4
# 24


jq recurse(.foo[])
{"foo":[{"foo": []}, {"foo":[{"foo":[]}]}]}
# {"foo":[{"foo":[]},{"foo":[{"foo":[]}]}]},{"foo":[]},{"foo":[{"foo":[]}]},{"foo":[]}


jq recurse
{"a":0,"b":[1]}
# {"a":0,"b":[1]},0,[1],1


jq recurse(. * .; . < 20)
2
# 2,4,16


jq walk(if type == "array" then sort else . end)
[[4, 1, 7], [8, 5, 2], [3, 6, 9]]
# [[1,4,7],[2,5,8],[3,6,9]]


jq walk( if type == "object" then with_entries( .key |= sub( "^_+"; "") ) else . end )
[ { "_a": { "__b": 2 } } ]
# [{"a":{"b":2}}]


jq $ENV.PAGER
null
# "less"


jq env.PAGER
null
# "less"


jq transpose
[[1], [2,3]]
# [[1,2],[null,3]]


jq bsearch(0)
[0,1]
# 0


jq bsearch(0)
[1,2,3]
# -1


jq bsearch(4) as $ix | if $ix < 0 then .[-(1+$ix)] = 4 else . end
[1,2,3]
# [1,2,3,4]


jq "The input was \(.), which is one less than \(.+1)"
42
# "The input was 42, which is one less than 43"


jq [.[]|tostring]
[1, "foo", ["foo"]]
# ["1","foo","[\"foo\"]"]


jq [.[]|tojson]
[1, "foo", ["foo"]]
# ["1","\"foo\"","[\"foo\"]"]


jq [.[]|tojson|fromjson]
[1, "foo", ["foo"]]
# [1,"foo",["foo"]]


jq @html
"This works if x < y"
# "This works if x &lt; y"


jq @sh "echo \(.)"
"O'Hara's Ale"
# "echo 'O'\\''Hara'\\''s Ale'"


jq @base64
"This is a message"
# "VGhpcyBpcyBhIG1lc3NhZ2U="


jq @base64d
"VGhpcyBpcyBhIG1lc3NhZ2U="
# "This is a message"


jq fromdate
"2015-03-05T23:51:47Z"
# 1425599507


jq strptime("%Y-%m-%dT%H:%M:%SZ")
"2015-03-05T23:51:47Z"
# [2015,2,5,23,51,47,4,63]


jq strptime("%Y-%m-%dT%H:%M:%SZ")|mktime
"2015-03-05T23:51:47Z"
# 1425599507


jq .[] == 1
[1, 1.0, "1", "banana"]
# true,true,false,false


jq if . == 0 then "zero" elif . == 1 then "one" else "many" end
2
# "many"


jq . < 5
2
# true


jq 42 and "a string"
null
# true


jq (true, false) or false
null
# true,false


jq (true, true) and (true, false)
null
# true,false,true,false


jq [true, false | not]
null
# [false, true]


jq .foo // 42
{"foo": 19}
# 19


jq .foo // 42
{}
# 42


jq try .a catch ". is not an object"
true
# ". is not an object"


jq [.[]|try .a]
[{}, true, {"a":1}]
# [null, 1]


jq try error("some exception") catch .
true
# "some exception"


jq [.[]|(.a)?]
[{}, true, {"a":1}]
# [null, 1]


jq test("foo")
"foo"
# true


jq .[] | test("a b c # spaces are ignored"; "ix")
["xabcd", "ABC"]
# true,true


jq match("(abc)+"; "g")
"abc abc"
# {"offset": 0, "length": 3, "string": "abc", "captures": [{"offset": 0, "length": 3, "string": "abc", "name": null}]},{"offset": 4, "length": 3, "string": "abc", "captures": [{"offset": 4, "length": 3, "string": "abc", "name": null}]}


jq match("foo")
"foo bar foo"
# {"offset": 0, "length": 3, "string": "foo", "captures": []}


jq match(["foo", "ig"])
"foo bar FOO"
# {"offset": 0, "length": 3, "string": "foo", "captures": []},{"offset": 8, "length": 3, "string": "FOO", "captures": []}


jq match("foo (?<bar123>bar)? foo"; "ig")
"foo bar foo foo  foo"
# {"offset": 0, "length": 11, "string": "foo bar foo", "captures": [{"offset": 4, "length": 3, "string": "bar", "name": "bar123"}]},{"offset": 12, "length": 8, "string": "foo  foo", "captures": [{"offset": -1, "length": 0, "string": null, "name": "bar123"}]}


jq [ match("."; "g")] | length
"abc"
# 3


jq capture("(?<a>[a-z]+)-(?<n>[0-9]+)")
"xyzzy-14"
# { "a": "xyzzy", "n": "14" }


jq scan("c")
"abcdefabc"
# "c","c"


jq scan("b")
("", "")
# [],[]


jq split(", *"; null)
"ab,cd, ef"
# "ab","cd","ef"


jq splits(", *")
("ab,cd", "ef, gh")
# "ab","cd","ef","gh"


jq sub("^[^a-z]*(?<x>[a-z]*).*")
"123abc456"
# "ZabcZabc"


jq gsub("(?<x>.)[^a]*"; "+\(.x)-")
"Abcabc"
# "+A-+a-"


jq .bar as $x | .foo | . + $x
{"foo":10, "bar":200}
# 210


jq . as $i|[(.*2|. as $i| $i), $i]
5
# [10,5]


jq . as [$a, $b, {c: $c}] | $a + $b + $c
[2, 3, {"c": 4, "d": 5}]
# 9


jq .[] as [$a, $b] | {a: $a, b: $b}
[[0], [0, 1], [2, 1, 0]]
# {"a":0,"b":null},{"a":0,"b":1},{"a":2,"b":1}


jq .[] as {$a, $b, c: {$d, $e}} ?// {$a, $b, c: [{$d, $e}]} | {$a, $b, $d, $e}
[{"a": 1, "b": 2, "c": {"d": 3, "e": 4}}, {"a": 1, "b": 2, "c": [{"d": 3, "e": 4}]}]
# {"a":1,"b":2,"d":3,"e":4},{"a":1,"b":2,"d":3,"e":4}


jq .[] as {$a, $b, c: {$d}} ?// {$a, $b, c: [{$e}]} | {$a, $b, $d, $e}
[{"a": 1, "b": 2, "c": {"d": 3, "e": 4}}, {"a": 1, "b": 2, "c": [{"d": 3, "e": 4}]}]
# {"a":1,"b":2,"d":3,"e":null},{"a":1,"b":2,"d":null,"e":4}


jq .[] as [$a] ?// [$b] | if $a != null then error("err: \($a)") else {$a,$b} end
[[3]]
# {"a":null,"b":3}


jq def addvalue(f): . + [f]; map(addvalue(.[0]))
[[1,2],[10,20]]
# [[1,2,1], [10,20,10]]


jq def addvalue(f): f as $x | map(. + $x); addvalue(.[0])
[[1,2],[10,20]]
# [[1,2,1,2], [10,20,1,2]]


jq reduce .[] as $item (0; . + $item)
[10,2,5,3]
# 20


jq isempty(empty)
null
# true


jq [limit(3;.[])]
[0,1,2,3,4,5,6,7,8,9]
# [0,1,2]


jq [first(range(.)), last(range(.)), nth(./2; range(.))]
10
# [0,9,5]


jq [range(.)]|[first, last, nth(5)]
10
# [0,9,5]


jq [foreach .[] as $item ([[],[]]; if $item == null then [[],.[0]] else [(.[0] + [$item]),[]] end; if $item == null then .[1] else empty end)]
[1,2,3,4,null,"a","b",null]
# [[1,2,3,4],["a","b"]]


jq def range(init; upto; by): def _range: if (by > 0 and . < upto) or (by < 0 and . > upto) then ., ((.+by)|_range) else . end; if by == 0 then init else init|_range end | select((by > 0 and . < upto) or (by < 0 and . > upto)); range(0; 10; 3)
null
# 0,3,6,9


jq def while(cond; update): def _while: if cond then ., (update | _while) else empty end; _while; [while(.<100; .*2)]
1
# [1,2,4,8,16,32,64]


jq [1|truncate_stream([[0],1],[[1,0],2],[[1,0]],[[1]])]
1
# [[[0],2],[[0]]]


jq fromstream(1|truncate_stream([[0],1],[[1,0],2],[[1,0]],[[1]]))
null
# [2]


jq . as $dot|fromstream($dot|tostream)|.==$dot
[0,[1,{"a":1},{"b":2}]]
# true


jq (..|select(type=="boolean")) |= if . then 1 else 0 end
[true,false,[5,true,[true,[false]],false]]
# [1,0,[5,1,[1,[0]],0]]


jq .foo += 1
{"foo": 42}
# {"foo": 43}


