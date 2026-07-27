/**
 * Helpers for world-class streaming response UX.
 */

/** Close incomplete markdown constructs so ReactMarkdown doesn't thrash mid-stream. */
export function stabilizeStreamingMarkdown(md: string): string {
  if (!md) return md;
  let out = md;

  // Unclosed fenced code block
  const fenceMatches = out.match(/^```/gm);
  if (fenceMatches && fenceMatches.length % 2 === 1) {
    out += '\n```';
  }

  // Unclosed inline code (odd backticks on last line)
  const lastLine = out.split('\n').pop() || '';
  const ticks = (lastLine.match(/`/g) || []).length;
  if (ticks % 2 === 1 && !lastLine.includes('```')) {
    out += '`';
  }

  return out;
}

export function streamStatusLabel(
  phase: 'idle' | 'thinking' | 'executing' | 'streaming' | 'done' | 'error',
  activityLogLength: number,
): string {
  switch (phase) {
    case 'thinking':
      return activityLogLength === 0 ? 'Starting…' : 'Thinking…';
    case 'executing':
      return 'Working…';
    case 'streaming':
      return 'Writing…';
    case 'done':
      return 'Done';
    case 'error':
      return 'Something went wrong';
    default:
      return '';
  }
}

/** True when the scroll container is near the bottom (user hasn't scrolled up). */
export function isNearBottom(el: HTMLElement | null, threshold = 120): boolean {
  if (!el) return true;
  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
  return remaining < threshold;
}
