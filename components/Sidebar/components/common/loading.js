import React from "react";
import { motion } from "framer-motion";

export const Loading = () => {
  const ballCount = 5;

  const balls = Array.from({ length: ballCount }, (_, index) => (
    <motion.div
      key={index}
      className="w-2 h-2 bg-blue-500 rounded-full"
      animate={{
        y: [0, -12, 0],
        x: [0, 6, 0],
        scale: [1, 0.8, 1],
      }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.1,
      }}
    />
  ));

  return (
    <div className="flex justify-start items-center h-full pt-2">
      <div className="flex space-x-1">{balls}</div>
    </div>
  );
};
