// Conventional Commits, as described in skills/commit-conventions/SKILL.md.
// Checked locally by .husky/commit-msg and on every pull request by the Jenkinsfile.
export default {
  extends: ["@commitlint/config-conventional"],
  // Bitbucket's merge commits: "Pull request #551: IIC-2163 hmac server signing"
  ignores: [(message) => /^Pull request #\d+:/.test(message)],
  // A commit written by an AI agent starts with "[ai] ": the type is read after that prefix
  parserPreset: {
    parserOpts: {
      headerPattern: /^(?:\[ai\] )?(\w*)(?:\((.*)\))?!?: (.*)$/,
      breakingHeaderPattern: /^(?:\[ai\] )?(\w*)(?:\((.*)\))?!: (.*)$/,
    },
  },
  rules: {
    // Subjects often start with a ticket id or a class name: "IIC-2163 …", "InkCanvas …"
    "subject-case": [0],
    "scope-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 120],
    // Subject only is the house style; a warning, so a body that explains a why still goes through
    "body-empty": [1, "always"],
  },
};
