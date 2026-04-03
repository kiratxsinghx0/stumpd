# `app/` — Wordle-style game (Football Wordle)

This folder holds the Next.js app route (`layout.tsx`, `page.tsx`), global styles (`globals.css`), and the main game UI in `components/games.tsx`.

We built a minimal, production-ready Wordle-style game focused on speed and core engagement loops. The system uses React state to manage current input, guesses, and keyboard feedback. A grid UI was implemented to mimic Wordle’s 6×5 structure, dynamically showing user input and past guesses. Core game logic compares each guessed letter against the daily answer, assigning statuses (correct, present, absent) that drive both tile colors and keyboard coloring.

In this variant, the answer is chosen from a small themed list and rotated by calendar day (`Date`-based index), rather than a large dictionary.

We initially faced issues with stale state and event listeners due to improper use of `useEffect`, `useCallback`, and state updates inside closures. These caused bugs like input overwriting and keys not responding. The fix was simplifying the architecture: removing unnecessary memoization, stabilizing the keyboard listener with a single mount `useEffect`, and relying on React’s state updates directly.

UX improvements included replacing alert popups with shake animation for invalid words and adding flip animation for guesses to simulate real Wordle feedback. Keyboard UI was structured into rows with dynamic coloring based on letter priority.

The result is a clean, fast, interactive MVP that mirrors Wordle behavior closely and is ready for viral features like sharing and streaks.
