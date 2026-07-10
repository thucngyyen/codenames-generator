<wizard-report>
# PostHog post-wizard report

The wizard extended the existing PostHog integration in the Codenames Generator app. `posthog-js` was already installed and `src/posthog.ts` already initialized the SDK. Twelve events were pre-existing; three new events were added to fill funnel gaps — tracking when a user starts editing a word, cancels that edit, and closes the share modal. Environment variables were verified and written to `.env`. No PII is sent in any event property. Existing Google Analytics code was left completely untouched.

| Event name | Description | File |
|---|---|---|
| `board_generated` | User clicked "New Game" to generate a board | `src/main.ts` |
| `board_shared` | User opened the Share modal | `src/main.ts` |
| `shared_board_loaded` | A shared board URL was loaded | `src/main.ts` |
| `colors_shuffled` | User shuffled the color assignments | `src/main.ts` |
| `view_mode_toggled` | User toggled between Operative and Spymaster views | `src/main.ts` |
| `pack_toggled` | User enabled or disabled a word pack | `src/main.ts` |
| `spymaster_unlocked` | User successfully entered the spymaster password | `src/main.ts` |
| `custom_word_saved` | User saved a custom word to a board cell | `src/main.ts` |
| `custom_words_cleared` | User cleared all custom words | `src/main.ts` |
| `word_edit_started` | User clicked a card to begin editing a word | `src/main.ts` (**new**) |
| `spymaster_unlock_failed` | User entered an incorrect spymaster password | `src/ui.ts` |
| `share_url_copied` | User copied the share URL from the modal | `src/ui.ts` |
| `share_password_copied` | User copied the spymaster password from the modal | `src/ui.ts` |
| `word_edit_cancelled` | User cancelled an in-progress word edit without saving | `src/ui.ts` (**new**) |
| `share_modal_closed` | User closed the share modal | `src/ui.ts` (**new**) |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard:** [Analytics basics (wizard)](https://us.posthog.com/project/505929/dashboard/1827204)
- **Insight:** [Board generation trend (wizard)](https://us.posthog.com/project/505929/insights/8iTD7Lbd) — daily `board_generated` volume
- **Insight:** [Share-to-copy funnel (wizard)](https://us.posthog.com/project/505929/insights/ypyQcJKw) — `board_shared` → `share_url_copied` conversion
- **Insight:** [Spymaster unlock funnel (wizard)](https://us.posthog.com/project/505929/insights/KrswMlzU) — `view_mode_toggled` → `spymaster_unlocked` conversion
- **Insight:** [Word customization funnel (wizard)](https://us.posthog.com/project/505929/insights/XNnK6pWx) — `word_edit_started` → `custom_word_saved` conversion
- **Insight:** [Top actions breakdown (wizard)](https://us.posthog.com/project/505929/insights/BE9VGzKV) — volume comparison of major user actions

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_web/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
</wizard-report>
