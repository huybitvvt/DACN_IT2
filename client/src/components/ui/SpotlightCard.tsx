import { useRef, type ReactNode, type MouseEvent } from 'react';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Bật nghiêng 3D nhẹ theo con trỏ. */
  tilt?: boolean;
  /** Cường độ nghiêng tối đa (độ). */
  tiltMax?: number;
}

/**
 * Thẻ cao cấp: vầng sáng (spotlight) bám theo con trỏ + nghiêng 3D tuỳ chọn.
 * Đây là tương tác đặc trưng của giao diện hạng "designer thật".
 */
export default function SpotlightCard({
  children,
  className = '',
  tilt = false,
  tiltMax = 6,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Vị trí spotlight (phần trăm)
    el.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    el.style.setProperty('--my', `${(y / rect.height) * 100}%`);
    // Nghiêng 3D quanh tâm thẻ
    if (tilt) {
      const rx = (0.5 - y / rect.height) * tiltMax * 2;
      const ry = (x / rect.width - 0.5) * tiltMax * 2;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    if (tilt) el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`spotlight transition-transform duration-300 ease-out-expo ${className}`}
      style={tilt ? { transformStyle: 'preserve-3d' } : undefined}
    >
      {children}
    </div>
  );
}
