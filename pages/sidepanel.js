import React from "react";
import Sidebar from "../components/Sidebar";

export default function SidePanel() {
  return (
    <div className="w-full h-screen bg-white">
      <Sidebar defaultOpen={true} />
    </div>
  );
}
