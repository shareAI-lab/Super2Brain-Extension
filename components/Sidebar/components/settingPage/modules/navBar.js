import { Settings, Cpu, Info, Bell } from "lucide-react";

const tabs = [
  { name: "基础设置", icon: Settings },
  { name: "模型设置", icon: Cpu },
  { name: "关于", icon: Info },
];

const NavBar = ({ activeTab, onTabChange }) => {
  return (
    <nav>
      <ul className="flex space-x-8 px-4">
        {tabs.map((tab) => (
          <li key={tab.name}>
            <button
              onClick={() => onTabChange(tab.name)}
              className={`
                relative flex items-center py-4 px-1 text-sm font-medium
                ${
                  activeTab === tab.name
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
              {activeTab === tab.name && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 transform transition-all duration-300 ease-in-out" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export { NavBar };
