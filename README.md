# Whoopigo!

A room full of family. A little friendly competition.

Whoopigo is a browser-based family game show for mixed-age teams. Play with one browser controller per table, or use **one-projector mode**: one host manages every table and records their answers. A separate projector view is available in either mode. This repository contains a working **playable preview**, not a finished commercial service.

## Run locally

Requires Node.js 20 or newer. There are **no runtime dependencies** and no API keys.

```sh
npm start
```

Open http://localhost:3000. On Windows with PowerShell script execution restricted, use `npm.cmd start`, or `node server.js`.

Choose **Take a little peek** for a solo practice round. Choose a game card to create a live room. Players open the same website, select **Join a game**, and enter the room code and team name. The host can open a separate projector screen from the lobby. Keep the original host tab for controls.

Other devices cannot use your computer's `localhost` URL. For a local network test, use the computer's LAN address and allow the development server through the firewall as appropriate; for remote players, publish to an HTTPS host.

## Your own What's Hiding? pictures

Open **What's Hiding? → Upload pictures & write answers** (also available when setting up the full evening). Add a JPEG, PNG or WebP, a question, four different choices, the correct answer, and an optional story for the reveal. Save up to 12 rounds and edit or remove them later. Check **Use my picture pack** in setup to replace the built-in reveal scenes. Full evenings use all saved custom picture rounds.

Pictures are resized to a maximum 1600-pixel edge and encoded as JPEG in the browser, removing camera metadata. Portrait pictures are contained in the mosaic frame without cropping. Source files can be up to 15 MB; shared JPEGs are capped at 700 KB. The pack lives in IndexedDB on that browser; it is uploaded only when creating a room. Clearing browser storage removes saved packs. Account sync and pack import/export are not implemented.

Server image copies live in `data/uploads/` (or alongside `DATA_FILE`), outside the static directory and ignored by Git. Opaque image links are unlisted, but anyone who can view the room can view its images: this is not account-authenticated private photo storage. Links expire after 24 hours; expired files are pruned at startup, during upload and every 15 minutes. The store is capped at 128 MB / 300 files. Persist and back up the uploads directory with the room data on your host.

## One projector, no table phones

In game setup choose **One projector · host records all answers** and enter one table name per line (1–50 unique names). The tables are created immediately. The host can add tables in the lobby or between rounds. Public controller joins are disabled in this mode.

Recommended flow: every table discusses privately, then shows an A/B/C/D card together. The host records each table's choice, corrects mistakes if needed, and presses Reveal. Memory rounds let the host record three chosen details per table; Crowd still has a vote phase and a prediction phase. The game calculates points and keeps one shared scoreboard. Printable table cards are available at `/answer-cards.html` and linked from the lobby.

When a question timer finishes, projector mode waits for the host rather than scoring automatically. Memory study phases still transition after 18 seconds. The Tables button shows every table's score. With an extended display, open the separate projector tab and keep the recording panel on the host laptop; alternatively run the host view on the shared screen after all tables have committed. This uses one projector either way.

## The games

- **What's Hiding?** — six detailed original illustrated places, or your own picture pack, emerge through a synchronized 384-square mosaic over 45 seconds. Correct answers earn 100 points.
- **Guess the Crowd** — tables vote privately, then predict the most popular option. Tied favourites count; no votes means no points.
- **Family Detectives** — enter personal family questions, four answer choices, and an optional story. Fictional sample questions are clearly identified and must be replaced for a real family event.
- **Something Changed!** — study one of three original scenes for 18 seconds, then find three changed details among nine choices. Changes include missing objects, opened objects, and altered pictures as well as colours. Partial credit and a before/after comparison are included.
- **The Final Table** — knowledge questions with a host-selected 100-point classic or 200-point challenge.
- **Make a night of it** — plays all five games on the same scoreboard (15 questions with the included content).

