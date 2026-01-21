"use client";

import { useState } from "react";
import { Card, List, Avatar, Tag, Button, Modal, Select, message } from "antd";
import {
  UserOutlined,
  CarOutlined,
  StarFilled,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Driver, Container, ActiveJob } from "../types";
import mockData from "../data/mockData.json";

export default function DriverAssignment() {
  const [drivers] = useState<Driver[]>(mockData.drivers as Driver[]);
  const [containers] = useState<Container[]>(mockData.containers as Container[]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);

  const handleAssignJob = () => {
    if (!selectedDriver || !selectedContainer) {
      message.warning("Vui lòng chọn tài xế và container!");
      return;
    }

    message.success(
      `Đã giao container ${selectedContainer} cho tài xế ${selectedDriver.name}`
    );
    setIsModalVisible(false);
    setSelectedDriver(null);
    setSelectedContainer(null);
  };

  return (
    <>
      <Card
        title="Danh sách tài xế"
        size="small"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
        extra={
          <Button
            type="primary"
            size="small"
            onClick={() => setIsModalVisible(true)}
          >
            Giao việc
          </Button>
        }
      >
        <List
          size="small"
          dataSource={drivers}
          renderItem={(driver) => (
            <List.Item
              actions={[
                <Tag
                  key="status"
                  color={
                    driver.status === "available"
                      ? "green"
                      : driver.status === "on-duty"
                      ? "blue"
                      : "default"
                  }
                >
                  {driver.status === "available"
                    ? "Sẵn sàng"
                    : driver.status === "on-duty"
                    ? "Đang làm"
                    : "Nghỉ"}
                </Tag>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
                }
                title={
                  <div>
                    {driver.name}
                    <span style={{ marginLeft: 8, fontSize: 12, color: "#999" }}>
                      {driver.licenseNumber}
                    </span>
                  </div>
                }
                description={
                  <div style={{ fontSize: 12 }}>
                    <div>{driver.company}</div>
                    <div>
                      <StarFilled style={{ color: "#faad14", fontSize: 10 }} />{" "}
                      {driver.rating} • {driver.totalTrips} chuyến
                    </div>
                    {driver.currentVehicle && (
                      <Tag icon={<CarOutlined />} color="processing" style={{ marginTop: 4 }}>
                        {driver.currentVehicle}
                      </Tag>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Modal giao việc */}
      <Modal
        title="Giao việc cho tài xế"
        open={isModalVisible}
        onOk={handleAssignJob}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedDriver(null);
          setSelectedContainer(null);
        }}
        okText="Giao việc"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Chọn tài xế:
          </label>
          <Select
            style={{ width: "100%" }}
            placeholder="Chọn tài xế"
            value={selectedDriver?.id}
            onChange={(value) => {
              const driver = drivers.find((d) => d.id === value);
              setSelectedDriver(driver || null);
            }}
          >
            {drivers
              .filter((d) => d.status === "available")
              .map((driver) => (
                <Select.Option key={driver.id} value={driver.id}>
                  {driver.name} - {driver.company} (⭐ {driver.rating})
                </Select.Option>
              ))}
          </Select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Chọn container:
          </label>
          <Select
            style={{ width: "100%" }}
            placeholder="Chọn container"
            value={selectedContainer}
            onChange={setSelectedContainer}
          >
            {containers.map((container) => (
              <Select.Option key={container.id} value={container.id}>
                {container.code} - {container.type} ({container.status})
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>
    </>
  );
}

