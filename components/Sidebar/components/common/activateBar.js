import { Tooltip } from "react-tooltip";
import { useCallback } from "react";
import { ACTIVATE_ITEMS } from "../../contants/activateBar";

const ActivateBar = ({ activatePage, setActivatePage }) => {
  const renderActivateItem = useCallback(
    ({ id, icon: Icon, tooltip }) => {
      const isActive = activatePage === id;

      return (
        <button
          key={id}
          onClick={() => setActivatePage(id)}
          className={`
			w-8 h-8 flex items-center justify-center rounded-lg
			transition-all duration-200 group
			${
        isActive
          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
          : "hover:bg-gray-200 text-gray-500"
      }
		  `}
          data-tooltip-id={`activate-${id}`}
        >
          <Icon className="w-4 h-4" />
          <Tooltip
            id={`activate-${id}`}
            place="left"
            style={{ borderRadius: "8px" }}
          >
            {tooltip}
          </Tooltip>
        </button>
      );
    },
    [activatePage, setActivatePage]
  );

  return (
    <div className="h-full py-2 flex flex-col items-center gap-2">
      {ACTIVATE_ITEMS.map(renderActivateItem)}
    </div>
  );
};

export { ActivateBar };
