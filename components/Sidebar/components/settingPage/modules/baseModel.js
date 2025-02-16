import { useState, useEffect } from "react";
import {
  setWebPreview as setWebPreviewStorage,
  getWebPreview,
  getUserInput,
} from "../../../../../public/storage";
import { config } from "../../../../config/index";

const CheckboxOption = ({ id, label, description, checked, onChange }) => (
  <div className="flex gap-3">
    <div className="flex h-6 shrink-0 items-center">
      <div className="group grid size-4 grid-cols-1">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-describedby={`${id}-description`}
          className="col-start-1 row-start-1 appearance-none rounded border
           border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600
            indeterminate:border-indigo-600 indeterminate:bg-indigo-600 
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
            focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100
             disabled:checked:bg-gray-100 forced-colors:appearance-auto"
        />
        <svg
          fill="none"
          viewBox="0 0 14 14"
          className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
        >
          <path
            d="M3 8L6 11L11 3.5"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-0 group-has-[:checked]:opacity-100"
          />
          <path
            d="M3 7H11"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-0 group-has-[:indeterminate]:opacity-100"
          />
        </svg>
      </div>
    </div>
    <div className="text-sm/6">
      <label htmlFor={id} className="font-medium text-gray-900">
        {label}
      </label>
      <p id={`${id}-description`} className="text-gray-500">
        {description}
      </p>
    </div>
  </div>
);

const notificationOptions = [
  {
    id: "web-preview",
    label: "网页速览",
    description: "每次打开Super2Brain侧边栏的时候，会自动在生成速览。",
    defaultChecked: true,
  },
];

const PointsCard = ({ setIsShowModal, setActiveTab, pointCosts }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const userInput = await getUserInput();
        const response = await fetch(
          `${config.baseUrl}/common/points/balance`,
          {
            headers: {
              Authorization: `Bearer ${userInput}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`获取余额失败: ${response.status}`);
        }

        const { data } = await response.json();
        setBalance(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, []);

  const renderPointsUsage = ({ pointCosts }) => {
    const pointCostArray = Object.entries(pointCosts)
      .filter(([key]) => key !== '[[Prototype]]')
      .map(([name, points]) => ({
        name,
        points: typeof points === 'number' ? points : null
      }))
      .filter(item => item.points !== null); 

    return (
      <div className="mt-4 text-sm text-gray-500">
        <div className="font-medium text-gray-700 mb-2">积分使用说明</div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex flex-col space-y-2">
            {pointCostArray.map(({ name, points }) => (
              <div
                key={name}
                className="flex justify-between items-center"
              >
                <span className="text-gray-500">{name}</span>
                <span className="text-indigo-600 font-medium">
                  {points} 积分/次
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t pt-3 text-sm">
            <div className="text-gray-600">
              <span className="text-indigo-600">提示：</span>
              接入自己的模型可免除积分消耗{" "}
              <span
                className="text-indigo-600"
                onClick={() => setActiveTab("模型设置")}
              >
                接入自定义接口→
              </span>
            </div>
            <div className="text-gray-600">
              <span className="text-indigo-600">注意：</span>
              深度搜索会消耗大量积分，请选择合适的模型和思考深度
            </div>
            <div className="text-gray-600">
              <button
                className="text-indigo-600 hover:text-indigo-700 font-medium"
                onClick={() => setIsShowModal(true)}
              >
                想要更多积分？点击此处进行充值 →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="flex gap-3">
        <div className="flex h-6 items-center">
          <svg
            className="size-5 text-indigo-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
          </svg>
        </div>
        <div className="text-sm/6">
          <div className="font-medium text-gray-900">当前积分</div>
          {loading ? (
            <p className="text-gray-500">正在获取积分</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <p className="text-indigo-600">{balance}</p>
          )}
        </div>
      </div>
      {renderPointsUsage({ pointCosts })}
    </div>
  );
};

const BaseModel = ({
  webPreview,
  setWebPreview,
  setIsShowModal,
  setActiveTab,
  pointCosts,
}) => {
  const [localWebPreview, setLocalWebPreview] = useState(webPreview);

  const handleWebPreviewChange = async (checked) => {
    await setWebPreviewStorage(checked);
    setWebPreview(checked);
    setLocalWebPreview(checked);
  };

  const options = notificationOptions.map((option) => ({
    ...option,
    checked: webPreview,
    onChange: handleWebPreviewChange,
  }));

  return (
    <div className="px-8 py-4">
      <fieldset>
        <legend className="sr-only">Notifications</legend>
        <div className="space-y-5">
          {options.map((option) => (
            <CheckboxOption
              key={option.id}
              {...option}
              checked={localWebPreview}
              onChange={handleWebPreviewChange}
            />
          ))}
        </div>
      </fieldset>
      <PointsCard
        setIsShowModal={setIsShowModal}
        setActiveTab={setActiveTab}
        pointCosts={pointCosts}
      />
    </div>
  );
};

export { BaseModel };
