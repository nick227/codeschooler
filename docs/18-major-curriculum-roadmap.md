# 18 - Major Curriculum Roadmap & Comprehensive Content Expansion Master Plan

## 1. Executive Summary & Core Educational Philosophy

This document represents the master strategy and taxonomy blueprint for scaling the **Code Trainer** platform into a world-class curriculum containing **over 500 challenges, interactive projects, technical interview problems, and knowledge assessment items**.

### Core Philosophy: "Foundations → Linear-Time Thinking → Senior Software Composition"
The curriculum is engineered around a fundamental progression:
1. **Language & Computer Science Fundamentals (Categories 1–16):** From typing your first string and understanding variables to arrays, objects, functions, async flow, and core data structures.
2. **Linear-Time Thinking & Work-Reduction Algorithms (Categories 17–36):** Shifting from naive $O(N^2)$ brute force to optimal $O(N)$ / $O(N \log N)$ execution by answering the central question: *"How do I stop doing the same work again?"*
3. **Advanced Software Composition & Systems Architecture (Categories 37–56):** Moving beyond syntax trivia to teach how real-world software is assembled, decomposed, refactored, and maintained by senior engineers.

---

## 2. Orthogonal Taxonomy Architecture: Pillars vs. Categories

A core flaw in typical learning platforms is duplicating categories like "Learn Arrays" vs "Interview Arrays". In **Code Trainer**, **Pillars** and **Categories** are orthogonal dimensions.

```text
                                  PILLARS (How content is experienced)
                      ┌───────────────┬───────────────┬───────────────┬───────────────┐
                      │     Learn     │   Knowledge   │   Interview   │   Projects    │
                      │(Guided Steps) │ (Quizzes/Review)│ (Algorithms)  │ (Capstones)   │
 ┌────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
 │ Arrays             │ Guided drills │ Output quizzes│ 2-Sum lookup  │ Filtered list │
 ├────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
 │ Sliding Window     │ Window intro  │ State quiz    │ Max Subarray  │ Realtime chart│
 ├────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
 │ State Management   │ State basics  │ Anti-pattern  │ Store design  │ Kanban Board  │
 └────────────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
```

### The 4 Product Pillars
1. **Learn:** Guided, step-by-step interactive exercises with instant HUD feedback andReviewed hint ladders.
2. **Knowledge:** Answer-free public projections, mental-model conceptual checks, code output prediction, and anti-pattern code reviews.
3. **Interview:** Timed, LeetCode-style algorithmic challenges and frontend system design problems.
4. **Projects:** Multi-step, visually impressive capstone applications and flashy interactive widgets.

---

## 3. The 16 V1 Core Curriculum Categories (+ 4 V2 Expansions)

The core curriculum is organized into 16 foundational categories for V1, providing a complete path from true beginner to competent programmer:

```text
 1. Getting Started  ─────►  2. Values & Types ─────►  3. Variables & Assignment ─────►  4. Expressions & Operators
                                                                                                  │
 8. Objects          ◄─────  7. Arrays             ◄─────  6. Functions            ◄─────  5. Conditionals
      │
      ▼
 9. Loops & Iteration ───► 10. Scope & Execution ───► 11. Errors & Debugging   ───► 12. DOM & Browser
                                                                                                  │
16. Software Design  ◄───── 15. Algorithms         ◄───── 14. Data Structures      ◄───── 13. Async & APIs
```

### 3.1 The 16 Core V1 Categories
1. **Getting Started:** Syntax, running code, reading terminal/HUD output, fixing deliberate syntax errors.
2. **Values & Types:** Strings, numbers, booleans, `null`, `undefined`, basic type checks.
3. **Variables & Assignment:** `const`, `let`, variable re-assignment, naming conventions, immutability concepts.
4. **Expressions & Operators:** Arithmetic, comparison operators (`===`, `!==`), logical operators (`&&`, `||`, `??`), coercion.
5. **Conditionals:** `if`, `else if`, `else`, ternary operators, guard clause pattern, branching decision logic.
6. **Functions:** Declarations, parameters vs arguments, return values, arrow functions, callback functions.
7. **Arrays:** Indexing, zero-based bounds, mutation methods (`push`, `pop`), non-mutating methods (`slice`, `concat`), iteration.
8. **Objects:** Property access (dot notation vs bracket notation), property mutation, nested objects, `Object.keys/values`.
9. **Loops & Iteration:** `for`, `while`, `for...of`, `for...in`, accumulator patterns, early `break` and `continue`.
10. **Scope & Execution:** Lexical scope, block scope vs function scope, closures, execution context, call stack basics.
11. **Errors & Debugging:** Syntax vs runtime errors, reading stack traces, step-by-step tracing, defensive checks.
12. **DOM & Browser:** Query selection, dynamic DOM element creation, event handling, form input parsing, rendering.
13. **Async & APIs:** Event loop mechanics, Callbacks, Promises, `async/await`, Fetch API requests, error handling (`try/catch`).
14. **Data Structures:** Maps, Sets, Stacks (LIFO), Queues (FIFO), Singly Linked Lists, Trees, Graphs.
15. **Algorithms & Problem Solving:** Linear search, binary search, two pointers, sliding window, recursion, greedy, DP.
16. **Software Design & Projects:** Functional decomposition, state management, modularization, architecture, complete app assembly.

