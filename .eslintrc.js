module.exports = {
  root: true,
  env: {
    jest: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "jest"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "airbnb-typescript/base",
    "prettier",
    "plugin:jest/recommended",
  ],
};
