import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const people = [
  { id: 1, name: "GPT-4", online: true },
  { id: 2, name: "GPT-3.5", online: false },
  { id: 3, name: "GPT-4o", online: true },
  { id: 4, name: "GPT-4o-mini", online: false },
  { id: 5, name: "Claude-3", online: true },
  { id: 6, name: "Ollama-Llama", online: true },
  { id: 7, name: "DeepSeek-Chat", online: true },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function SelectModel() {
  const [selected, setSelected] = useState(people[3]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative mt-2 w-32" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1 pl-2 pr-2 text-left 
        text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2
         focus:-outline-offset-2 focus:outline-indigo-600 text-xs"
      >
        <span className="col-start-1 row-start-1 flex items-center pr-6">
          <span className="block truncate">{selected.name}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="col-start-1 row-start-1 h-4 w-4 self-center justify-self-end text-gray-400"
        />
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 mt-1 w-32 max-h-60 overflow-auto 
        rounded-md bg-white py-1 text-xs shadow-lg ring-1 
        ring-black/5 focus:outline-none"
        >
          {people.map((person) => (
            <li
              key={person.id}
              onClick={() => {
                setSelected(person);
                setIsOpen(false);
              }}
              className="group relative cursor-default select-none py-1.5 pl-2 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
            >
              <div className="flex items-center">
                <span className="block truncate font-normal group-data-[selected]:font-semibold">
                  {person.name}
                </span>
              </div>

              {selected.id === person.id && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-600 group-hover:text-white">
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
