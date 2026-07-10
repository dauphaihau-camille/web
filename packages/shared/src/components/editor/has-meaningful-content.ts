export function hasMeaningfulContent(content: unknown[] | undefined) {
  if (!Array.isArray(content) || content.length === 0) {
    return false;
  }

  if (content.length > 1) {
    return true;
  }

  const [firstBlock] = content;

  if (!firstBlock || typeof firstBlock !== 'object' || Array.isArray(firstBlock)) {
    return true;
  }

  const block = firstBlock as {
    type?: unknown;
    content?: unknown;
    children?: unknown;
  };

  if (block.type !== 'paragraph') {
    return true;
  }

  if (Array.isArray(block.content) && block.content.length > 0) {
    return true;
  }

  if (Array.isArray(block.children) && block.children.length > 0) {
    return true;
  }

  return false;
}
