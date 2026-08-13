// Map high-frequency algorithm/data-structure tag tokens to canonical skill IDs
export const tagToSkill: Record<string, string> = {
  'binary-search': 'javascript.algorithms_binary_search',
  'bfs': 'javascript.algorithms_bfs',
  'dfs': 'javascript.algorithms_dfs',
  'monotonic-stack': 'javascript.algorithms_monotonic_stack',
  'prefix-sums': 'javascript.algorithms_prefix_sums',
  'heaps': 'javascript.algorithms_heaps',
  'heap': 'javascript.algorithms_heaps',
  'greedy': 'javascript.algorithms_greedy',
  'linked-list': 'javascript.linked_lists',
  'linked_lists': 'javascript.linked_lists',
  'set': 'javascript.sets',
  'stack': 'javascript.stacks',
  'stacks': 'javascript.stacks',
  'queues': 'javascript.queues',
  'queue': 'javascript.queues',
  'topological-sort': 'javascript.algorithms_topo_sort',
  'dp': 'javascript.algorithms_dp',
  'binary-trees': 'javascript.binary_trees',
  'matrix': 'javascript.arrays'
}

export function mapTagToSkill(tag: string | undefined): string | undefined {
  if (!tag) return undefined
  return tagToSkill[tag.toLowerCase()]
}

export default tagToSkill
