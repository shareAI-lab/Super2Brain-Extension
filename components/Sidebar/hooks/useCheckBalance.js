import { config } from "../../config/index";
import { useState, useEffect } from "react";
import { getUserInput } from "../../../public/storage";

const fetchPoints = async () => {
  const response = await fetch(
    `https://extension-update.oss-cn-beijing.aliyuncs.com/point.json`
  );
  if (!response.ok) {
    throw new Error(`获取点数失败: ${response.status}`);
  }

  const data = await response.json();
  console.log(data);
  return data;
};

const fetchBalance = async () => {
  const userInput = await getUserInput();
  const response = await fetch(`${config.baseUrl}/common/points/balance`, {
    headers: {
      Authorization: `Bearer ${userInput}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`获取余额失败: ${response.status}`);
  }

  const { data } = await response.json();
  return data;
};

export const useCheckBalance = () => {
  const [pointsUsed, setPointsUsed] = useState({
    "gpt-4o": 0,
    "gpt-4o-mini": 0,
    "deepseek-r1": 0,
    "deepseek-v3": 0,
    "glm-4-32k": 0,
    "glm-4v": 0,
  });
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isShowModal, setIsShowModal] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [pointsData, balanceData] = await Promise.all([
          fetchPoints(),
          fetchBalance(),
        ]);
        console.log(pointsData);
        setPointsUsed(pointsData);
        setBalance(balanceData.balance);
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const getPointsCost = (times, model, baseCostTimes) => {
    const modelCost = pointsUsed[model.toLowerCase()];
    const miniCost = pointsUsed["gpt-4o-mini"];
    console.log(pointsUsed);
    if (modelCost === undefined) {
      console.warn(`未找到模型 ${model} 的积分配置`);
      return 0;
    }

    if (miniCost === undefined) {
      console.warn("未找到 gpt-4o-mini 的积分配置");
      return 0;
    }

    // 确保输入是数字
    const timesNum = Number(times) || 0;
    const baseCostTimesNum = Number(baseCostTimes) || 0;

    const costPoints = timesNum * modelCost + baseCostTimesNum * miniCost;
    console.log("计算详情:", {
      times: timesNum,
      modelCost,
      baseCostTimes: baseCostTimesNum,
      miniCost,
      result: costPoints,
    });

    return costPoints;
  };

  const checkBalance = async (times, model, baseCostTimes) => {
    const balance = await fetchBalance();

    const pointsCost = getPointsCost(times, model, baseCostTimes);
    console.log("消耗的积分", pointsCost);
    if (balance < pointsCost) {
      setIsShowModal(true);
      return false;
    } else {
      setIsShowModal(false);
      return true;
    }
  };

  return { pointsUsed, balance, checkBalance, isShowModal, setIsShowModal };
};
