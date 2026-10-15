# Revise & Resubmit survey website

## Once-only setup

1. Make a **public** GitHub repository called `revise-and-resubmit-survey`. Upload the contents of this folder to its repository root (not the outer ZIP folder).
2. In Settings → Pages → Build and deployment, select **GitHub Actions**. This publishes at `https://YOUR_USERNAME.github.io/revise-and-resubmit-survey/`.
3. Edit `worker/wrangler.toml` and replace `REPLACE_WITH_GITHUB_USERNAME` with your GitHub username (match capitalization of URLs). Use [Cloudflare Workers](https://developers.cloudflare.com/workers/get-started/guide/) to deploy the worker; run `npx wrangler deploy -c worker/wrangler.toml` from the repo root.
4. Create a fine-grained GitHub personal access token scoped ONLY to this repository, granting **Contents: Read and write**. Store it in the worker secret named `GH_TOKEN` via `npx wrangler secret put GH_TOKEN -c worker/wrangler.toml`. **Never commit the token.**
5. Set `submissionEndpoint` in `config.js` to your published Cloudflare Worker URL (typically `https://revise-and-resubmit-survey-writer.YOUR_SUBDOMAIN.workers.dev`). Push that change.
6. Submit a test response and verify one record appears in `data/responses.csv` (GitHub → Code → data → responses.csv). **Do not distribute the survey before this test succeeds.**

## Normal use: update only PowerPoint

- Put **one card per slide** in `cards/cards.pptx` and push the file to `main`.
- GitHub Actions will convert the slides to PNGs and generate `cards.json` on the deployed site. It may take a few minutes for the build to finish.
- At least **one slide** are required. Without a PowerPoint uploaded, the site uses clearly labeled demo cards, **not the real game deck**.
- Each card automatically gets a stable ID from PowerPoint's internal slide ID. Reordering or editing an existing slide normally preserves its ID, but replacing a slide with a new one does not. Responses retain the old ID for analysis.
- Optional: after the first workflow run, download the generated `cards.json` from the live site, then use its IDs in `card_overrides.json` to set human-readable names, answer choices, the correct option, or disabled cards. This is only needed to tailor multiple-choice comprehension to the real rules. If you change `card_overrides.json`, commit it to publish the changes.

## Understanding the responses

- **Each survey submission appends one row** to `data/responses.csv`, one row per evaluated card, along with a respondent UUID, card ID and game.
- To download results: GitHub → `data/responses.csv` → download raw CSV.
- **WARNING:** If this repository is public, all response data and commit history are public. Participants should not provide identifying information. For confidential human-subject research, use a private response repository and configure the worker to write there instead.
- GitHub commits on every response; this approach is best for **small pilots**, not large or high-concurrency studies.
- The form's questions are the same across cards, but default multiple-choice comprehension answers are generic. Replace through `card_overrides.json` before actual research use.
- A non-authenticated public form can receive spam and fabricated responses. Consider bot prevention for a formal study.

## Local preview

Run `python -m http.server 8000` from the repository root and open `http://localhost:8000`. With no configured Worker, submitted answers are stored **only in the browser** for preview, not the GitHub CSV.

## Current survey deck

The supplied PowerPoint is installed at `cards/cards.pptx`. Each participant evaluates one random active card. `card_overrides.json` excludes answer, reference, and template slides from assignment. The uploaded-deck collection round resets previous browser preview responses and progress; the response CSV currently contains only its header.
