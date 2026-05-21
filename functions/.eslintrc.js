module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
    "/*.js", // Ignore root-level demo/test scripts outside src.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "quotes": ["error", "double"],
    "@typescript-eslint/no-explicit-any": "off",
    "arrow-parens": "off",
    "comma-dangle": "off",
    "max-len": "off",
    "object-curly-spacing": "off",
    "operator-linebreak": "off",
    "padded-blocks": "off",
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
  },
};
