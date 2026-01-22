"use client";

import { useState } from "react";

interface Container {
  id: string;
  slotId: number;
  status: "full" | "empty" | "loading" | "unloading";
  containerNumber: string;
  idleTime?: number; // minutes
  x: number;
  y: number;
}

interface HoveredContainer extends Container {
  mouseX: number;
  mouseY: number;
}

export default function ModernYardView() {
  const [hoveredContainer, setHoveredContainer] =
    useState<HoveredContainer | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(
    null,
  );

  // Mock data - 16 yard slots on left
  const yardContainers: Container[] = [
    {
      id: "1",
      slotId: 1,
      status: "full",
      containerNumber: "CONT-001",
      idleTime: 120,
      x: 30,
      y: 50,
    },
    {
      id: "2",
      slotId: 2,
      status: "empty",
      containerNumber: "CONT-002",
      x: 70,
      y: 50,
    },
    {
      id: "3",
      slotId: 3,
      status: "full",
      containerNumber: "CONT-003",
      idleTime: 45,
      x: 110,
      y: 50,
    },
    {
      id: "4",
      slotId: 4,
      status: "loading",
      containerNumber: "CONT-004",
      x: 150,
      y: 50,
    },
    {
      id: "5",
      slotId: 5,
      status: "full",
      containerNumber: "CONT-005",
      x: 30,
      y: 100,
    },
    {
      id: "6",
      slotId: 6,
      status: "empty",
      containerNumber: "CONT-006",
      x: 70,
      y: 100,
    },
  ];

  // Dock containers on right
  const dockContainers: Container[] = [
    {
      id: "d1",
      slotId: 101,
      status: "loading",
      containerNumber: "DOCK-A01",
      x: 600,
      y: 100,
    },
    {
      id: "d2",
      slotId: 102,
      status: "unloading",
      containerNumber: "DOCK-A02",
      x: 640,
      y: 100,
    },
    {
      id: "d3",
      slotId: 103,
      status: "loading",
      containerNumber: "DOCK-A03",
      x: 680,
      y: 100,
    },
  ];

  const getStatusColor = (status: Container["status"]) => {
    switch (status) {
      case "full":
        return "bg-green-500";
      case "empty":
        return "bg-orange-500";
      case "loading":
        return "bg-blue-500";
      case "unloading":
        return "bg-purple-500";
    }
  };

  const handleContainerHover = (container: Container, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredContainer({
      ...container,
      mouseX: e.clientX - rect.left,
      mouseY: e.clientY - rect.top,
    });
  };

  return (
    <div className="flex gap-6 p-6 h-full">
      {/* Main Yard View */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl shadow-lg border border-gray-200/60 p-6 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-20 grid-rows-20 h-full w-full">
            {Array.from({ length: 400 }).map((_, i) => (
              <div key={i} className="border border-gray-400"></div>
            ))}
          </div>
        </div>

        {/* Yard Area (Left) */}
        <div className="relative">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              YARD PARKING
            </h3>
          </div>

          <div className="grid grid-cols-8 gap-3">
            {yardContainers.map((container) => (
              <div
                key={container.id}
                className="relative group cursor-pointer"
                onMouseEnter={(e) => handleContainerHover(container, e)}
                onMouseLeave={() => setHoveredContainer(null)}
                onClick={() => setSelectedContainer(container)}
              >
                {/* Container Bar */}
                <div
                  className={`h-20 w-10 ${getStatusColor(container.status)} rounded-lg shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105 relative`}
                >
                  {/* Idle indicator */}
                  {container.idleTime && container.idleTime > 60 && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>

                {/* Slot Number */}
                <div className="text-xs text-gray-500 text-center mt-1 font-medium">
                  {container.slotId}
                </div>

                {/* Hover Tooltip */}
                {hoveredContainer?.id === container.id &&
                  container.idleTime && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-lg z-10">
                      Idle for {Math.floor(container.idleTime / 60)} Hrs
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Warehouse/Dock Area (Right) */}
        <div className="absolute top-6 right-6 bg-gray-300/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold text-gray-600 mb-3 text-center">
            WAREHOUSE
          </div>
          <div className="flex gap-2">
            {dockContainers.map((container) => (
              <div
                key={container.id}
                className="relative cursor-pointer"
                onMouseEnter={(e) => handleContainerHover(container, e)}
                onMouseLeave={() => setHoveredContainer(null)}
                onClick={() => setSelectedContainer(container)}
              >
                <div
                  className={`h-20 w-10 ${getStatusColor(container.status)} rounded-lg shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105`}
                ></div>
                <div className="text-xs text-gray-600 text-center mt-1 font-medium">
                  A{container.slotId - 100}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flow Path Indicator */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <path
            d="M 400 150 Q 500 150 550 150"
            stroke="#84cc16"
            strokeWidth="3"
            fill="none"
            strokeDasharray="10,5"
            opacity="0.3"
          />
        </svg>

        {/* Legend */}
        <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-gray-200/60">
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Full</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700">Empty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Loading</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700">Unloading</span>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in/Check-out Panel */}
      <div className="w-80 bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Check-in / Check-out
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Truck Plate No.
            </label>
            <input
              type="text"
              placeholder="Enter truck plate"
              className="w-full mt-1.5 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Trailer Plate No.
            </label>
            <input
              type="text"
              placeholder="Enter trailer plate"
              className="w-full mt-1.5 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Date
              </label>
              <input
                type="date"
                className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Time
              </label>
              <input
                type="time"
                className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg">
            Complete Check-in
          </button>
        </div>

        {/* Task Detail Section */}
        {selectedContainer && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-bold text-gray-800 mb-3">
              Task Detail
            </h4>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Container</div>
                <div className="font-semibold text-gray-800">
                  {selectedContainer.containerNumber}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Move</div>
                <div className="text-sm text-gray-800">
                  Parking P{String(selectedContainer.slotId).padStart(2, "0")} →
                  Dock A16
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Task Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-800">
                      In Progress
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Estimate</div>
                  <div className="text-sm font-semibold text-gray-800">
                    10 min
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Responsible</div>
                  <div className="text-sm font-semibold text-gray-800">
                    John B.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
