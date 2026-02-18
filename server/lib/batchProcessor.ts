/**
 * Batch Processor Utility
 * Efficiently processes large arrays in parallel batches
 *
 * Expected improvement: 3x speedup for template rendering/formatting
 */

/**
 * Process an array in parallel batches
 * @param items - Array of items to process
 * @param batchSize - Number of items to process concurrently
 * @param processor - Async function to process each item
 * @returns Processed results in original order
 *
 * @example
 * ```ts
 * // Process 100 templates in batches of 15
 * const files = await processBatch(templates, 15, async (template) => {
 *   const rendered = renderTemplate(template.path, context);
 *   return formatCode(rendered, template.parser);
 * });
 * ```
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => processor(item, i + batchIndex)),
    );

    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }
  }

  return results;
}

/**
 * Map over an array in parallel batches (preserves order)
 * @param items - Array of items to map
 * @param batchSize - Concurrency limit
 * @param mapper - Async mapper function
 *
 * @example
 * ```ts
 * const formattedFiles = await batchMap(
 *   renderedFiles,
 *   10,
 *   async (file) => formatCode(file.content, file.parser)
 * );
 * ```
 */
export async function batchMap<T, R>(
  items: T[],
  batchSize: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  return processBatch(items, batchSize, mapper);
}

/**
 * Filter an array in parallel batches
 * @param items - Array of items to filter
 * @param batchSize - Concurrency limit
 * @param predicate - Async predicate function (returns true to keep item)
 *
 * @example
 * ```ts
 * const validFiles = await batchFilter(files, 10, async (file) => {
 *   return await validateFile(file);
 * });
 * ```
 */
export async function batchFilter<T>(
  items: T[],
  batchSize: number,
  predicate: (item: T, index: number) => Promise<boolean>,
): Promise<T[]> {
  const results = await processBatch(items, batchSize, predicate);
  return items.filter((_, index) => results[index]);
}

/**
 * Process multiple groups of items concurrently, then flatten results
 * Useful for processing file groups like model files, auth files, etc. in parallel
 *
 * @param groups - Array of item arrays to process
 * @param processor - Async function to process each group
 * @returns Flattened results from all groups
 *
 * @example
 * ```ts
 * const allFiles = await parallelGroups(
 *   [authGroup, modelGroup, featureGroup],
 *   async (group) => generateFilesForGroup(group)
 * );
 * ```
 */
export async function parallelGroups<T, R>(
  groups: T[][],
  processor: (group: T[], index: number) => Promise<R[]>,
): Promise<R[]> {
  const groupResults = await Promise.all(
    groups.map((group, index) => processor(group, index)),
  );

  return groupResults.flat();
}

/**
 * Execute multiple async tasks concurrently with a concurrency limit
 * Unlike processBatch, this works with tasks of different types
 *
 * @param tasks - Array of async functions to execute
 * @param concurrency - Maximum concurrent executions
 * @returns Array of results in original order
 *
 * @example
 * ```ts
 * const results = await concurrentTasks([
 *   () => generateAuthFiles(ir),
 *   () => generateModelFiles(ir),
 *   () => generateFeatureFiles(ir),
 * ], 3);
 * ```
 */
export async function concurrentTasks<R>(
  tasks: (() => Promise<R>)[],
  concurrency: number = 10,
): Promise<R[]> {
  const results: R[] = new Array(tasks.length);
  let taskIndex = 0;

  async function worker(): Promise<void> {
    while (taskIndex < tasks.length) {
      const index = taskIndex++;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    worker,
  );

  await Promise.all(workers);
  return results;
}
