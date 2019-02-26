jq .
"Hello, world!"

jq .foo
{"foo": 42, "bar": "less interesting data"}

jq .foo
{"notfoo": true, "alsonotfoo": false}

jq .["foo"]
{"foo": 42}

jq .foo?
{"foo": 42, "bar": "less interesting data"}

jq .foo?
{"notfoo": true, "alsonotfoo": false}

jq .["foo"]?
{"foo": 42}

jq [.foo?]
[1,2]

jq .[0]
[{"name":"JSON", "good":true}, {"name":"XML", "good":false}]

jq .[2]
[{"name":"JSON", "good":true}, {"name":"XML", "good":false}]

jq .[-2]
[1,2,3]

jq .[2:4]
["a","b","c","d","e"]

jq .[2:4]
"abcdefghi"

jq .[:3]
["a","b","c","d","e"]

jq .[-2:]
["a","b","c","d","e"]

jq .[]
[{"name":"JSON", "good":true}, {"name":"XML", "good":false}]

jq .[]
[]

jq .[]
{"a": 1, "b": 1}

jq .foo, .bar
{"foo": 42, "bar": "something else", "baz": true}

jq .user, .projects[]
{"user":"stedolan", "projects": ["jq", "wikiflow"]}

jq"
      - '"wikiflow"
jq .[4,2]
["a","b","c","d","e"]

jq .[] | .name
[{"name":"JSON", "good":true}, {"name":"XML", "good":false}]

jq (. + 2) * 5
"1"

jq [.user, .projects[]]
{"user":"stedolan", "projects": ["jq", "wikiflow"]}

jq [ .[] | . * 2]
[1, 2, 3]

jq {user, title: .titles[]}
{"user":"stedolan","titles":["JQ Primer", "More JQ"]}

jq Primer"}
      - '{"user":"stedolan", "title": "More JQ"}
jq {(.user): .titles}
{"user":"stedolan","titles":["JQ Primer", "More JQ"]}

jq Primer", "More JQ"]}
jq ..|.a?
[[{"a":1}]]

jq .a + 1
{"a": 7}

jq .a + .b
{"a": [1,2], "b": [3,4]}

jq .a + null
{"a": 1}

jq .a + 1
{}

jq {a: 1} + {b: 2} + {c: 3} + {a: 42}
null

jq 4 - .a
{"a":3}

jq . - ["xml", "yaml"]
["xml", "yaml", "json"]

jq 10 / . * 3
5

jq . / ", "
"a, b,c,d, e"

jq {"k": {"a": 1, "b": 2}} * {"k": {"a": 0,"c": 3}}
null

jq .[] | (1 / .)?
[1,0,-1]

jq .[] | length
[[1,2], "string", {"a":2}, null]

jq utf8bytelength
"\u03bc"

jq keys
{"abc": 1, "abcd": 2, "Foo": 3}

jq keys
[42,3,35]

jq map(has("foo"))
[{"foo": 42}, {}]

jq map(has(2))
[[0,1], ["a","b","c"]]

jq .[] | in({"foo": 42})
["foo", "bar"]

jq map(in([0,1]))
[2, 0]

jq map(.+1)
[1,2,3]

jq map_values(.+1)
{"a": 1, "b": 2, "c": 3}

jq path(.a[0].b)
null

jq [path(..)]
{"a":[{"b":1}]}

jq del(.foo)
{"foo": 42, "bar": 9001, "baz": 42}

jq del(.[1, 2])
["foo", "bar", "baz"]

jq getpath(["a","b"])
null

jq [getpath(["a","b"], ["a","c"])]
{"a":{"b":0, "c":1}}

jq setpath(["a","b"]; 1)
null

jq setpath(["a","b"]; 1)
{"a":{"b":0}}

jq setpath([0,"a"]; 1)
null

jq delpaths([["a","b"]])
{"a":{"b":1},"x":{"y":2}}

jq to_entries
{"a": 1, "b": 2}

jq from_entries
[{"key":"a", "value":1}, {"key":"b", "value":2}]

jq with_entries(.key |= "KEY_" + .)
{"a": 1, "b": 2}

jq map(select(. >= 2))
[1,5,3,0,7]

jq .[] | select(.id == "second")
[{"id": "first", "val": 1}, {"id": "second", "val": 2}]

jq .[]|numbers
[[],{},1,"foo",null,true,false]

jq 1, empty, 2
null

jq [1,2,empty,3]
null

jq try error("\($__loc__)") catch .
null

jq [paths]
[1,[[],{"a":2}]]

jq [paths(scalars)]
[1,[[],{"a":2}]]

jq add
["a","b","c"]

jq add
[1, 2, 3]

jq add
[]

