import { config } from "../../config/index"

export const getCode = async (email) => {
  try {
    const response = await fetch(`${config.baseUrl}/auth/send-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 验证返回数据的格式
    if (data.code !== 200) {
      throw new Error(data.msg || "获取验证码失败");
    }

    return data.data;
  } catch (error) {
    console.error("获取验证码出错:", error);
    throw error;
  }
};

export const login = async ({ email, code }) => {
  try {
    const response = await fetch(`${config.baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(data.msg || "登录失败");
    }

    return data.data;
  } catch (error) {
    console.error("登录失败:", error);
    throw error;
  }
};
