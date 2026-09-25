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

- Comment why, not what or how. Do not make jsdoc comments that restates the name and arguments only.
- **Do not use separator comments** like `// ----- Section -----` or `// ===== Section =====`.
