import { motion } from 'framer-motion';

// Friendly sitting tabby. Tail slow-flicks via rotation around its base.
// Colors come from the tabby palette (tabby / espresso / cream / saffron).
export default function CatMascot({ size = 180, className = '' }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Friendly tabby cat"
    >
      {/* Tail — rotates around its base */}
      <motion.g
        style={{ originX: '155px', originY: '160px' }}
        animate={{ rotate: [0, -18, 0, 14, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M 155 160 Q 178 140 175 105 Q 173 90 184 84"
          stroke="var(--color-tabby)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 168 100 Q 173 93 178 91"
          stroke="var(--color-espresso)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      </motion.g>

      {/* Body */}
      <ellipse cx="100" cy="150" rx="55" ry="40" fill="var(--color-tabby)" />
      <path
        d="M 70 145 Q 80 155 90 145 M 100 145 Q 110 155 120 145 M 130 145 Q 140 155 150 145"
        stroke="var(--color-tabby-soft)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Front paws */}
      <ellipse cx="80" cy="180" rx="14" ry="9" fill="var(--color-tabby)" />
      <ellipse cx="120" cy="180" rx="14" ry="9" fill="var(--color-tabby)" />
      <circle cx="80" cy="180" r="3" fill="var(--color-cream-soft)" opacity="0.8" />
      <circle cx="120" cy="180" r="3" fill="var(--color-cream-soft)" opacity="0.8" />

      {/* Chest fluff */}
      <ellipse cx="100" cy="135" rx="20" ry="14" fill="var(--color-cream-soft)" />

      {/* Head */}
      <circle cx="100" cy="90" r="38" fill="var(--color-tabby)" />

      {/* Ears */}
      <path d="M 68 70 L 60 38 L 86 60 Z" fill="var(--color-tabby)" />
      <path d="M 132 70 L 140 38 L 114 60 Z" fill="var(--color-tabby)" />
      <path d="M 70 64 L 66 48 L 80 60 Z" fill="var(--color-terracotta)" opacity="0.6" />
      <path d="M 130 64 L 134 48 L 120 60 Z" fill="var(--color-terracotta)" opacity="0.6" />

      {/* Tabby forehead stripe */}
      <path
        d="M 100 60 L 95 75 M 100 60 L 105 75 M 90 65 L 88 76 M 110 65 L 112 76"
        stroke="var(--color-espresso)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Cheek puffs */}
      <ellipse cx="80" cy="102" rx="10" ry="7" fill="var(--color-cream-soft)" />
      <ellipse cx="120" cy="102" rx="10" ry="7" fill="var(--color-cream-soft)" />

      {/* Eyes — closed-happy arcs */}
      <motion.g
        animate={{ scaleY: [1, 0.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, repeatDelay: 2.5, times: [0, 0.5, 1] }}
        style={{ transformOrigin: '100px 88px' }}
      >
        <circle cx="86" cy="88" r="4.5" fill="var(--color-espresso)" />
        <circle cx="114" cy="88" r="4.5" fill="var(--color-espresso)" />
        <circle cx="87.5" cy="86.5" r="1.3" fill="var(--color-cream-soft)" />
        <circle cx="115.5" cy="86.5" r="1.3" fill="var(--color-cream-soft)" />
      </motion.g>

      {/* Nose */}
      <path
        d="M 96 100 L 104 100 L 100 105 Z"
        fill="var(--color-terracotta)"
      />

      {/* Mouth */}
      <path
        d="M 100 105 L 100 110 M 100 110 Q 94 114 90 110 M 100 110 Q 106 114 110 110"
        stroke="var(--color-espresso)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Whiskers */}
      <path
        d="M 70 100 L 55 96 M 70 105 L 55 107 M 130 100 L 145 96 M 130 105 L 145 107"
        stroke="var(--color-espresso)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
