import { useState, useCallback, useEffect } from "react";

const useCountdown = (initialState = 0) => {
  const [countdown, setCountdown] = useState(initialState);

  const startCountdown = useCallback((seconds) => {
    setCountdown(seconds);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return [countdown, startCountdown];
};

export { useCountdown };
