import { First, isEmpty, Maybe, mconcatMap, not, Pair, Reader } from 'crocks'

// rule ::
const rule = (pair) =>
  Reader((context) =>
    pair.fst()(context) ? Maybe.Just(pair.snd()(context)) : Maybe.Nothing(),
  )

// isUrl :: String -> Boolean
const isUrl = Reader((context) => context.search(/^http(s)?/) !== -1)

// getRemoteContent :: String -> IO
const getRemoteContent = Reader(
  (context) => `getting remote content → ${context}`,
)

// isFile :: String -> Boolean
const isFile = Reader((context) => context.search(/^(\/|\.{1,2}\/|~\/)/) !== -1)

// getFileContent :: String -> IO
const getFileContent = Reader((context) => `getting file → ${context}`)

// hasContent :: String -> Boolean
const hasContent = not(isEmpty)

// getContent :: String -> IO
const getContent = Reader((context) => `getting content → ${context}`)

// fetchContent :: String -> Maybe String
export const fetchContent = mconcatMap(First, rule, [
  Pair(isUrl, getRemoteContent),
  Pair(isFile, getFileContent),
  Pair(hasContent, getContent),
])
