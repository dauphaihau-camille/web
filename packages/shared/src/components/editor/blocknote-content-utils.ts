export function getInlineText(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return '';
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return '';
    }

    const text = (item as { text?: unknown }).text;
    return typeof text === 'string' ? text : '';
  }).join('');
}

export function isEmptyParagraphBlock(block: unknown) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return false;
  }

  const paragraph = block as {
    type?: unknown;
    content?: unknown;
    children?: unknown;
  };

  const hasChildren =
    Array.isArray(paragraph.children) && paragraph.children.length > 0;

  return paragraph.type === 'paragraph'
    && getInlineText(paragraph.content).trim().length === 0
    && !hasChildren;
}
