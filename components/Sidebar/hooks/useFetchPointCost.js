import { useState, useEffect } from "react";

const useFetchPointCost = () => {
  const [pointCosts, setPointCosts] = useState([]);

  useEffect(() => {
    const fetchPointCosts = async () => {
      const response = await fetch(
        " https://extension-update.oss-cn-beijing.aliyuncs.com/pointPost.json"
      );
      const data = await response.json();
      setPointCosts(data);
    };
    fetchPointCosts();
  }, []);

  return { pointCosts };
};

export { useFetchPointCost };