### 3.2 The 4 V2 Expansion Categories
17. **Testing:** Unit testing fundamentals, test seams, assertions, mock functions, contract testing.
18. **Web & HTTP:** HTTP methods (GET, POST, PUT, DELETE), status codes, headers, CORS, REST API design.
19. **Databases & Data:** Relational schemas, SQL basics, key-value stores, persistence abstractions, data normalization.
20. **Performance & Complexity:** Memory allocation, Garbage Collection, CPU profiling, DOM repaint/reflow optimization.

---

## 4. Advanced Software Composition Taxonomy (20 Senior Topics)

For advanced learners, the curriculum shifts away from syntax trivia to teach how real systems are assembled, decomposed, refactored, and maintained.

| Category | Senior Engineering Topic | Focus & Real-World Practical Challenge |
|---|---|---|
| **1** | **Modules & Boundaries** | `import`/`export`, public APIs, hiding internal implementation details. |
| **2** | **Separation of Concerns** | Decoupling UI rendering from state management and business logic. |
| **3** | **Composition Over Inheritance**| Building complex objects from small, reusable utility functions rather than deep class hierarchies. |
| **4** | **Dependency Direction** | Enforcing strict dependency hierarchies (e.g., UI depends on Domain; Domain depends on nothing). |
| **5** | **Interfaces & Contracts** | Defining stable method signatures and type contracts between software boundaries. |
| **6** | **State Management** | State ownership, derived state calculation, immutability, synchronization, mutation traps. |
| **7** | **Data Flow** | Tracing explicit uni-directional information flow across components and services. |
| **8** | **Event-Driven Design** | Custom event dispatchers, event listeners, pub/sub channels, decoupling emitters from handlers. |
| **9** | **Service Layers** | Separating orchestration and API business workflows from domain logic models. |
| **10** | **Repositories & Data Access** | Isolating storage persistence (`localStorage`, IndexedDB, REST API) behind repository interfaces. |
| **11** | **Declarative Architecture** | Driven by schemas, manifests, and registries instead of imperative `switch/if` chains. |
| **12** | **Plugin & Adapter Patterns** | Extending core system capabilities dynamically without editing core source code. |
| **13** | **Error Boundaries & Failure Design**| Retries with exponential backoff, fallback UI states, partial failure recovery. |
| **14** | **Concurrency & Async Composition**| Parallel execution (`Promise.all`), race conditions (`Promise.race`), cancellation (`AbortController`). |
| **15** | **Testing Architecture** | Unit tests, contract boundaries, test seams, dependency injection for testability. |
| **16** | **Refactoring & Redundancy Reduction**| Recognizing structural duplication, extracting clean abstractions, simplifying complex conditionals. |
| **17** | **System Decomposition** | Splitting monolithic app specifications into decoupled modules, domain services, and surface layers. |
| **18** | **Evolutionary Architecture** | Designing flexible extension points that allow codebases to evolve without speculative over-engineering. |
| **19** | **Vertical Slice Development** | Building one feature end-to-end across UI, business logic, persistence, and tests. |
| **20** | **Production Readiness** | Error logging, telemetry metrics, security boundary guards, graceful degradation, rollback safety. |

---

## 5. Algorithmic Problem-Solving & Linear-Time Thinking Taxonomy (20 Pattern Categories)

The core objective of the Interview / Algorithm curriculum is teaching the fundamental work-reduction transformation: **"How do I stop doing the same work again?"**

```text
  Naive Nested Loop Approach                    Optimal Linear-Time Transformation
 ┌───────────────────────────┐                 ┌───────────────────────────────────┐
 │   Brute Force Search      │                 │     Remember Prior Work           │
 │   Outer Loop (N)          │ ──────────────► │     Hash Lookup Table             │
 │     Inner Loop (N)        │  Transformation │     Single-Pass Scan              │
 │   Complexity: O(N²)       │                 │     Complexity: O(N)              │
 └───────────────────────────┘                 └───────────────────────────────────┘
```