jq any
[true, false]

jq any
[false, false]

jq any
[]

jq all
[true, false]

jq all
[true, true]

jq all
[]

jq flatten
[1, [2], [[3]]]

jq flatten(1)
[1, [2], [[3]]]

jq flatten
[[]]

jq flatten
[{"foo": "bar"}, [{"foo": "baz"}]]

jq range(2;4)
null

jq [range(2;4)]
null

jq [range(4)]
null

jq [range(0;10;3)]
null

jq [range(0;10;-1)]
null

jq [range(0;-5;-1)]
null

jq floor
3.14159

jq sqrt
9

jq .[] | tonumber
[1, "1"]

jq .[] | tostring
[1, "1", [1]]

jq map(type)
[0, false, [], {}, null, "hello"]

jq .[] | (infinite * .) < 0
[-1, 1]

jq infinite, nan | type
null

jq sort
[8,3,null,6]

jq sort_by(.foo)
[{"foo":4, "bar":10}, {"foo":3, "bar":100}, {"foo":2, "bar":1}]

jq group_by(.foo)
[{"foo":1, "bar":10}, {"foo":3, "bar":100}, {"foo":1, "bar":1}]

jq min
[5,4,2,7]

jq max_by(.foo)
[{"foo":1, "bar":14}, {"foo":2, "bar":3}]

jq unique
[1,2,5,3,5,3,1,3]

jq unique_by(.foo)
[{"foo": 1, "bar": 2}, {"foo": 1, "bar": 3}, {"foo": 4, "bar": 5}]

jq unique_by(length)
["chunky", "bacon", "kitten", "cicada", "asparagus"]

jq reverse
[1,2,3,4]

jq contains("bar")
"foobar"

jq contains(["baz", "bar"])
["foobar", "foobaz", "blarp"]

jq contains(["bazzzzz", "bar"])
["foobar", "foobaz", "blarp"]

