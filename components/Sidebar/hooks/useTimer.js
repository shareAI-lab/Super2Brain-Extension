import React, { useState, useRef, useCallback, useEffect } from "react";

const useTimer = (interval = 1000) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);
  const timeRef = useRef(0);  // 用于跟踪实际时间

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      const startTime = Date.now(); 
      timeRef.current = 0;
      
      timerRef.current = setInterval(() => {
        timeRef.current = Date.now() - startTime;
        setTime(timeRef.current);
      }, interval);
    }
  }, [interval, isRunning]);

  const stop = useCallback(() => {
    if (isRunning) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsRunning(false);
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    timeRef.current = 0;
    setTime(0);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return { time, start, stop, reset, isRunning };
};

export { useTimer };
