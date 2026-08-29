import { cn } from '@shared/lib/utils';

const streamTailLength = 6;

export function StreamingText({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const tailStartIndex = Math.max(0, content.length - streamTailLength);
  const stableText = content.slice(0, tailStartIndex);
  const tailText = content.slice(tailStartIndex);

  return (
    <p className="text-[13px] leading-relaxed text-foreground">
      {stableText}
      {tailText ? <span className="stream-tail">{tailText}</span> : null}
      <span
        aria-hidden="true"
        data-slot="stream-caret"
        className={cn('stream-caret', isStreaming && 'is-streaming')}
      />
    </p>
  );
}
