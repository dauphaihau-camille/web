export function countContentBlocks(content: unknown[] | undefined): number {
  if (!Array.isArray(content)) {
    return 0;
  }

  return content.reduce<number>(
    (count, block) => count + countBlockTree(block),
    0,
  );
}

function countBlockTree(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 0;
  }

  const block = value as { children?: unknown };
  const children = Array.isArray(block.children) ? block.children : [];

  return 1 + children.reduce<number>(
    (count, child) => count + countBlockTree(child),
    0,
  );
}
