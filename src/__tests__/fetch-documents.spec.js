import fetchContent from "../fetch-document";

test("should", () => {
  expect(fetchContent("htldp://www.google.com").option(false)).toBe(true);
});
