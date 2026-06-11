import type { MouseEvent } from 'react';

/** Stop mousedown focus so scroll containers don't jump when tapping buttons. */
export function preventFocusScroll(event: MouseEvent<HTMLElement>): void {
  event.preventDefault();
}
