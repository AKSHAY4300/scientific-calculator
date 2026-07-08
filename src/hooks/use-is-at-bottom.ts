import { useEffect, useState } from "react";

export function useIsAtBottom(offset = 10) {
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.offsetHeight;
      
      if (documentHeight <= window.innerHeight) {
        setIsAtBottom(true);
        return;
      }
      
      if (scrollPosition >= documentHeight - offset) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    };
    
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [offset]);

  return isAtBottom;
}
