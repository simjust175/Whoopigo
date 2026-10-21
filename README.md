# Whoopigo!

A room full of family. A little friendly competition.

Whoopigo is a browser-based family game show for mixed-age teams, with a host screen, a separate projector view, and one browser controller per team. This repository contains a working **playable preview**, not a finished commercial service.

## Run locally

Requires Node.js 20 or newer. There are **no runtime dependencies** and no API keys.

```sh
npm start
```

Open http://localhost:3000. On Windows with PowerShell script execution restricted, use `npm.cmd start`, or `node server.js`.

Choose **Take a little peek** for a solo practice round. Choose a game card to create a live room. Players open the same website, select **Join a game**, and enter the room code and team name. The host can open a separate projector screen from the lobby. Keep the original host tab for controls.

Other devices cannot use your computer's `localhost` URL. For a local network test, use the computer's LAN address and allow the development server through the firewall as appropriate; for remote players, publish to an HTTPS host.

## The games

- **What's Hiding?** — progressively uncover an original vector illustration. Correct answers earn 100 points.
- **Guess the Crowd** — tables vote privately, then predict the most popular option. Tied favourites count; no votes means no points.
- **Family Detectives** — enter personal family questions, four answer choices, and an optional story. Fictional sample questions are clearly identified and must be replaced for a real family event.
- **Something Changed!** — study a scene for 12 seconds, then identify three objects whose colours changed. Partial credit is available.
- **The Final Table** — knowledge questions with a host-selected 100-point classic or 200-point challenge.
- **Make a night of it** — plays all five games on the same scoreboard (15 questions with the included content).

There is no speed-based scoring, no elimination, and no penalty for a wrong answer. The host can pause and resume. Answers are scored on the server; clients do not receive correct answers before the reveal. Sound effects are optional and generated locally. Reduced-motion preferences are respected.

## Themes

The game engine is independent of theme selection. `lib/content.js` supplies question packs. Theme tokens live in `public/style.css`, and theme metadata lives in `public/app.js`.

- **Chanukah glow**: seasonal mystery illustrations, crowd questions, and final-round questions.
- **Everyday celebration**: general question pack and styling.
- **Birthday party**: starter colour variant using the general question pack and shared party artwork. A bespoke birthday asset pack is future work.

## Architecture

Node's HTTP server serves a dependency-free ES module frontend. Server-sent events push room updates; POST endpoints accept joins, answers, and host controls. Room/host credentials are generated with Node crypto. Host and team tokens are stored in that browser's local storage to support reconnection; the public projector view has no control token.

`lib/game.js` owns the state machine and scoring. `lib/content.js` owns themes and question data. `public/art.js` contains deterministic vector illustrations and memory puzzles. `public/app.js` renders the menu, setup, controllers, and game stages.

## Validation

```sh
npm run check
npm test
```

Tests cover host authorization, answer secrecy, duplicate submissions, scoring, timed transitions, pause/resume, crowd ties, empty voting, partial memory scoring, custom questions, a complete five-game evening, and a 50-team simulated round. This is not a substitute for real event load or usability testing.

## Publishing

The server binds to `0.0.0.0` and uses the `PORT` environment variable, defaulting to 3000. It can run on a Node host, including a Replit Reserved VM. A `.replit` starter configuration is included. Run **one server instance** for this preview: the room state is not shared across replicas. Use HTTPS for an internet-facing preview and a host that supports long-lived SSE connections.

## Before selling

- Rooms and scores currently live in memory and are lost on a server restart. Add persistent storage and recovery before paid events.
- Family question templates are saved only in the host browser. Add account-based saved packs, import/export, and backups.
- The 50-team cap is a preview limit, **not a proven event capacity**. Test the intended network conditions and concurrency.
- New teams join only in the lobby. Existing teams can reconnect with their browser token.
- Add room moderation, team removal, accessible alternatives for colour-change puzzles, and robust host recovery.
- Expand and review the question packs for accuracy, family suitability, and different reading levels.
- Add photo/video questions, licensed music if desired, and fully bespoke seasonal artwork.
- Accounts, billing, physical clickers, and telephone dial-in are not implemented.

## Artwork

The hero artwork is original AI-generated artwork created with the built-in image-generation tool. Its production prompt is saved in `docs/art-direction.md`. Game illustrations and interaction graphics are authored in SVG and CSS. The app loads no third-party trackers, fonts, stock photos, or external media.

