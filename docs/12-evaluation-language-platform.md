# 12 - Evaluation & Language Platform

## Evaluation principle
The product should determine whether the learner accomplished the goal, not whether their text matches a reference answer.

## Evaluator registry
Curriculum declares checks; software implements them.

Initial evaluator types:
- source parses
- output equals / contains
- variable exists
- variable equals
- function exists
- function returns expected value
- passes test suite
- AST node exists
- AST pattern restriction where specifically taught
- complexity/performance threshold for selected interview tasks

Future evaluators:
- DOM state
- browser event behavior
- HTTP/API interactions
- SQL results
- filesystem/project checks

## Language adapter
```ts
interface LanguageAdapter {
  parse(source: string): ParseResult
  execute(source: string, input?: unknown): ExecutionResult
  diagnose(source: string): Diagnostic[]
  format(source: string): string
  inspect?(execution: ExecutionResult): RuntimeInspection
}
```

Initial implementation: `JavaScriptAdapter`.

Future adapters may include Python, TypeScript, Java, C#, Go, or others without changing curriculum navigation or progress architecture.

## Syntax highlighting
Highlighting should come from a real language grammar/tokenizer or editor language extension, not hand-authored regex rules. Error decoration is a separate visual layer from syntax token coloring.

## Sandbox requirement
User code execution must be isolated, resource-limited, cancellable, and unable to access privileged application/server resources.

Initial browser JavaScript runs in a disposable Web Worker. The runner enforces a hard timeout, terminates and recreates the worker, caps output, exposes no application credentials, and supports runtime reset. DOM code later runs in an isolated iframe. Network, storage, timers, DOM APIs, and similar capabilities are granted per challenge or project rather than globally.

A same-origin Web Worker protects interface responsiveness but is not, by itself, a hostile-code security boundary. The beginner slice denies common network, storage, and worker-spawning globals by default. Public-launch hardening requires an opaque, cookieless execution origin with a restrictive Content Security Policy before arbitrary untrusted code is treated as isolated.
