# Contributing

We gladly welcome pull requests to iinkTS. If you have any questions, or need help to solve a problem, feel free to stop by the [MyScript forum](https://developer-support.myscript.com/support/discussions/forums/16000096760).

To report a bug or ask for a feature, [open an issue](https://github.com/MyScript/iinkTS/issues/new/choose).

## Commit messages

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/). They are checked by [commitlint](https://commitlint.js.org/) (`commitlint.config.mjs`): locally by the `commit-msg` hook that `yarn install` sets up, and on every branch and pull request by the `Commit messages` stage of the Jenkinsfile. The release version is computed from them, so a wrong type ships a wrong version.

### Shape

```
type(scope): subject
```

- **`[ai] `**, first, on a commit written by an AI agent: lower-case, followed by one space. The type is read after it, so it changes nothing to the version
- **type**, lower-case, one of `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`, `style`, `revert`
- **scope**, optional, lower-case: the area touched (`canvas`, `client`, `manager`, `symbol-utils`, `examples`…). Several scopes are separated by a comma: `refactor(symbol-utils,manager): …`
- **`!`** right before the colon when the change breaks the public API
- **subject**: imperative mood ("add", not "added"), no final period, the ticket id at the end when there is one
- the whole line is at most 120 characters, aim for 72
- subject line only. A body is accepted with a warning, after a blank line, when the why is not obvious from the code

What the type does to the next version:

| Commit | Version bump |
|--------|--------------|
| `!` after the type, or a `BREAKING CHANGE:` footer | major |
| `feat` | minor |
| anything else | patch |
| `Pull request #…` merges, `chore(release): …` | none |

### Correct

```
feat(canvas): add zoomToFit to center the view on the content IIC-2042
fix(client): handle the WebSocket reconnection after a timeout
refactor(symbol-utils,manager): move the hit-testing into the symbol utils
fix(canvas)!: remove the never-emitted POINTEREVENTS IIC-2163
chore(deps): upgrade rollup to 4.x
[ai] fix(grabber): keep a gesture's pointer events on the canvas IIC-2184
```

### Incorrect, and how to fix them

| Rejected | commitlint says | Fixed |
|----------|-----------------|-------|
| `added stuff` | `type may not be empty`, `subject may not be empty` | `feat(menu): add the export entry to the context menu` |
| `Fix(canvas): keep the session` | `type must be lower-case` | `fix(canvas): keep the session` |
| `feature(canvas): add zoomToFit` | `type must be one of [build, chore, …]` | `feat(canvas): add zoomToFit` |
| `fix(Canvas): keep the session` | `scope must be lower-case` | `fix(canvas): keep the session` |
| `fix(canvas) keep the session` | `type may not be empty` (missing colon) | `fix(canvas): keep the session` |
| `fix(canvas):keep the session` | `type may not be empty` (missing space after the colon) | `fix(canvas): keep the session` |
| `fix (canvas): keep the session` | `type may not be empty` (space before the scope) | `fix(canvas): keep the session` |
| `fix(canvas): keep the session.` | `subject may not end with full stop` | `fix(canvas): keep the session` |
| `fix(canvas): ` | `subject may not be empty` | `fix(canvas): keep the session when only the solver changes` |
| `[AI] fix(canvas): keep the session` | `type may not be empty` (the prefix is lower-case) | `[ai] fix(canvas): keep the session` |
| `[ai]fix(canvas): keep the session` | `type may not be empty` (missing space after the prefix) | `[ai] fix(canvas): keep the session` |
| a 130-character subject | `header must not be longer than 120 characters` | shorten it; put the why in the ticket, or in a body |

These pass commitlint but are still wrong:

| Accepted, but wrong | Problem | Fixed |
|---------------------|---------|-------|
| `fix(canvas): BREAKING drop POINTEREVENTS` | "BREAKING" in the subject is not read: released as a patch | `fix(canvas)!: drop POINTEREVENTS` |
| `feat(canvas): fix the zoom when the canvas is empty` | a fix typed `feat` bumps the minor version | `fix(canvas): fix the zoom when the canvas is empty` |
| `chore: add zoomToFit` | a feature typed `chore` is released as a patch | `feat(canvas): add zoomToFit` |

### Fixing a rejected message

- Rejected by the hook: nothing was committed, run `git commit` again with the fixed message.
- Last commit, not pushed yet: `git commit --amend -m "fix(canvas): keep the session"`.
- Older commits on your branch, not merged yet: `git rebase -i origin/master`, mark them `reword`, then push with `--force-with-lease`.

Check a message without committing: `echo "fix(canvas): keep the session" | yarn commitlint`.

## CLA

In order to contribute, you must first agree to the **Contributor License Agreement** available [here](https://docs.google.com/forms/d/e/1FAIpQLSeyaBVFhAYhc7Vs0bIcZq_LSQY4j8vkE7losXGSHp60ytB-cA/viewform).

Make sure you read the article "[Contributing to Open Source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project)" to understand the contributing process.
