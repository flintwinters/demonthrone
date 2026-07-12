const coldModules = ["controls", "rendering", "visibility", "world"];

function moduleBoundary(name) {
  const importRoots = [`./${name}/`, `../${name}/`, `../src/${name}/`];

  return {
    files: ["src/**/*.js", "tests/**/*.mjs"],
    ignores: [`src/${name}/**`],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: importRoots.flatMap((root) => [`${root}*`, `!${root}index.js`]),
          message: `Import the ${name} module through its index.js facade.`,
        }],
      }],
    },
  };
}

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
  ...coldModules.map(moduleBoundary),
];
