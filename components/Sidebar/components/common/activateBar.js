import { Tooltip } from "react-tooltip";
import { useCallback, useState } from "react";
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
            w-10 h-10 flex items-center justify-center rounded-full
            absolute right-0
            transition-all duration-300
            backdrop-blur-sm bg-white/30
            shadow-[0_0_15px_rgba(0,0,0,0.1)]
            hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]
            group-hover:-translate-x-4 group-hover:scale-110
            ${isActive ? "translate-x-0" : "translate-x-full"}
            ${isActive ? "text-indigo-500 shadow-indigo-200" : "text-gray-500"}
          `}
          data-tooltip-id={`activate-${id}`}
        >
          <Icon className="w-5 h-5" />
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
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 
        flex flex-col items-center justify-center 
        rounded-l-3xl relative h-[400px]
        group transition-all duration-300
        w-24 hover:bg-white/10"
    >
      <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-16">
        {ACTIVATE_ITEMS.map((item, index) => (
          <div
            key={item.id}
            className="transition-all duration-500 group-hover:delay-[var(--delay)]"
            style={{
              "--delay": `${index * 120 + Math.random() * 50}ms`,
              transform: `translateX(${
                activatePage === item.id ? "0" : "100%"
              })`,
            }}
          >
            {renderActivateItem({
              ...item,
              className: `group-hover:-translate-x-${
                4 + Math.floor(Math.random() * 3)
              } group-hover:scale-${105 + Math.floor(Math.random() * 10)}`,
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export { ActivateBar };
