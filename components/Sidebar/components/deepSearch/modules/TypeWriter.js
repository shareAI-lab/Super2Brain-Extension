import { useState, useEffect } from "react";

const TypeWriter = ({ text, onComplete, isPulsing = false }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 25);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text]);

  return (
    <span className={`whitespace-pre-wrap break-all ${isPulsing ? 'animate-pulse' : ''}`}>
      {displayText}
    </span>
  );
};

export { TypeWriter };
