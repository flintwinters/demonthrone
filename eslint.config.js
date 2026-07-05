export default [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
      },
    },
    rules: {
      complexity: ["error", { max: 6 }],
      "max-lines": ["error", { max: 160, skipBlankLines: true, skipComments: true }],
      "no-unused-vars": "error",
      "no-undef": "error",
    },
  },
];
