# Workspace Rules & Directives

## 1. Git & PR Workflow
- Always label Git actions explicitly (*Branch*, *Commit*, *PR*, *Checks*, *Merge*, *Cleanup*).
- **Git Commit Author**: Always execute AI commits with direct authorship flags:
  `git -c user.name="Antigravity AI" -c user.email="antigravity-ai@users.noreply.github.com" commit -m "..."`
- **AI-Assisted PR Label**: Always attach `--label "ai-assisted"` when creating pull requests.
- Run `gh pr checks <pr>` and confirm all CI checks pass green before merging.
- Run `gh pr view <pr> --comments` and inspect PR feedback before merging.
- Merge via `gh pr merge --squash --delete-branch --admin`, delete local branches, and pull `main`.

## 2. Verification & Build
- Verify code with `npm run build` and `npm test` prior to submitting PRs.
- Do not rely on background `npm run dev` servers.

## 3. Licensing & UI Principles
- Keep repository public for free CI minutes while enforcing All Rights Reserved legal protection.
- In-memory NLP search (do not convert search text into filter pills).
- High aesthetic UI with framer-motion micro-animations and tactile feedback.