There is no speed-based scoring, no elimination, and no penalty for a wrong answer. The host can pause and resume. Answers are scored on the server; snapshots withhold answer keys until the reveal. This is a casual family game: delivered images are inspectable in the browser, so it is not designed as an anti-cheat competition platform. Sound effects are optional and generated locally. Reduced-motion preferences are respected.

## Themes

The game engine is independent of theme selection. `lib/content.js` supplies question packs. Theme tokens live in `public/style.css`, and theme metadata lives in `public/app.js`.

- **Chanukah glow**: seasonal mystery illustrations, crowd questions, and final-round questions.
- **Everyday celebration**: general question pack and styling.
- **Birthday party**: starter colour variant using the general question pack and shared party artwork. A bespoke birthday asset pack is future work.

## Architecture

Node's HTTP server serves a dependency-free ES module frontend. Server-sent events push room updates; POST endpoints accept joins, answers, and host controls. Room/host credentials are generated with Node crypto. Host and team tokens are stored in that browser's local storage to support reconnection; the public projector view has no control token.

`lib/game.js` owns the state machine and scoring. `lib/content.js` owns themes and question data. `public/art.js` contains the unchanged menu illustrations and legacy scene fallbacks. `public/stage.js` creates deterministic mosaic sequences. Game layout styling lives in `public/game.css`; `public/party.css` supplies the shared purple party identity, colourful answer controls, playful typography and responsive card treatment. `public/app.js` renders the menu, setup, controllers, and game stages.

The normal server entry point persists rooms to `data/rooms.json`, ignored by Git. Set `DATA_FILE` to a file on a persistent disk in production. Writes replace the file atomically. On restart, active games restore in a paused state, preserving answers and scores; the host resumes them. Recovery uses the last saved activity checkpoint, so a few seconds may be replayed. Keep host/team browser storage: there is no account-based credential recovery yet. Inactive rooms expire after six hours. Back up the data file privately; it contains room tokens and family questions.

## Validation

```sh
npm run check
npm test
```

32 tests cover the original game flow plus custom-picture validation and scoring, upload/expiry/persistence, projector table management, host-only answer recording, corrected and delayed entries, host-paced transitions, projector memory/crowd rounds, public-state secrecy, and restart recovery. This is not a substitute for real event load or usability testing.

## Publishing

The server binds to `0.0.0.0` and uses the `PORT` environment variable, defaulting to 3000. It can run on a Node host, including a Replit Reserved VM. A `.replit` starter configuration is included. Run **one server instance** for this preview: the room state is not shared across replicas. Use HTTPS for an internet-facing preview and a host that supports long-lived SSE connections.

## Before selling

- Configure persistent production storage and independent backups. The local file store supports a single server process; it is not a distributed database or a tested disaster-recovery system.
- Family question templates are saved only in the host browser. Add account-based saved packs, import/export, and backups.
- The 50-team cap is a preview limit, **not a proven event capacity**. Test the intended network conditions and concurrency.
- New teams can join in the lobby or between rounds. Existing teams can reconnect with their browser token.
- Add room moderation, team removal, nonvisual alternatives for picture puzzles, and account-based host recovery.
- Expand and review the question packs for accuracy, family suitability, and different reading levels.
- Add video rounds, licensed music if desired, and fully bespoke seasonal artwork.
- Accounts, billing, physical clickers, and telephone dial-in are not implemented.

## Artwork

The current home-page hero is a custom vector illustration in `public/assets/game-night.svg`, with smiling mystery cards, stars and gentle motion. The gift and family-photo card illustrations are hand-authored SVG paths in `public/art.js`. The original generated hero remains archived in the assets folder, with its production prompt in `docs/art-direction.md`. Twelve new puzzle images and their generation/edit prompts are documented in `docs/puzzle-artwork.md`; web assets are in `public/assets/puzzles/`. Interaction graphics and animations use SVG and CSS. The app loads no third-party trackers, fonts, stock photos, or external media.
