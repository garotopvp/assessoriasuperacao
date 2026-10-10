module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // Nova funcionalidade
        "fix", // Corre��o de bug
        "docs", // Documenta��o
        "style", // Formata��o
        "refactor", // Refatora��o
        "perf", // Performance
        "test", // Testes
        "chore", // Manuten��o
        "ci", // CI/CD
        "build", // Build system
      ],
    ],
    "subject-case": [0],
  },
};
