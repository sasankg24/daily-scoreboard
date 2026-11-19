# Moonshot Plan: Daily Scoreboard v2

TCSS 490 Artifact 5 (solo). Five weeks, Nov 9 to Dec 13, 2026. Final show and tell Mon Dec 7.

## The goal

Version 1 (Artifact 4) works, but only in one browser: one person pastes everyone's shares.
Version 2 is something the whole friend group uses every day, from their own phones:

- Each friend opens one link, joins the group, and submits their own results.
- Everyone sees the same live scoreboard: today's winners, the month, past months.
- It is deployed where the group can reach it, and the group actually uses it.
- **AI inside it:** a friend can upload a screenshot of their game result (or of the group chat)
  and a model reads the shares out of it. Code checks everything the model returns, the same
  way my Artifact 3 deadline extractor did.

Version 1's parsers and scoring rules (PLAN.md, R1 to R6) carry over unchanged.

## Weekly milestones

| Week | Dates | Milestone | Done when |
|---|---|---|---|
| 1 | Nov 9 - 15 | Decide, plan, scaffold | This plan, the backend choice, CLAUDE.md updated, log entry |
| 2 | Nov 16 - 22 | Shared data and deploy | Results are stored in a shared database; the site is live at a public link; two friends have submitted from their own phones |
| 3 | Nov 23 - 29 | Everyone, every day | Join link and names per phone; live updates; month and history views read from the database; tie rules (PLAN.md Q1 to Q3) settled with the group; installable on a phone home screen |
| 4 | Nov 30 - Dec 6 | AI screenshot reading | Upload a screenshot, the model extracts shares, code validates them, the user confirms before saving; API key stays on a server, never in the page |
| 5 | Dec 7 - 13 | Show, fix, finish | Show and tell Dec 7; fixes from the group's feedback; final portfolio card |

## Decisions still open

- **Backend:** decided in Week 2: Firebase (Firestore with anonymous sign-in), site still on
  GitHub Pages. Security rules are in `firestore.rules`.
- **Identity:** a name picked once per phone with a group join code, or real sign-in. Simpler
  first; real sign-in only if the group needs it.
- **AI model and where it runs:** a small serverless function holds the API key. Cost per
  screenshot and what happens when the model is wrong are part of the Week 4 design.

## Risks

- The group stops using it if submitting is slower than pasting into Snapchat. Measure: does
  everyone submit for a full week?
- Free-tier limits and API cost. Keep the AI feature optional and cheap.
- Security: the database must not let one friend edit another friend's results, and the API key
  must never reach the browser.

## How I work on it

- `main` always works and is what is deployed. Each piece of work goes on a branch and is
  merged by pull request.
- `LOG.md` gets an entry every working session: what I planned, what changed, what is next.
- `CLAUDE.md` tells the agent the plan, the rules, and where this plan lives.
