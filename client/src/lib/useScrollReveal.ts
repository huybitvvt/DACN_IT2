import { useEffect, useRef } from 'react';

/**
 * Hook scroll-reveal: gắn class `.is-visible` cho mọi phần tử con có class
 * `.reveal` khi chúng lọt vào viewport. Hỗ trợ độ trễ theo thứ tự (stagger)
 * qua thuộc tính data-reveal-delay (ms).
 *
 * Dùng: gắn ref trả về vào phần tử cha bao quanh các khối `.reveal`.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    if (items.length === 0) return;

    // Nếu người dùng tắt chuyển động, hiện ngay.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = Number(el.dataset.revealDelay ?? 0);
            window.setTimeout(() => el.classList.add('is-visible'), delay);
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );

    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}
