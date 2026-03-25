/**
 * VS Code integration test for examples/playground.test.jqpg
 *
 * Opens the playground file in the editor, executes each jq query via
 * the extension command `extension.executeJqCommand`, and verifies the
 * results by reading the editor document opened with openResult="editor".
 */

import * as assert from "node:assert/strict";
import * as path from "node:path";
import * as vscode from "vscode";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAYGROUND_FILE = path.resolve(
  __dirname,
  "../../examples/playground.test.jqpg"
);

const JQ_LINE_REGEX = /^jq\s/;

/** Wait for the extension to activate. */
async function activateExtension(): Promise<void> {
  const ext = vscode.extensions.getExtension(
    "davidnussio.vscode-jq-playground"
  );
  if (ext && !ext.isActive) {
    await ext.activate();
  }
  // Give the extension a moment to register commands
  await sleep(2000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Find all line numbers in a document that start with "jq ". */
function findJqLines(document: vscode.TextDocument): number[] {
  const lines: number[] = [];
  for (let i = 0; i < document.lineCount; i++) {
    if (JQ_LINE_REGEX.test(document.lineAt(i).text)) {
      lines.push(i);
    }
  }
  return lines;
}

/**
 * Extract the test number from the comment block above a jq line.
 * Looks for patterns like "# 42. SOME LABEL"
 */
function getTestMeta(
  document: vscode.TextDocument,
  jqLine: number
): { num: number; label: string } | null {
  const NUM_LABEL = /^#\s*(\d+)\.\s*(.+)$/;
  for (let i = jqLine - 1; i >= 0; i--) {
    const text = document.lineAt(i).text.trim();
    const m = NUM_LABEL.exec(text);
    if (m) {
      return { num: Number.parseInt(m[1], 10), label: m[2].trim() };
    }
    // Stop searching if we hit a section separator or another jq line
    if (JQ_LINE_REGEX.test(text) || text === "") {
      break;
    }
  }
  return null;
}

/**
 * Execute a jq query at the given line by invoking the extension command.
 * Uses openResult="editor" so the result opens in a new editor tab.
 *
 * Listens for `onDidOpenTextDocument` to reliably detect when the result
 * document is created, regardless of timing.
 */
async function executeQueryAtLine(
  document: vscode.TextDocument,
  line: number
): Promise<string | null> {
  const range = new vscode.Range(
    new vscode.Position(line, 0),
    new vscode.Position(line, document.lineAt(line).text.length)
  );

  // Set up a listener BEFORE executing the command so we don't miss the event
  const resultPromise = new Promise<string | null>((resolve) => {
    const timeout = setTimeout(() => {
      disposable.dispose();
      resolve(null);
    }, 10_000);

    const disposable = vscode.workspace.onDidOpenTextDocument((doc) => {
      // The extension opens an untitled document with language "json"
      if (doc.uri.scheme === "untitled") {
        clearTimeout(timeout);
        disposable.dispose();
        // Small delay to let VS Code finish rendering
        setTimeout(() => {
          resolve(doc.getText().trimEnd());
        }, 100);
      }
    });
  });

  try {
    await vscode.commands.executeCommand("extension.executeJqCommand", {
      document,
      range,
      openResult: "editor",
    });
  } catch {
    // Command may throw on jq errors
  }

  const result = await resultPromise;

  // Close the result editor to clean up for next test
  if (result !== null) {
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    await sleep(150);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Expected results
// ---------------------------------------------------------------------------

type Expectation = string | ((output: string) => void);

const EXPECTED: Record<number, Expectation> = {
  1: '{\n  "name": "test",\n  "value": 42\n}',
  2: '{\n  "simple": true\n}',
  3: '"Alice"',
  4: '"deep"',
  5: '"works"',
  6: '{\n  "first": true\n}',
  7: "5",
  8: '[\n  "c",\n  "d"\n]',
  9: "[\n  40,\n  50\n]",
  10: "[\n  10,\n  20,\n  30\n]",
  11: "1\n2\n3",
  12: "1\n2\n3",
  13: '"JSON"\n"XML"',
  14: '42\n"hello"',
  15: "[\n  2,\n  4,\n  6\n]",
  16: '{\n  "user": "alice",\n  "title": "Dev"\n}\n{\n  "user": "alice",\n  "title": "Lead"\n}',
  17: '{\n  "name": "Bob"\n}',
  18: "20",
  19: '"John Doe"',
  20: "[\n  1,\n  2,\n  3,\n  4\n]",
  21: '[\n  "a",\n  "b",\n  "c",\n  "d"\n]',
  22: "[\n  5,\n  7,\n  8\n]",
  23: '"a"\n"c"',
  24: "[\n  11,\n  12,\n  13\n]",
  25: '{\n  "x": 2,\n  "y": 4,\n  "z": 6\n}',
  26: '[\n  "a",\n  "m",\n  "z"\n]',
  27: '[\n  "a",\n  "b",\n  1,\n  2\n]',
  28: "[\n  true,\n  false,\n  true\n]",
  29: "[\n  5,\n  3,\n  1,\n  0\n]",
  30: '[\n  "number",\n  "string",\n  "boolean",\n  "null",\n  "array",\n  "object"\n]',
  31: "[\n  1,\n  1,\n  2,\n  3,\n  4,\n  5,\n  6,\n  9\n]",
  32: (out) => {
    const arr = JSON.parse(out);
    assert.strictEqual(arr[0].name, "a");
    assert.strictEqual(arr[1].name, "b");
    assert.strictEqual(arr[2].name, "c");
  },
  33: (out) => {
    const arr = JSON.parse(out);
    assert.strictEqual(arr.length, 2);
  },
  34: "[\n  1,\n  2,\n  3,\n  4\n]",
  35: "[\n  1,\n  2,\n  3,\n  4\n]",
  36: "[\n  1,\n  2,\n  [\n    3,\n    [\n      4\n    ]\n  ]\n]",
  37: "[\n  5,\n  4,\n  3,\n  2,\n  1\n]",
  38: "10",
  39: "[\n  true,\n  false\n]",
  40: "[\n  0,\n  1,\n  2,\n  3,\n  4\n]",
  41: "[\n  0,\n  3,\n  6,\n  9,\n  12,\n  15,\n  18\n]",
  42: "60",
  43: "[\n  1,\n  3,\n  6,\n  10,\n  15\n]",
  44: '[\n  {\n    "key": "a",\n    "value": 1\n  },\n  {\n    "key": "b",\n    "value": 2\n  }\n]',
  45: '{\n  "prefix_x": 1,\n  "prefix_y": 2\n}',
  46: '{\n  "bar": 2,\n  "baz": 3\n}',
  47: "42",
  48: "true",
  49: "true",
  50: "true",
  51: (out) => {
    const m = JSON.parse(out);
    assert.strictEqual(m.captures[0].name, "digits");
    assert.strictEqual(m.captures[0].string, "123");
  },
  52: '{\n  "name": "hello",\n  "num": "42"\n}',
  54: '"h[e]ll[o] w[o]rld"',
  55: '"Name: Alice, Age: 30"',
  56: '[\n  "1",\n  "two",\n  "true",\n  "null"\n]',
  57: '"SGVsbG8sIFdvcmxkIQ=="',
  58: '"&lt;script&gt;alert(&apos;xss&apos;)&lt;/script&gt;"',
  59: '"hello%20world%2Ffoo"',
  60: (out) => {
    assert.ok(out.includes("Alice"));
    assert.ok(out.includes("Bob"));
  },
  61: '"negative"',
  62: '"boom"',
  63: "[\n  1,\n  3\n]",
  64: '"default"',
  65: "[\n  1,\n  2,\n  3,\n  4\n]",
  66: (out) => {
    const arr = JSON.parse(out);
    assert.ok(arr.some((p: string[]) => p.length === 1 && p[0] === "a"));
  },
  67: '{\n  "a": 2,\n  "b": [\n    4,\n    6\n  ]\n}',
  69: (out) => {
    assert.ok(out.includes("6"));
  },
  70: "[\n  1,\n  2,\n  3\n]",
  71: "[\n  5,\n  8\n]",
  72: "[\n  true,\n  false\n]",
  73: (out) => {
    const arr = JSON.parse(out);
    assert.ok(arr.includes(1));
    assert.ok(arr.includes(4));
  },
  74: '[\n  "foobar",\n  "foobaz"\n]',
  75: '"world"\n"goodbye_world"\n"there"',
  76: '"IBM"',
  77: '{\n  "up": "HELLO WORLD",\n  "down": "hello world"\n}',
  78: '{\n  "a": [\n    1,\n    2,\n    3\n  ]\n}',
  79: '"2015-03-05T23:51:47Z"',
  80: '{\n  "foo": 42,\n  "bar": 1\n}',
  81: '{\n  "bar": 1,\n  "foo": "default"\n}',
  82: '{\n  "items": [\n    "old",\n    "new"\n  ]\n}',
  83: (out) => {
    const obj = JSON.parse(out);
    assert.strictEqual(obj.users[0].score, 15);
    assert.strictEqual(obj.users[1].score, 3);
  },
  // jq options tests
  84: "Alice",
  85: '{"a":1,"b":2,"c":3}',
  86: '{\n  "a": 2,\n  "m": 3,\n  "z": 1\n}',
  87: "[\n  [\n    1,\n    2,\n    3\n  ]\n]",
  88: (out) => {
    const obj = JSON.parse(out);
    assert.strictEqual(obj.generated, true);
    assert.strictEqual(typeof obj.timestamp, "number");
  },
  89: (out) => {
    // --arg name "World" — the extension parses this and passes to jq
    assert.ok(out.includes("Hello"));
    assert.ok(out.includes("World"));
  },
  90: (out) => {
    const obj = JSON.parse(out);
    assert.strictEqual(obj.count, 42);
    assert.strictEqual(obj.type, "number");
  },
  91: (out) => assert.ok(out.includes("\t")),
  92: (out) => assert.ok(out.includes("    ")),
  93: "helloworld",
  94: (out) => {
    assert.ok(out.includes("a"));
    assert.ok(out.includes("z"));
  },
  // Multiline filters
  95: (out) => {
    assert.ok(out.includes("Alice"));
    assert.ok(out.includes("Carol"));
    assert.ok(!out.includes("Bob"));
  },
  96: '"medium"',
  97: "120",
  98: (out) => {
    const obj = JSON.parse(out);
    assert.strictEqual(obj.a, 15);
    assert.strictEqual(obj.b, 20);
  },
  100: (out) => {
    // --arg msg "from_editor" — verify the arg was passed through
    assert.ok(
      out.includes("from_editor"),
      "Expected output to contain 'from_editor'"
    );
  },
  // Edge cases
  110: "null",
  111: "{}",
  112: "[]",
  113: '""',
  114: "true",
  115: "true",
  116: "false",
  117: (out) => assert.ok(out.length > 0),
  118: (out) => {
    const val = Number.parseFloat(out);
    assert.ok(Math.abs(val - 0.000_000_000_000_002) < 1e-16);
  },
  119: "42.5",
  120: (out) => assert.ok(out.length > 0),
  121: "7",
  122: '"🎉🚀💻"',
  123: "[\n  1,\n  2,\n  3,\n  4,\n  5\n]",
  124: '"empty_key"',
  125: '"dotted_key"',
  126: '[\n  "number",\n  "string",\n  "boolean",\n  "null",\n  "array",\n  "object",\n  "number"\n]',
  127: '{\n  "a": 1,\n  "b": "was_null",\n  "c": "hello",\n  "d": "was_null"\n}',
  128: '[\n  "Alice",\n  "Bob"\n]',
  129: "42",
  130: '"just a string"',
  131: "",
  132: "[\n  1,\n  0.5,\n  0.3333333333333333\n]",
  133: "null",
  134: (out) => {
    const arr = JSON.parse(out);
    assert.strictEqual(arr.length, 3);
  },
  135: '"decoded"',
  136: (out) => {
    const obj = JSON.parse(out);
    assert.strictEqual(obj.sum, null);
    assert.strictEqual(obj.len, 0);
  },
  137: '{\n  "key": "only",\n  "value": "one"\n}',
  138: "43",
  139: "100",
  140: '"found"',
  141: '[\n  "x",\n  "x"\n]',
  142: "12",
  143: "6",
  144: "7",
  145: '"empty"',
};

// Tests to skip (network, shell, env, file redirect, known issues)
const SKIP_TESTS = new Set([
  53, // typo in playground file: "spli" instead of "split"
  68, // env.HOME — environment dependent
  99, // shell command with variable substitution
  101, // shell command
  102, // shell command
  103, // shell command
  104, // shell command (commented out)
  105, // URL — network
  106, // URL — network
  107, // URL — network
  108, // file redirect
  109, // file redirect append
]);

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

suite("Playground jqpg integration tests", function () {
  this.timeout(300_000);

  let document: vscode.TextDocument;
  let jqLines: number[];

  suiteSetup(async function () {
    this.timeout(30_000);

    // Open the playground file
    const uri = vscode.Uri.file(PLAYGROUND_FILE);
    document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);

    // Wait for extension activation
    await activateExtension();

    // Find all jq lines
    jqLines = findJqLines(document);
    assert.ok(
      jqLines.length >= 100,
      `Expected at least 100 jq lines, found ${jqLines.length}`
    );
  });

  suiteTeardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  // Generate a test for each expected query
  for (const [numStr, expected] of Object.entries(EXPECTED)) {
    const num = Number.parseInt(numStr, 10);
    if (SKIP_TESTS.has(num)) {
      continue;
    }

    test(`#${num} — jq filter`, async function () {
      this.timeout(15_000);

      // Find the jq line for this test number
      const jqLine = findJqLineForTest(document, num, jqLines);
      if (jqLine === null) {
        this.skip();
        return;
      }

      // Make sure the playground document is the active editor
      await vscode.window.showTextDocument(document);
      await sleep(200);

      const result = await executeQueryAtLine(document, jqLine);

      if (result === null && expected === "") {
        // Expected empty output — jq "empty" produces nothing
        return;
      }

      assert.ok(
        result !== null,
        `Test #${num}: expected output but got null (command may have failed)`
      );

      if (typeof expected === "function") {
        expected(result!);
      } else {
        assert.strictEqual(result, expected);
      }
    });
  }
});

/**
 * Find the jq line index corresponding to a test number by looking at
 * the comment block above each jq line.
 */
function findJqLineForTest(
  document: vscode.TextDocument,
  testNum: number,
  jqLines: number[]
): number | null {
  for (const line of jqLines) {
    const meta = getTestMeta(document, line);
    if (meta && meta.num === testNum) {
      return line;
    }
  }
  return null;
}
