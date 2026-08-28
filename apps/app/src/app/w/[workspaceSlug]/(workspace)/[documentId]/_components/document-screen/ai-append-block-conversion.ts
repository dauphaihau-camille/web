type BasicTextBlock = {
  type: 'paragraph' | 'bulletListItem' | 'numberedListItem' | 'heading';
  content: Array<{ type: 'text'; text: string }>;
  props?: { level: number };
};

const headingPattern = /^(#{1,6})\s+(.+)$/;
const bulletPattern = /^[-*]\s+(.+)$/;
const numberedPattern = /^\d+[.)]\s+(.+)$/;

export function convertAiAppendResponseToBlocks(content: string): BasicTextBlock[] {
  const blocks = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(convertLineToBlock);

  return blocks.length > 0 ? blocks : [{ type: 'paragraph', content: [] }];
}

function convertLineToBlock(line: string): BasicTextBlock {
  const headingMatch = headingPattern.exec(line);

  if (headingMatch) {
    return {
      type: 'heading',
      props: { level: headingMatch[1].length },
      content: textContent(headingMatch[2]),
    };
  }

  const bulletMatch = bulletPattern.exec(line);

  if (bulletMatch) {
    return {
      type: 'bulletListItem',
      content: textContent(bulletMatch[1]),
    };
  }

  const numberedMatch = numberedPattern.exec(line);

  if (numberedMatch) {
    return {
      type: 'numberedListItem',
      content: textContent(numberedMatch[1]),
    };
  }

  return {
    type: 'paragraph',
    content: textContent(line),
  };
}

function textContent(text: string) {
  return [{ type: 'text' as const, text }];
}
