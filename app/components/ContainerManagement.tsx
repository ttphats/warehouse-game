"use client";

import { useState, useEffect } from "react";
import {
  YardContainer,
  ContainerFilter,
  ContainerState,
  ContainerStatistics,
} from "../types/container.types";
import {
  getAllContainers,
  getContainerStatistics,
  updateContainerState,
} from "../services/containerManagementService";

/**
 * Container Management Component
 * Quản lý tất cả containers trong yard với filtering và state tracking
 */
export default function ContainerManagement() {
  const [containers, setContainers] = useState<YardContainer[]>([]);
  const [statistics, setStatistics] = useState<ContainerStatistics | null>(
    null,
  );
  const [filter, setFilter] = useState<ContainerFilter>({});
  const [selectedContainer, setSelectedContainer] =
    useState<YardContainer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load containers
  useEffect(() => {
    loadContainers();
  }, [filter]);

  const loadContainers = () => {
    const data = getAllContainers(filter);
    setContainers(data);
    setStatistics(getContainerStatistics());
  };

  const handleFilterByState = (state: ContainerState) => {
    setFilter((prev) => {
      const currentStates = prev.state || [];
      const newStates = currentStates.includes(state)
        ? currentStates.filter((s) => s !== state)
        : [...currentStates, state];
      return { ...prev, state: newStates.length > 0 ? newStates : undefined };
    });
  };

  const handleSearch = () => {
    setFilter((prev) => ({
      ...prev,
      search: searchTerm || undefined,
    }));
  };

  const getStateColor = (state: ContainerState): string => {
    switch (state) {
      case "arriving":
        return "bg-blue-500";
      case "in_yard":
        return "bg-green-500";
      case "at_dock":
        return "bg-yellow-500";
      case "processing":
        return "bg-orange-500";
      case "completed":
        return "bg-purple-500";
      case "departed":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStateLabel = (state: ContainerState): string => {
    switch (state) {
      case "arriving":
        return "Đang đến";
      case "in_yard":
        return "Trong Yard";
      case "at_dock":
        return "Tại Dock";
      case "processing":
        return "Đang xử lý";
      case "completed":
        return "Hoàn thành";
      case "departed":
        return "Đã rời đi";
      default:
        return state;
    }
  };

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString("vi-VN");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            📦 Quản Lý Container Trong Yard
          </h1>
          <p className="text-gray-400">
            Theo dõi và quản lý trạng thái của tất cả containers
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4">
              <div className="text-sm text-blue-200">Tổng Containers</div>
              <div className="text-3xl font-bold">{statistics.total}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4">
              <div className="text-sm text-green-200">Trong Yard</div>
              <div className="text-3xl font-bold">{statistics.inYard}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-4">
              <div className="text-sm text-yellow-200">Tại Dock</div>
              <div className="text-3xl font-bold">{statistics.atDock}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4">
              <div className="text-sm text-purple-200">Hoàn Thành</div>
              <div className="text-3xl font-bold">
                {statistics.byState.completed}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold mb-4">🔍 Bộ Lọc</h3>

          {/* Search */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tìm theo Container Number, ASN, PO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Tìm
              </button>
            </div>
          </div>

