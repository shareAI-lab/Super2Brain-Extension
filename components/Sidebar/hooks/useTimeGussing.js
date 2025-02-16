import { useState } from "react";

const useTimeGussing = () => {
  const [needTime, setNeedTime] = useState(0);

  const getNeedTime = (maxDepth) => {
    const baseTime = 5;

    const getExtraTimePerRound = () =>
      Math.floor(Math.random() * (6 - 3 + 1) + 3);

    const extraRounds = maxDepth - 2;

    const totalMinutes = Array(extraRounds)
      .fill(0)
      .reduce((acc) => acc + getExtraTimePerRound(), baseTime);

    setNeedTime(totalMinutes);
    return totalMinutes;
  };

  return {
    needTime,
    getNeedTime,
  };
};

export { useTimeGussing };