### The 20 Algorithm Technique Categories
1. **Complexity & Linear-Time Thinking:** Big-O notation, recognizing $O(N^2)$ bottlenecks, single-pass reasoning, eliminating redundant calculations.
2. **Hash Maps & Sets:** Lookup tables, frequency counting, complement lookups (Two-Sum pattern), deduplication in $O(1)$ time.
3. **Two Pointers:** Inward pointers on sorted arrays, fast/slow pointers for cycle detection, partitioning techniques.
4. **Sliding Window:** Fixed & variable-size windows, maintaining running state, longest/shortest subarray problems.
5. **Prefix Sums & Running Calculations:** Cumulative sums array, range query calculations in $O(1)$ time, prefix/suffix state.
6. **Sorting as a Strategy:** Utilizing sorting ($O(N \log N)$) to simplify subsequent searches, canonical interval sorting.
7. **Binary Search:** Sorted array search, lower/upper bound searching, Binary Search on the Answer space.
8. **Stacks:** Parentheses matching, monotonic stack pattern (next greater element), expression parsing.
9. **Queues & Deques:** FIFO task processing, Breadth-First Search (BFS) queues, sliding window max deque.
10. **Linked Lists:** Pointer manipulation, list reversal, fast/slow pointer middle node finding, cycle detection.
11. **Binary Trees:** In-order/Pre-order/Post-order traversals, recursion, Binary Search Tree (BST) validation.
12. **DFS & Recursion:** Recursive exploration, tree depth computation, graph connected components.
13. **BFS & Level Search:** Shortest path in unweighted graphs, level-by-level tree traversal, multi-source BFS.
14. **Heaps / Priority Queues:** Min-Heap & Max-Heap, Top $K$ frequent elements, streaming median, task scheduling.
15. **Graphs:** Adjacency lists vs matrices, visited state tracking, connected components, cycle detection in directed graphs.
16. **Backtracking:** Decision tree exploration, combinations, permutations, subsets, constraint pruning.
17. **Greedy Algorithms:** Local optimal choice, interval scheduling, proving when greedy yields global optimum.
18. **Dynamic Programming:** Overlapping subproblems, state definition, recurrence relations, memoization (top-down), tabulation (bottom-up).
19. **Intervals & Sweep Techniques:** Merging overlapping intervals, event sorting (start/end points), sweep-line algorithm.
20. **Advanced Graph Techniques:** Topological Sort (Kahn's algorithm), Union-Find (Disjoint Set Union with path compression), Dijkstra's shortest path.

---

## 6. 12-Level Difficulty & Progression Architecture

Difficulty is an explicit metric (Levels 1 to 12) used across all categories to govern XP rewards, assistant hint ladders, and prerequisite gates:

| Level Scale | Level Name | Focus & Cognitive Scope | Primary Categories Covered |
|---|---|---|---|
| **Level 1** | **Syntax Micro-Wins** | Printing, string edits, literal values. | Getting Started, Values & Types |
| **Level 2** | **Variables & Primitives** | Reassignment, type casting, basic arithmetic. | Variables & Assignment, Expressions |
| **Level 3** | **Decision Logic** | `if/else`, strict equality, ternary operators. | Conditionals, Expressions |
| **Level 4** | **Functions & Loops** | Parameters, returns, `for`/`while` loops. | Functions, Loops & Iteration |
| **Level 5** | **Collections & Objects** | Array indexing, object property access. | Arrays, Objects, Scope |
| **Level 6** | **ES6+ & Functional** | Destructuring, `map`/`filter`/`reduce`. | Arrays, Scope & Execution |
| **Level 7** | **DOM & Stateful UI** | Query selection, event handling, forms. | DOM & Browser, Software Design |
| **Level 8** | **Async & APIs** | Promises, `async/await`, Fetch API. | Async & APIs, Errors & Debugging |
| **Level 9** | **Real-World Debugging** | Race conditions, memory leaks, stale closures. | Errors & Debugging, Software Composition |
| **Level 10** | **Linear-Time Algorithms**| Two Pointers, Sliding Window, Hash Maps. | Algorithms (Hash Maps, Sliding Window) |
| **Level 11** | **Advanced Data Structures**| Stacks, Queues, Binary Trees, Heaps. | Data Structures, Algorithms (Trees/DFS) |
| **Level 12** | **Systems Composition** | Mini VDOM, Custom Engines, Architecture. | Advanced Software Composition (1–20) |

---

## 7. Concrete Category Cross-Pillar Projections & Authoring Standards

To illustrate how categories project cleanly across all 4 pillars, consider the **Sliding Window** category:

```yaml
# Category: Sliding Window
# Pillar: Learn
id: sliding-window-learn-01
title: Introduction to Sliding Window
instruction: Complete `maxSubarraySum(arr, k)` using a fixed-size sliding window of size `k`.
starterCode: |
  function maxSubarraySum(arr, k) {
    // Maintain running window sum in O(N) time
  }
checks:
  - type: functionReturns
    name: maxSubarraySum
    args: [[2, 1, 5, 1, 3, 2], 3]
    value: 9
```

```yaml
# Category: Sliding Window
# Pillar: Interview
id: sliding-window-interview-01
title: Longest Substring Without Repeating Characters
instruction: Given a string `s`, find the length of the longest substring without repeating characters in O(N) time.
starterCode: |
  function lengthOfLongestSubstring(s) {
    // Use dynamic sliding window with character frequency map
  }
checks:
  - type: functionReturns
    name: lengthOfLongestSubstring
    args: ["abcabcbb"]
    value: 3
```

---

## 8. Automated Quality Assurance & Execution Roadmap

1. **Category Structure Alignment:** Complete (The 16 V1 Core Categories + 20 Advanced Software Composition Topics + 20 Algorithmic Problem-Solving Techniques are formally codified).
2. **Schema & Validator Health:** Verified with Zod content schemas in `packages/content-schema`.
3. **Automated Verification:** All code changes and YAML curriculum declarations pass `pnpm check` (typecheck, linting, unit tests, and Playwright E2E tests).
