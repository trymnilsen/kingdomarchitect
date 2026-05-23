# Code Guidelines

Conventions and practices for this repository. Goals: clarity, maintainability, and ease of contribution.

---

## General Principles

- **Readability over cleverness** — Prefer understandable code over fancy one-liners.
- **Comment the why, not the what** — Explain the rationale behind decisions, not the mechanics. Write for your future self.
- **No classes for ECS components or any data they reference** — Components and their data must be plain objects (POJOs) for serialization. Classes are fine for internal, non-serialized constructs like registries, custom data structures, and services.
- **No module-level singletons or mutable state** — Module scope should hold pure functions and type definitions, not runtime state.

---

## Exports and Imports

- **Always use named exports**, never default exports.
  ```typescript
  // Good
  export function createEntity() {}

  // Bad
  export default function createEntity() {}
  ```
- **No barrel exports** — Import directly from the file that defines the symbol. Re-export files hide where things actually live and create indirect coupling.

---

## Functions and Arguments

- **Prefer function declarations** over `const` arrow functions at module scope.
- **Use positional arguments** instead of a single destructured object parameter, where practical. Destructured objects are fine when there are many closely related parameters, but avoid using them as a catch-all bag for unrelated data.

---

## File Structure

- **Avoid generic files** like `types.ts`, `interfaces.ts`, or `utils.ts`. Prefer focused files named after their primary concept: `apple.ts`, `orange.ts` rather than `fruits.ts`.
- **Name files after their core exported symbol.**
- **Co-locate small, closely related helpers and types** with the implementation they belong to.

---

## TypeScript

- Use **explicit types** for function signatures and data structures.
- Favor type safety, avoid `any`, prefer `unknown` over `any`.
- Use **separate named types** instead of inline types where a type is reused, but keep them in the same file as the code that uses them rather than in a shared types file.

---

## Comments

- Use **JSDoc block comments** for functions and exported symbols.
  ```typescript
  /**
   * Finds the closest point on a line segment to the given point.
   * Uses vector projection to handle all edge cases correctly.
   * @param a Start of line segment
   * @param b End of line segment
   * @param p Point to test
   */
  export function closestPointOnLine(a: Point, b: Point, p: Point): Point {}
  ```
- **Do not use separator comments** like `// ----- Section -----` or `// ===== Section =====`.

### Writing good comments

What a comment must contain:

- **Make every comment earn its place.** If it only restates the signature in
  English, delete it. `Returns the current flags for a node` on
  `flagsFor(node): PointerFlags` adds nothing the types already say.
- **Cover what, why, and when. Leave how to the code.** Explain what a symbol
  represents, why it exists, and when a caller reaches for it. The mechanics are
  already visible below the comment.
- **Write down the decision and its reason.** The load-bearing line is the one
  that stops a future reader from undoing a choice, like "read fresh each render
  rather than stored, so it can't go stale."
- **Prefer a concrete example over abstraction.** "A button uses the pressed
  flag to draw itself pressed" lands faster than "components consume the flags."
- **Comment the surprising parts.** Constraints, invariants, gotchas, and the
  reason behind an odd construction. If deleting the comment loses nothing a
  reader could not get at a glance, it should not be there.

How a comment should read:

- **Write like a person, not a model.** No em dashes. No semicolons stitching
  two clauses into one sentence. No balanced-contrast cadence such as "it's a,
  not b" or "X but Y". Use plain, direct sentences. Two thoughts means two
  sentences.
- **When trimming, cut words, not the reason.** A shorter comment should still
  answer why the thing exists.
