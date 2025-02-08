import { useState, useEffect } from "react";
import {
  setWebPreview as setWebPreviewStorage,
  getWebPreview,
} from "../../../../../public/storage";

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

const BaseModel = ({ webPreview, setWebPreview }) => {
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
    </div>
  );
};

export { BaseModel };
