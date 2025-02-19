import React, { useCallback, useState } from "react";
import { Logo } from "../modules/logo";
import { useCountdown } from "../hooks/useCountdown";
import { getCode, login } from "../service/login";
import { saveUserInput } from "../../../public/storage";

const tiltShakeAnimation = `@keyframes tilt-shake {
  0% { transform: rotate(0deg); }
  15% { transform: rotate(3deg); }
  30% { transform: rotate(-3deg); }
  45% { transform: rotate(2deg); }
  60% { transform: rotate(-2deg); }
  75% { transform: rotate(1deg); }
  85% { transform: rotate(-1deg); }
  92% { transform: rotate(0.5deg); }
  100% { transform: rotate(0deg); }
}`;

export default function First({ onNext, apiKey, setApiKey }) {
  const [countdown, startCountdown] = useCountdown(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [shake, setShake] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [getCodeLoading, setGetCodeLoading] = useState(false);

  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleGetCode = useCallback(
    async (e) => {
      e.preventDefault();
      if (countdown > 0 || getCodeLoading) return;

      if (!email || !validateEmail(email)) {
        setEmailError("请输入正确的邮箱地址");
        setShake(false);
        requestAnimationFrame(() => setShake(true));
        return;
      }

      try {
        setEmailError("");
        setError("");
        setGetCodeLoading(true);
        await getCode(email);
        startCountdown(60);
      } catch (err) {
        setError(err.message);
      } finally {
        setGetCodeLoading(false);
      }
    },
    [countdown, startCountdown, email, validateEmail, getCodeLoading]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;

      try {
        setLoading(true);
        setError("");
        setCodeError("");
        const data = await login({ email, code });
        console.log(data);
        if (data && data.access_token) {
          await saveUserInput(data.access_token);
          setApiKey(data.access_token);
          onNext();
        } else {
          throw new Error("登录返回数据格式错误");
        }
      } catch (err) {
        console.error("登录错误:", err);
        setError(err.message || "登录失败，请重试");
      } finally {
        setLoading(false);
      }
    },
    [email, code, loading, setApiKey, onNext]
  );

  return (
    <div className="w-full">
      <style>{tiltShakeAnimation}</style>
      <div className="flex flex-col justify-center">
        <div className="w-full max-w-md">
          <Logo className="h-12 w-auto" />
          <h2 className="mt-8 text-2xl font-semibold text-gray-900">
            登录 / 注册账户
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            输入您的邮箱地址，新用户将自动完成注册,并登录账户
          </p>
        </div>

        <div className="mt-8 w-full max-w-md">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-500">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                电子邮箱
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={`block w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
                    emailError
                      ? "border-red-500 animate-[tilt-shake_0.5s_ease-in-out]"
                      : "border-gray-300"
                  }`}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                验证码
              </label>
              <div className="mt-1 flex gap-3">
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError("");
                  }}
                  className={`block w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
                    codeError
                      ? "border-red-500 animate-[tilt-shake_0.5s_ease-in-out]"
                      : "border-gray-300"
                  }`}
                />
                <button
                  onClick={handleGetCode}
                  disabled={countdown > 0 || getCodeLoading}
                  className="flex-none rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {countdown > 0
                    ? `${countdown}秒后重试`
                    : getCodeLoading
                    ? "发送中..."
                    : "获取验证码"}
                </button>
              </div>
              {codeError && (
                <p className="mt-1 text-sm text-red-500">{codeError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "登录中..." : "登录 / 注册"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            登录即表示您同意{" "}
            <a
              href="/privacy"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              隐私协议
            </a>{" "}
            和{" "}
            <a
              href="/terms"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              服务条款
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
