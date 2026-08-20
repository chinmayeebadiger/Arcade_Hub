# Multithreading Implementation Plan

This project is a simple React arcade app, so the easiest and safest way to add multithreading is to use **Web Workers** in the frontend.

The goal is not to rewrite every game. The goal is to move one expensive piece of game logic off the main browser thread so the UI stays responsive.

## Recommended First Target

Start with **Tic-Tac-Toe AI**.

Why:

- The AI/minimax logic is separate from the UI.
- It is easier to test than real-time games.
- It is a good class-project example of multithreading.
- If it works well, the same pattern can be reused later.

## Phase 1: Identify Worker-Friendly Logic

Find logic that:

- Does not directly update React state.
- Does not touch the DOM.
- Takes input, calculates a result, and returns output.

For the first implementation, use the Tic-Tac-Toe AI move calculation.

Expected result:

- A clear function that accepts a board state.
- The function returns the AI's chosen move.

## Phase 2: Create a Web Worker

Create a new worker file:

```text
src/workers/tictactoeWorker.js
```

The worker should:

- Receive the current board from the game component.
- Run the AI move calculation.
- Send the selected move back to the component.

Simple message flow:

```js
// React component sends this
worker.postMessage({
  type: "GET_AI_MOVE",
  board,
});

// Worker sends this back
postMessage({
  type: "AI_MOVE_RESULT",
  move,
});
```

Expected result:

- The AI logic runs outside the main UI thread.
- The React component only receives the final move.

## Phase 3: Connect the Worker to Tic-Tac-Toe

Update:

```text
src/TicTacToe/tictactoe.jsx
```

The component should:

- Create the worker when the component loads.
- Send the board state to the worker when the AI needs to move.
- Listen for the worker response.
- Apply the returned AI move to React state.
- Clean up the worker when the component unmounts.

Expected result:

- Tic-Tac-Toe still plays the same.
- The AI calculation is handled by the worker.

## Phase 4: Add Basic Error Handling

Keep this simple.

If the worker fails:

- Log the error.
- Fall back to the existing in-component AI logic, if needed.
- Do not crash the game.

Expected result:

- The game still works even if the worker has a problem.

## Phase 5: Test the Feature

Run:

```bash
npm run dev
```

Then test:

- Tic-Tac-Toe loads correctly.
- The player can make a move.
- The AI responds with a valid move.
- Restarting the game still works.
- Leaving and returning to the page does not create duplicate workers.

Also run:

```bash
npm run lint
npm run build
```

Expected result:

- The app still builds successfully.
- No new lint errors are added.

## Phase 6: Optional Reuse

Only after Tic-Tac-Toe works, consider using workers in other games.

Good future candidates:

- Pac-Man ghost path calculation
- Tetris board collision checks
- Shooter enemy movement or collision checks

Avoid moving everything into workers. For a class project, one clean example is enough.

## Final Deliverable

The final implementation should include:

- `src/workers/tictactoeWorker.js`
- Updated `src/TicTacToe/tictactoe.jsx`
- A short explanation in the README saying that Tic-Tac-Toe AI uses a Web Worker

## Success Criteria

The implementation is successful if:

- The game behaves the same as before.
- The AI calculation happens in a Web Worker.
- The code is easy to explain in class.
- The project remains simple and readable.
