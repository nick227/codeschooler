/**
 * Canonical display names for all skill IDs, sourced from content/skills.yaml.
 * Skills are append-only (they never move or get renamed), so this map stays
 * valid across curriculum reorganisations. Add new entries when new skills are
 * introduced in the YAML.
 */
export const SKILL_NAMES: Record<string, string> = {
  'javascript.output':                        'Printing Output',
  'javascript.strings':                       'String Literals',
  'javascript.numbers':                       'Number Literals',
  'javascript.variables':                     'Variables',
  'javascript.arithmetic':                    'Arithmetic Expressions',
  'javascript.comparisons':                   'Comparison Expressions',
  'javascript.conditionals':                  'Conditional Logic',
  'javascript.functions':                     'Functions',
  'javascript.arrays':                        'Arrays',
  'javascript.objects':                       'Objects & Properties',
  'javascript.loops':                         'Loops & Iteration',
  'javascript.es6_destructuring':             'Destructuring & Spread',
  'javascript.array_methods':                 'Array Higher-Order Methods',
  'javascript.closures':                      'Closures & Scope',
  'javascript.promises':                      'Promises & Async Flow',
  'javascript.async_await':                   'Async / Await',
  'javascript.fetch_api':                     'Fetch API & Networking',
  'javascript.dom_selection':                 'DOM Selection & Traversal',
  'javascript.dom_events':                    'DOM Event Handling',
  'javascript.error_handling':                'Try / Catch & Error Boundaries',
  'javascript.defensive_coding':              'Defensive Coding & Null Checks',
  'javascript.algorithms_two_pointers':       'Two Pointers Pattern',
  'javascript.maps':                          'Map Lookups',
  'javascript.sets':                          'Set Membership',
  'javascript.stacks':                        'Stack LIFO',
  'javascript.queues':                        'Queue FIFO',
  'javascript.algorithms_binary_search':      'Binary Search',
  'javascript.algorithms_sliding_window':     'Sliding Window',
  'javascript.algorithms_recursion':          'Recursion Basics',
  'javascript.algorithms_hash_maps':          'Hash Map Lookups',
  'javascript.algorithms_prefix_sums':        'Prefix Sums',
  'javascript.algorithms_intervals':          'Interval Techniques',
  'javascript.algorithms_greedy':             'Greedy Choice',
  'javascript.algorithms_dp':                 'Dynamic Programming Basics',
  'javascript.linked_lists':                  'Linked List Pointers',
  'javascript.binary_trees':                  'Binary Tree Traversal',
  'javascript.graphs':                        'Graph Representation',
  'javascript.algorithms_dfs':                'Depth-First Search',
  'javascript.algorithms_bfs':                'Breadth-First Search',
  'javascript.algorithms_backtracking':       'Backtracking',
  'javascript.algorithms_heaps':              'Heaps & Priority Queues',
  'javascript.algorithms_topo_sort':          'Topological Sort',
  'javascript.algorithms_union_find':         'Union-Find',
  'javascript.system_design_utility':         'Utility Function Design',
  'javascript.modules_boundaries':            'Modules & Boundaries',
  'javascript.separation_of_concerns':        'Separation of Concerns',
  'javascript.event_driven':                  'Event-Driven Design',
  'javascript.repositories':                  'Repository Pattern',
  'javascript.adapters':                      'Adapter Pattern',
  'javascript.async_composition':             'Async Composition',
  'javascript.composition_over_inheritance':  'Composition Over Inheritance',
  'javascript.interfaces_contracts':          'Interfaces & Contracts',
  'javascript.state_management':              'State Management',
  'javascript.data_flow':                     'Data Flow',
  'javascript.service_layers':                'Service Layers',
  'javascript.failure_design':                'Error Boundaries & Failure Design',
  'javascript.dependency_direction':          'Dependency Direction',
  'javascript.declarative_architecture':      'Declarative Architecture',
  'javascript.refactoring':                   'Refactoring & Redundancy Reduction',
  'javascript.system_decomposition':          'System Decomposition',
  'javascript.plugin_host':                   'Evolutionary Extension Points',
  'javascript.production_readiness':          'Production Readiness',
}

/**
 * Returns the human-readable name for a skill ID.
 * Falls back to a capitalised version of the last segment if the ID isn't
 * in the map yet (e.g. a newly authored skill not yet registered here).
 */
export function skillDisplayName(id: string): string {
  return SKILL_NAMES[id] ?? id.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? id
}
