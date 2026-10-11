# Four in a Row

A web version of the classic Four in a Row game, built with React and TypeScript. Play against a friend on the same screen or against the computer; the first to line up four discs wins.

## Features

- Two modes on a 7 × 6 board: two players on one screen, or one player against the computer
- A computer opponent that looks ten moves ahead
- Animated disc drop, with the winning four highlighted
- Player names and a running score (wins and draws) for each mode, remembered between visits
- The starting player alternates from game to game
- Works on desktop and phones, in light and dark themes (follows your system setting)
- Fully playable from the keyboard

## Rules

1. Players take turns dropping one disc into any column that is not full.
2. The disc falls to the lowest empty cell in that column.
3. The first player to get four of their discs in a row (horizontally, vertically or diagonally) wins.
4. If the board fills up with no four in a row, the game is a draw.

## Controls

| Action               | Mouse / touch                     | Keyboard                                               |
| -------------------- | --------------------------------- | ------------------------------------------------------ |
| Drop a disc          | Click or tap a column             | `1`–`7`, or focus a column and press `Enter` / `Space` |
| Move between columns | –                                 | `←` / `→`                                              |
| Rename a player      | Click the name on the player card | `Tab` to the name, then type                           |

## Getting started

You need [Node.js](https://nodejs.org/) 22.22.2 or newer (or 24.15 or newer on the 24 line) and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173.

To create and preview a production build:

```bash
pnpm build
pnpm preview
```

## Running the tests

The tests use [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/).

Run the whole suite once:

```bash
pnpm test
```

Re-run tests automatically as you edit:

```bash
pnpm test:watch
```

Run a single test file:

```bash
pnpm test src/game/rules.test.ts
```

What is covered:

- `src/game/rules.test.ts` – the game rules: gravity, full columns, wins in every direction, no false wins, draws
- `src/game/ai.test.ts` – the computer player: takes wins, blocks threats, beats random play, answers quickly
- `src/state/gameReducer.test.ts` – turn order, end of game, starting a new game
- `src/components/App.test.tsx` – the UI end to end: playing, winning, drawing, names, scores, keyboard, playing against the computer

## Linting and formatting

[ESLint](https://eslint.org/) checks the code for problems and [Prettier](https://prettier.io/) formats it.

```bash
pnpm lint
pnpm format
```

In VS Code, install the two recommended extensions when prompted; files are then formatted and auto-fixed on save.

## Project structure

```
src/
  game/         Pure game rules and the computer player, no React
  state/        Game state machine, drop timing, computer turns, localStorage persistence
  components/   React components and their CSS Modules
  styles/       Colour tokens for the light and dark themes
  test/         Test setup and board-building helpers
```

Dependencies point one way: components → state → game. The code in `src/game/` knows nothing about the UI. The computer player (`src/game/ai.ts`) is a minimax search with alpha-beta pruning that makes its moves through the same action a person's click does.

## Tech stack

React 19, TypeScript, Vite, CSS Modules, Vitest. There is no back end: names and scores are saved in the browser's `localStorage`.

## Roadmap

- Difficulty levels for the computer
- Online play

## License

[MIT](LICENSE) © Elad Lev
