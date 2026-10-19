import type { Transition, Variants } from 'framer-motion';

export const nexiTransition = {
  immediate: { duration: 0.08, ease: [0.2, 0.8, 0.2, 1] },
  press: { duration: 0.1, ease: [0.2, 0.8, 0.2, 1] },
  tab: { duration: 0.14, ease: [0.2, 0.8, 0.2, 1] },
  acknowledgement: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] },
  modal: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  drawer: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
} satisfies Record<string, Transition>;

export const nexiPress = {
  rest: { scale: 1, y: 0 },
  hover: { y: -1 },
  pressed: { scale: 0.97, y: 0 },
} satisfies Variants;

export const nexiReveal = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
} satisfies Variants;
