<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Codenames Generator app. A new `src/posthog.ts` module initialises the `posthog-js` SDK using environment variables and is imported by both `src/main.ts` and `src/ui.ts`. Twelve custom events are now captured across key user interactions: board generation, sharing, pack selection, custom word editing, view-mode switching, and the spymaster password unlock flow. No PII is sent in any event property. The Google Analytics `gtag.js` script already present in the project was left completely untouched.

| Event name | Description | File |
|---|---|---|
| `board_generated` | User clicked 'New Game' to generate a fresh random board | `src/main.ts` |
| `colors_shuffled` | User clicked 'Shuffle Secret' to reassign team colors while keeping the same words | `src/main.ts` |
| `view_mode_toggled` | User switched between Operative and Spymaster view modes | `src/main.ts` |
| `board_shared` | User opened the share modal to share the current board | `src/main.ts` |
| `pack_toggled` | User enabled or disabled a word pack for board generation | `src/main.ts` |
| `custom_word_saved` | User edited a card and saved a custom word on the board | `src/main.ts` |
| `custom_words_cleared` | User cleared all custom words from the board | `src/main.ts` |
| `shared_board_loaded` | A board was loaded from a shared URL hash on page load or hash change | `src/main.ts` |
| `spymaster_unlocked` | User successfully entered the correct password to unlock spymaster view | `src/main.ts` |
| `share_url_copied` | User copied the board share URL to clipboard | `src/ui.ts` |
| `share_password_copied` | User copied the spymaster password to clipboard | `src/ui.ts` |
| `spymaster_unlock_failed` | User entered an incorrect password when attempting to unlock spymaster view | `src/ui.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard:** [Analytics basics (wizard)](https://us.posthog.com/project/505929/dashboard/1827103)
- **Insight:** [Key actions overview (wizard)](https://us.posthog.com/project/505929/insights/FK2Sp1SR) — board generations, shares, custom words, and shuffles side by side
- **Insight:** [Board generations over time (wizard)](https://us.posthog.com/project/505929/insights/d5b5jBax) — daily new board generation trend
- **Insight:** [Board sharing funnel (wizard)](https://us.posthog.com/project/505929/insights/890FkIFZ) — conversion from board generation to sharing
- **Insight:** [Pack usage breakdown (wizard)](https://us.posthog.com/project/505929/insights/Mm09LkPG) — which word packs users toggle most
- **Insight:** [Spymaster unlock funnel (wizard)](https://us.posthog.com/project/505929/insights/2igS0fXQ) — shared board load → spymaster unlock conversion

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` and any onboarding scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_web/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
</wizard-report>
