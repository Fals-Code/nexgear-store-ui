---
activation: always
---

# NEXGEAR PROJECT RULES

## Product Requirement

- Treat BRIEF UAS WORKSHOP UI.pdf as the primary product requirement document.
- Preserve all required storefront and administrator pages.
- Maintain desktop and mobile compatibility.
- Prioritize compatibility, flow, layout structure, color, typography, content, and visual assets according to the UAS rubric.

## Technology

- Use semantic HTML5, CSS3, and Vanilla JavaScript ES6+.
- Do not introduce React, Next.js, Vue, Angular, Svelte, shadcn, or another frontend framework.
- Translate React or Framer Motion references into CSS and Vanilla JavaScript.
- Prefer CSS transforms and opacity for animation.
- Avoid inline JavaScript handlers and global scope pollution.
- Use modules, closures, classes, CustomEvents, and data attributes where appropriate.

## Design

- Preserve the NEXGEAR dark gaming identity.
- Use neon cyan selectively as an accent.
- Use Orbitron for intentional display headings.
- Use Inter for body text and interface elements.
- Maintain consistent tokens for color, spacing, typography, radius, shadow, and interaction states.

## Accessibility

- Preserve visible focus indicators.
- Support keyboard navigation.
- Prefer semantic HTML before ARIA.
- Maintain sufficient text contrast.
- Support reduced motion.
- Keep touch targets usable on mobile.

## Architecture

- Keep reusable components modular.
- Preserve backend-ready HTML structure.
- Do not fabricate ratings, reviews, stock claims, warranties, buyer counts, or commercial evidence.
- Do not add fake purchase claims or misleading actions.
- Do not modify unrelated pages during scoped fixes.

## Cost and Context Control

- Work on only one page, component, or user flow per task.
- Do not scan the entire repository unless explicitly requested.
- Read only files inside the declared scope and their direct dependencies.
- Use no more than two skills per task unless strictly required.
- Do not use subagents unless explicitly requested.
- Start with audit-only mode before editing.
- Limit audits to the ten highest-impact findings.
- Prefer deterministic validation scripts over model-based guessing.
- Stop if a required change falls outside the allowed file list.
- Do not repeatedly reread files already analyzed in the same task.
- Use existing project documentation as context instead of regenerating repository summaries.

## Verification

Before declaring work complete:

1. State the root cause.
2. List exact files changed.
3. Run only tests relevant to the scoped change.
4. Report commands executed and actual results.
5. Report remaining risks.
6. Never claim a test passed unless it was executed.
