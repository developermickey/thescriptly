export interface RoadmapStep {
  topic:       string
  label:       string
  description: string
  difficulty:  'Easy' | 'Medium' | 'Hard' | 'Mixed'
}

export interface Roadmap {
  id:          string
  title:       string
  description: string
  icon:        string
  color:       string
  gradient:    string
  estimatedWeeks: number
  steps:       RoadmapStep[]
}

export const ROADMAPS: Roadmap[] = [
  {
    id:          'dsa-fundamentals',
    title:       'DSA Fundamentals',
    description: 'Master the core data structures and algorithms every developer needs.',
    icon:        '🧱',
    color:       'text-blue-600',
    gradient:    'from-blue-500 to-cyan-500',
    estimatedWeeks: 8,
    steps: [
      { topic: 'Arrays',         label: 'Arrays',            description: 'Foundation of every algorithm — indexing, traversal, two pointers.',                                   difficulty: 'Easy'   },
      { topic: 'Strings',        label: 'Strings',           description: 'Pattern matching, anagrams, sliding window on character sequences.',                                   difficulty: 'Easy'   },
      { topic: 'Hash Table',     label: 'Hash Tables',       description: 'O(1) lookups, frequency counting, and grouping problems.',                                             difficulty: 'Easy'   },
      { topic: 'Linked List',    label: 'Linked Lists',      description: 'Pointer manipulation, reversal, cycle detection.',                                                     difficulty: 'Medium' },
      { topic: 'Stack',          label: 'Stacks & Queues',   description: 'LIFO/FIFO structures for parsing, monotonic problems, and BFS.',                                      difficulty: 'Medium' },
      { topic: 'Binary Search',  label: 'Binary Search',     description: 'Eliminate half the search space — works on sorted arrays and answer spaces.',                         difficulty: 'Medium' },
      { topic: 'Trees',          label: 'Trees',             description: 'DFS, BFS, LCA, path sums — the most common interview topic.',                                         difficulty: 'Medium' },
      { topic: 'Graphs',         label: 'Graphs',            description: 'BFS, DFS, topological sort, union-find for connectivity problems.',                                   difficulty: 'Hard'   },
      { topic: 'Dynamic Programming', label: 'Dynamic Programming', description: 'Memoization and tabulation for optimal substructure problems.',                               difficulty: 'Hard'   },
      { topic: 'Heap',           label: 'Heaps & Priority Queues', description: 'K-th element, merge K lists, streaming medians.',                                              difficulty: 'Hard'   },
    ],
  },
  {
    id:          'interview-prep',
    title:       'Top Interview Prep',
    description: 'The 75 patterns that appear in 90% of coding interviews at top companies.',
    icon:        '🎯',
    color:       'text-violet-600',
    gradient:    'from-violet-500 to-purple-600',
    estimatedWeeks: 6,
    steps: [
      { topic: 'Arrays',         label: 'Array Patterns',       description: 'Sliding window, two pointers, prefix sums.',                                                       difficulty: 'Mixed'  },
      { topic: 'Binary Search',  label: 'Binary Search',        description: 'Search in rotated arrays, first/last position.',                                                   difficulty: 'Medium' },
      { topic: 'Linked List',    label: 'Linked List Tricks',   description: 'Fast/slow pointer, merge, reorder.',                                                              difficulty: 'Medium' },
      { topic: 'Trees',          label: 'Tree Traversals',      description: 'Inorder, preorder, level order and their applications.',                                          difficulty: 'Medium' },
      { topic: 'Graphs',         label: 'Graph Algorithms',     description: 'BFS shortest path, DFS islands, union-find.',                                                     difficulty: 'Medium' },
      { topic: 'Dynamic Programming', label: 'DP Patterns',    description: '1D DP, 2D DP, interval DP — the classic 20 patterns.',                                            difficulty: 'Hard'   },
      { topic: 'Backtracking',   label: 'Backtracking',         description: 'Permutations, combinations, N-Queens.',                                                           difficulty: 'Hard'   },
      { topic: 'Heap',           label: 'Heap Problems',        description: 'Top K, merge sorted lists, task scheduler.',                                                      difficulty: 'Hard'   },
    ],
  },
  {
    id:          'beginner',
    title:       'Beginner Path',
    description: 'New to coding? Start here. No prior knowledge required.',
    icon:        '🌱',
    color:       'text-emerald-600',
    gradient:    'from-emerald-500 to-teal-500',
    estimatedWeeks: 4,
    steps: [
      { topic: 'Math',           label: 'Math & Logic',         description: 'FizzBuzz, prime numbers, GCD — build your logic muscle.',                                         difficulty: 'Easy'   },
      { topic: 'Arrays',         label: 'Basic Arrays',         description: 'Max/min, reverse, two sum — classic entry problems.',                                             difficulty: 'Easy'   },
      { topic: 'Strings',        label: 'Basic Strings',        description: 'Palindromes, reversal, character counting.',                                                      difficulty: 'Easy'   },
      { topic: 'Hash Table',     label: 'Maps & Sets',          description: 'Count frequencies, find duplicates, group anagrams.',                                             difficulty: 'Easy'   },
      { topic: 'Sorting',        label: 'Sorting Basics',       description: 'Understand what happens under the hood of sort().',                                               difficulty: 'Easy'   },
      { topic: 'Recursion',      label: 'Recursion',            description: 'Fibonacci, factorial, flatten — trust the recursive leap.',                                       difficulty: 'Medium' },
    ],
  },
  {
    id:          'faang-hard',
    title:       'FAANG Hard Track',
    description: 'Brutal problems that Google, Meta, and Amazon actually ask. Hard mode only.',
    icon:        '🔥',
    color:       'text-red-600',
    gradient:    'from-red-500 to-orange-500',
    estimatedWeeks: 12,
    steps: [
      { topic: 'Dynamic Programming', label: 'Advanced DP',     description: 'Knapsack variants, bitmask DP, DP on trees.',                                                    difficulty: 'Hard'   },
      { topic: 'Graphs',         label: 'Advanced Graphs',      description: 'Dijkstra, Bellman-Ford, SCC, bridges & articulation points.',                                     difficulty: 'Hard'   },
      { topic: 'Trie',           label: 'Tries',                description: 'Word search, autocomplete, XOR trie.',                                                            difficulty: 'Hard'   },
      { topic: 'Segment Tree',   label: 'Segment Trees',        description: 'Range queries, lazy propagation.',                                                                difficulty: 'Hard'   },
      { topic: 'Monotonic Stack', label: 'Monotonic Stack',     description: 'Next greater element, largest rectangle, trapping rain water.',                                  difficulty: 'Hard'   },
      { topic: 'Heap',           label: 'Multi-Heap Problems',  description: 'Median of stream, sliding window maximum.',                                                       difficulty: 'Hard'   },
      { topic: 'Backtracking',   label: 'Constrained Search',   description: 'Sudoku solver, word ladder, expression operators.',                                               difficulty: 'Hard'   },
      { topic: 'Math',           label: 'Math & Bit Tricks',    description: 'Bit manipulation, modular arithmetic, combinatorics.',                                            difficulty: 'Hard'   },
    ],
  },
]
