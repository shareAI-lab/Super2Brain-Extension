import { Tooltip } from "react-tooltip";
import { useCallback, useState } from "react";
import { ACTIVATE_ITEMS } from "../../contants/activateBar";

const ActivateBar = ({ activatePage, setActivatePage }) => {
  const topItems = ACTIVATE_ITEMS.slice(0, 4);
  const bottomItems = ACTIVATE_ITEMS.slice(4);

  const renderActivateItem = useCallback(
    ({ id, icon: Icon, tooltip }) => {
      const isActive = activatePage === id;

      return (
        <button
          key={id}
          onClick={() => setActivatePage(id)}
          className={`
            w-full p-2 flex items-center justify-center
            ${isActive ? "bg-indigo-500/20" : "hover:bg-white/5"}
            rounded-lg mb-1 
          `}
          data-tooltip-id={`activate-${id}`}
        >
          <Icon
            className={`w-6 h-6 ${isActive ? "text-indigo-600" : ""}  hover:text-indigo-600`}
          />
          <Tooltip
            id={`activate-${id}`}
            place="left"
            style={{
              borderRadius: "12px",
              backgroundColor: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "8px 12px",
            }}
          >
            {tooltip}
          </Tooltip>
        </button>
      );
    },
    [activatePage, setActivatePage]
  );

  return (
    <div className="fixed right-0 top-0 w-12 h-full flex flex-col justify-between bg-white/10 rounded-lg py-2">
      <div className="space-y-1">
        {topItems.map((item) => renderActivateItem(item))}
      </div>
      <div className="space-y-1">
        {bottomItems.map((item) => renderActivateItem(item))}
      </div>
    </div>
  );
};

export { ActivateBar };
