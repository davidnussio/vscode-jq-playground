import { describe, expect, test } from "vitest";
import { parseJqCommandArgs } from "../lib/command-line";

describe("Spawn jq command line", () => {
  test("extract jq command options and filter", () => {
    expect(parseJqCommandArgs("--arg data value .data")).toEqual([
      "--arg",
      "data",
      "value",
      ".data",
    ]);
    expect(parseJqCommandArgs("--arg data value .data | .[]")).toEqual([
      "--arg",
      "data",
      "value",
      ".data | .[]",
    ]);
    expect(
      parseJqCommandArgs(
        "[.[] | {message: .commit.message, name: .commit.committer.name, parents: [.parents[].html_url]}]"
      )
    ).toEqual([
      "[.[] | {message: .commit.message, name: .commit.committer.name, parents: [.parents[].html_url]}]",
    ]);
    expect(parseJqCommandArgs('. / ", "')).toEqual(['. / ", "']);
    expect(parseJqCommandArgs('--arg var "val 212" .value = $var')).toEqual([
      "--arg",
      "var",
      "val 212",
      ".value = $var",
    ]);

    expect(parseJqCommandArgs("-a . | .[]")).toEqual(["-a", ". | .[]"]);
    expect(parseJqCommandArgs("-a -e . | .[]")).toEqual([
      "-a",
      "-e",
      ". | .[]",
    ]);

    expect(parseJqCommandArgs("--only-for-plugin-test-purpose")).toEqual([
      "--only-for-plugin-test-purpose",
      "",
    ]);

    expect(
      parseJqCommandArgs("--only-for-plugin-test-purpose . | .[]")
    ).toEqual(["--only-for-plugin-test-purpose", ". | .[]"]);

    expect(
      parseJqCommandArgs("-M --only-for-plugin-test-purpose . | .[]")
    ).toEqual(["-M", "--only-for-plugin-test-purpose", ". | .[]"]);

    expect(parseJqCommandArgs("--arg var val '.value = $var'")).toEqual([
      "--arg",
      "var",
      "val",
      "'.value = $var'",
    ]);
  });
});