jq contains({foo: 12, bar: [{barp: 12}]})
{"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]}

jq contains({foo: 12, bar: [{barp: 15}]})
{"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]}

jq indices(", ")
"a,b, cd, efg, hijk"

jq indices(1)
[0,1,2,1,3,1,4]

jq indices([1,2])
[0,1,2,3,1,4,2,5,1,2,6,7]

jq index(", ")
"a,b, cd, efg, hijk"

jq rindex(", ")
"a,b, cd, efg, hijk"

jq inside("foobar")
"bar"

jq inside(["foobar", "foobaz", "blarp"])
["baz", "bar"]

jq inside(["foobar", "foobaz", "blarp"])
["bazzzzz", "bar"]

jq inside({"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]})
{"foo": 12, "bar": [{"barp": 12}]}

jq inside({"foo": 12, "bar":[1,2,{"barp":12, "blip":13}]})
{"foo": 12, "bar": [{"barp": 15}]}

jq [.[]|startswith("foo")]
["fo", "foo", "barfoo", "foobar", "barfoob"]

jq [.[]|endswith("foo")]
["foobar", "barfoo"]

jq combinations
[[1,2], [3, 4]]

jq combinations(2)
[0, 1]

jq [.[]|ltrimstr("foo")]
["fo", "foo", "barfoo", "foobar", "afoo"]

jq [.[]|rtrimstr("foo")]
["fo", "foo", "barfoo", "foobar", "foob"]

jq explode
"foobar"

jq implode
[65, 66, 67]

jq split(", ")
"a, b,c,d, e, "

jq join(", ")
["a","b,c,d","e"]

jq join(" ")
["a",1,2.3,true,null,false]

jq [while(.<100; .*2)]
"1"

jq [.,1]|until(.[0] < 1; [.[0] - 1, .[1] * .[0]])|.[1]
4

jq recurse(.foo[])
{"foo":[{"foo": []}, {"foo":[{"foo":[]}]}]}

jq recurse
{"a":0,"b":[1]}

jq recurse(. * .; . < 20)
2

jq walk(if type == "array" then sort else . end)
[[4, 1, 7], [8, 5, 2], [3, 6, 9]]

jq walk( if type == "object" then with_entries( .key |= sub( "^_+"; "")) else . end )
[ { "_a": { "__b": 2 } } ]

jq $ENV.PAGER
null

jq env.PAGER
null

jq transpose
[[1], [2,3]]

jq bsearch(0)
[0,1]

jq bsearch(0)
[1,2,3]

jq bsearch(4) as $ix | if $ix < 0 then .[-(1+$ix)] = 4 else . end
[1,2,3]

jq "The input was \(.), which is one less than \(.+1)"
42

jq [.[]|tostring]
[1, "foo", ["foo"]]

jq [.[]|tojson]
[1, "foo", ["foo"]]

jq [.[]|tojson|fromjson]
[1, "foo", ["foo"]]

jq @html
"This works if x < y"

jq @sh "echo \(.)"
"O''Hara''s Ale"

jq @base64
"This is a message"

jq @base64d
"VGhpcyBpcyBhIG1lc3NhZ2U="

jq fromdate
"2015-03-05T23:51:47Z"

jq strptime("%Y-%m-%dT%H:%M:%SZ")
"2015-03-05T23:51:47Z"

jq strptime("%Y-%m-%dT%H:%M:%SZ")|mktime
"2015-03-05T23:51:47Z"

jq .[] == 1
[1, 1.0, "1", "banana"]

jq |-
        if . == 0 then
          "zero"
        elif . == 1 then
          "one"
        else
          "many"
        end
2

jq . < 5
2

jq 42 and "a string"
null

jq (true, false) or false
null

jq (true, true) and (true, false)
null

jq [true, false | not]
null

jq .foo // 42
{"foo": 19}

jq .foo // 42
{}

jq try .a catch ". is not an object"
"true"

jq [.[]|try .a]
[{}, true, {"a":1}]

jq try error("some exception") catch .
"true"

jq [.[]|(.a)?]
[{}, true, {"a":1}]

jq test("foo")
"foo"

jq .[] | test("a b c # spaces are ignored"; "ix")
["xabcd", "ABC"]

jq match("(abc)+"; "g")
"abc abc"

jq match("foo")
"foo bar foo"

jq match(["foo", "ig"])
"foo bar FOO"

jq match("foo (?<bar123>bar)? foo"; "ig")
"foo bar foo foo  foo"

jq [ match("."; "g")] | length
"abc"

jq capture("(?<a>[a-z]+)-(?<n>[0-9]+)")
"xyzzy-14"

jq .bar as $x | .foo | . + $x
{"foo":10, "bar":200}

jq . as $i|[(.*2|. as $i| $i), $i]
"5"

jq . as [$a, $b, {c: $c}] | $a + $b + $c
[2, 3, {"c": 4, "d": 5}]

jq .[] as [$a, $b] | {a: $a, b: $b}
[[0], [0, 1], [2, 1, 0]]

jq .[] as {$a, $b, c: {$d, $e}} ?// {$a, $b, c: [{$d, $e}]} | {$a, $b, $d, $e}
[{"a": 1, "b": 2, "c": {"d": 3, "e": 4}}, {"a": 1, "b": 2, "c": [{"d":
        3, "e": 4}]}]

jq .[] as {$a, $b, c: {$d}} ?// {$a, $b, c: [{$e}]} | {$a, $b, $d, $e}
[{"a": 1, "b": 2, "c": {"d": 3, "e": 4}}, {"a": 1, "b": 2, "c": [{"d":
        3, "e": 4}]}]

jq .[] as [$a] ?// [$b] | if $a != null then error("err: \($a)") else {$a,$b} end
[[3]]

jq def addvalue(f): . + [f]; map(addvalue(.[0]))
[[1,2],[10,20]]

jq def addvalue(f): f as $x | map(. + $x); addvalue(.[0])
[[1,2],[10,20]]

jq reduce .[] as $item (0; . + $item)
[10,2,5,3]

jq isempty(empty)
null

jq [limit(3;.[])]
[0,1,2,3,4,5,6,7,8,9]

jq [first(range(.)), last(range(.)), nth(./2; range(.))]
"10"

jq [range(.)]|[first, last, nth(5)]
"10"

jq [foreach .[] as $item ([[],[]]; if $item == null then [[],.[0]] else [(.[0] + [$item]),[]] end; if $item == null then .[1] else empty end)]
[1,2,3,4,null,"a","b",null]

jq def range(init; upto; by): def _range: if (by > 0 and . < upto) or (by < 0 and . > upto) then ., ((.+by)|_range) else . end; if by == 0 then init else init|_range end | select((by > 0 and . < upto) or (by < 0 and . > upto)); range(0; 10; 3)
null

jq def while(cond; update): def _while: if cond then ., (update | _while) else empty end; _while; [while(.<100; .*2)]
"1"

jq [1|truncate_stream([[0],1],[[1,0],2],[[1,0]],[[1]])]
"1"

jq fromstream(1|truncate_stream([[0],1],[[1,0],2],[[1,0]],[[1]]))
null

jq . as $dot|fromstream($dot|tostream)|.==$dot
[0,[1,{"a":1},{"b":2}]]

jq (..|select(type=="boolean")) |= if . then 1 else 0 end
[true,false,[5,true,[true,[false]],false]]

jq .foo += 1
{"foo": 42}
