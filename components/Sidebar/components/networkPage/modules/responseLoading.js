import { motion } from "framer-motion";

export function ResponseLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-3"
    >
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="relative h-6 w-full rounded-lg bg-gradient-to-r from-pink-200/70 via-purple-200/70 to-blue-200/70 overflow-hidden"
        >
          <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      ))}

      {[...Array(2)].map((_, i) => (
        <div
          key={i + 2}
          className="relative h-6 w-2/3 rounded-lg bg-gradient-to-r from-pink-200/70 via-purple-200/70 to-blue-200/70 overflow-hidden"
        >
          <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      ))}
    </motion.div>
  );
}
