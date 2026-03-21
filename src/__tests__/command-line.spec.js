import { parseCommandArgs } from "../lib/command-line";

describe("Spawn jq command line", () => {
  test("extract jq command options and filter", () => {
    expect(parseCommandArgs("--arg data value .data")).toEqual([
      "--arg",
      "data",
      "value",
      ".data",
    ]);
    expect(parseCommandArgs("--arg data value .data | .[]")).toEqual([
      "--arg",
      "data",
      "value",
      ".data | .[]",
    ]);
    expect(
      parseCommandArgs(
        "[.[] | {message: .commit.message, name: .commit.committer.name, parents: [.parents[].html_url]}]"
      )
    ).toEqual([
      "[.[] | {message: .commit.message, name: .commit.committer.name, parents: [.parents[].html_url]}]",
    ]);
    expect(parseCommandArgs('. / ", "')).toEqual(['. / ", "']);
    expect(parseCommandArgs('--arg var "val 212" .value = $var')).toEqual([
      "--arg",
      "var",
      "val 212",
      ".value = $var",
    ]);

    expect(parseCommandArgs("-a . | .[]")).toEqual(["-a", ". | .[]"]);
    expect(parseCommandArgs("-a -e . | .[]")).toEqual(["-a", "-e", ". | .[]"]);

    expect(parseCommandArgs("--only-for-plugin-test-purpose")).toEqual([
      "--only-for-plugin-test-purpose",
      "",
    ]);

    expect(parseCommandArgs("--only-for-plugin-test-purpose . | .[]")).toEqual([
      "--only-for-plugin-test-purpose",
      ". | .[]",
    ]);

    expect(
      parseCommandArgs("-M --only-for-plugin-test-purpose . | .[]")
    ).toEqual(["-M", "--only-for-plugin-test-purpose", ". | .[]"]);

    expect(parseCommandArgs("--arg var val '.value = $var'")).toEqual([
      "--arg",
      "var",
      "val",
      "'.value = $var'",
    ]);
  });
});
