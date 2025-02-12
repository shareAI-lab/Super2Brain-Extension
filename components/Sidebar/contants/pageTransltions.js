export const pageVariants = {
  initial: {
    opacity: 0,
    x: 2,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -2,
  },
};

export const pageTransition = {
  type: "tween",
  duration: 0.15,
  ease: "easeInOut",
};
