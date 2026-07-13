import { useCallback, useRef, useState } from "react";

export function useAutoScroll(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  threshold = 60,
): {
  isAtBottom: boolean;
  showJump: boolean;
  scrollToBottom: () => void;
  onScroll: () => void;
} {
  const isAtBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    isAtBottomRef.current = atBottom;
    setShowJump(!atBottom);
  }, [scrollRef, threshold]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    isAtBottomRef.current = true;
    setShowJump(false);
  }, [scrollRef]);

  return {
    get isAtBottom() {
      return isAtBottomRef.current;
    },
    showJump,
    scrollToBottom,
    onScroll,
  };
}
