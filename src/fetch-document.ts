// TODO: Not used :/ need to be implemented

import {
  applyTo,
  compose,
  First,
  flip,
  isEmpty,
  merge,
  mreduceMap,
  safeLift,
  not,
  Pair,
} from "crocks";

// options :: [ Strategy ] -> a -> b
const options = flip((x) =>
  mreduceMap(First, compose(applyTo(x), merge(safeLift))),
);

// isUrl :: String -> Boolean
const isUrl = (context) => context.search(/^http(s)?/) !== -1;

// getRemoteContent :: String -> IO
const getRemoteContent = (context) => `getting remote content → ${context}`;

// isFile :: String -> Boolean
const isFile = (context) => context.search(/^(\/|\.{1,2}\/|~\/)/) !== -1;

// getFileContent :: String -> IO
const getFileContent = (context) => `getting file → ${context}`;

// isContent :: String -> Boolean
const isContent = not(isEmpty);

// getContent :: String -> IO
const getContent = (context) => `getting content → ${context}`;

// fetchContent :: String -> Maybe String
const fetchContent = (context: string): any =>
  options(
    [
      Pair(isUrl, getRemoteContent),
      Pair(isFile, getFileContent),
      Pair(isContent, getContent),
    ],
    context,
  );

export default fetchContent;
