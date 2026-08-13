// AUTO-GENERATED from content/skills.yaml and interview patterns — DO NOT EDIT DIRECTLY.
// Generated via `pnpm taxonomy:generate` (scripts/generate-skills-map.ts).

export const SKILL_NAMES: Record<string, string> = {
  "javascript.output": "Printing Output",
  "javascript.strings": "String Literals",
  "javascript.numbers": "Number Literals",
  "javascript.variables": "Variables",
  "javascript.arithmetic": "Arithmetic Expressions",
  "javascript.comparisons": "Comparison Expressions",
  "javascript.conditionals": "Conditional Logic",
  "javascript.functions": "Functions",
  "javascript.arrays": "Arrays",
  "javascript.objects": "Objects & Properties",
  "javascript.loops": "Loops & Iteration",
  "javascript.es6_destructuring": "Destructuring & Spread",
  "javascript.array_methods": "Array Higher-Order Methods",
  "javascript.closures": "Closures & Scope",
  "javascript.promises": "Promises & Async Flow",
  "javascript.async_await": "Async / Await",
  "javascript.fetch_api": "Fetch API & Networking",
  "javascript.dom_selection": "DOM Selection & Traversal",
  "javascript.dom_events": "DOM Event Handling",
  "javascript.error_handling": "Try / Catch & Error Boundaries",
  "javascript.defensive_coding": "Defensive Coding & Null Checks",
  "javascript.algorithms_two_pointers": "Two Pointers Pattern",
  "javascript.maps": "Map Lookups",
  "javascript.sets": "Set Membership",
  "javascript.stacks": "Stack LIFO",
  "javascript.queues": "Queue FIFO",
  "javascript.algorithms_binary_search": "Binary Search",
  "javascript.algorithms_sliding_window": "Sliding Window",
  "javascript.algorithms_monotonic_stack": "Monotonic Stack",
  "javascript.algorithms_deque_window": "Deque Window Maximum",
  "javascript.algorithms_sorting_strategy": "Sorting as a Strategy",
  "javascript.algorithms_recursion": "Recursion Basics",
  "javascript.algorithms_hash_maps": "Hash Map Lookups",
  "javascript.algorithms_prefix_sums": "Prefix Sums",
  "javascript.algorithms_intervals": "Interval Techniques",
  "javascript.algorithms_greedy": "Greedy Choice",
  "javascript.algorithms_dp": "Dynamic Programming Basics",
  "javascript.linked_lists": "Linked List Pointers",
  "javascript.binary_trees": "Binary Tree Traversal",
  "javascript.graphs": "Graph Representation",
  "javascript.algorithms_dfs": "Depth-First Search",
  "javascript.algorithms_bfs": "Breadth-First Search",
  "javascript.algorithms_backtracking": "Backtracking",
  "javascript.algorithms_heaps": "Heaps & Priority Queues",
  "javascript.algorithms_topo_sort": "Topological Sort",
  "javascript.algorithms_union_find": "Union-Find",
  "javascript.system_design_utility": "Utility Function Design",
  "javascript.modules_boundaries": "Modules & Boundaries",
  "javascript.separation_of_concerns": "Separation of Concerns",
  "javascript.event_driven": "Event-Driven Design",
  "javascript.repositories": "Repository Pattern",
  "javascript.adapters": "Adapter Pattern",
  "javascript.async_composition": "Async Composition",
  "javascript.composition_over_inheritance": "Composition Over Inheritance",
  "javascript.interfaces_contracts": "Interfaces & Contracts",
  "javascript.state_management": "State Management",
  "javascript.data_flow": "Data Flow",
  "javascript.service_layers": "Service Layers",
  "javascript.failure_design": "Error Boundaries & Failure Design",
  "javascript.dependency_direction": "Dependency Direction",
  "javascript.declarative_architecture": "Declarative Architecture",
  "javascript.refactoring": "Refactoring & Redundancy Reduction",
  "javascript.system_decomposition": "System Decomposition",
  "javascript.plugin_host": "Evolutionary Extension Points",
  "javascript.production_readiness": "Production Readiness",
  "javascript.assertions": "Assertions",
  "javascript.mocks": "Mock Functions",
  "javascript.test_seams": "Test Seams",
  "javascript.http_methods": "HTTP Methods",
  "javascript.http_status": "HTTP Status Codes",
  "javascript.query_strings": "Query Strings",
  "javascript.rest_routing": "REST Routing Basics",
  "javascript.data_normalization": "Data Normalization",
  "javascript.key_value_stores": "Key-Value Stores",
  "javascript.sql_select_basics": "SQL Select Basics",
  "javascript.data_joins": "Data Joins",
  "javascript.complexity_basics": "Complexity Basics",
  "javascript.work_reduction": "Work Reduction",
  "javascript.memoization": "Memoization",
  "javascript.batch_updates": "Batch Updates"
}

/**
 * Returns the human-readable name for a skill ID.
 * Falls back to a capitalised version of the last segment if the ID is unmapped.
 */
export function skillDisplayName(id: string): string {
  return SKILL_NAMES[id] ?? id.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? id
}

export const PATTERN_NAMES: Record<string, string> = {
  "arrays-and-strings": "Arrays & Strings",
  "backtracking": "Backtracking",
  "bfs": "Breadth-First Search",
  "binary-search": "Binary Search",
  "binary-trees": "Binary Trees",
  "design": "System Design",
  "dfs": "Depth-First Search",
  "dynamic-programming": "Dynamic Programming",
  "graphs": "Graphs",
  "greedy": "Greedy Choice",
  "hash-maps": "Hash Maps",
  "heaps": "Heaps & Priority Queues",
  "intervals": "Intervals",
  "linked-lists": "Linked Lists",
  "matrices": "Matrices",
  "prefix-sums": "Prefix Sums",
  "shortest-path": "Shortest Path",
  "sliding-window": "Sliding Window",
  "sorting": "Sorting",
  "stacks": "Stacks",
  "topological-sort": "Topological Sort",
  "two-pointers": "Two Pointers",
  "union-find": "Union-Find"
}

/**
 * Returns the human-readable display name for an interview pattern slug.
 */
export function patternDisplayName(pattern: string): string {
  return PATTERN_NAMES[pattern] ?? pattern.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
