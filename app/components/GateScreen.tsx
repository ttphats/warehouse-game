"use client";

import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Steps,
  message,
  Descriptions,
  Tag,
  Space,
  Radio,
} from "antd";
import {
  CheckCircleOutlined,
  ContainerOutlined,
  FileTextOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { Container, Driver } from "../types";
import mockData from "../data/mockData.json";

interface GateScreenProps {
  onCheckInComplete: (data: {
    container: Container;
    driver: Driver;
    containerStatus: "empty" | "full";
  }) => void;
}

export default function GateScreen({ onCheckInComplete }: GateScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [containerStatus, setContainerStatus] = useState<"empty" | "full">("empty");
  const [documentsVerified, setDocumentsVerified] = useState(false);

  const containers = mockData.containers as Container[];
  const drivers = mockData.drivers as Driver[];

  const handleContainerSelect = (containerId: string) => {
    const container = containers.find((c) => c.id === containerId);
    setSelectedContainer(container || null);
  };

  const handleDriverSelect = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    setSelectedDriver(driver || null);
  };

  const handleVerifyDocuments = () => {
    if (!selectedContainer || !selectedDriver) {
      message.error("Vui lòng chọn container và tài xế!");
      return;
    }
    setDocumentsVerified(true);
    message.success("Giấy tờ đã được xác thực!");
    setCurrentStep(1);
  };

  const handleInspectContainer = () => {
    message.success(`Container ${selectedContainer?.code} đã được kiểm tra!`);
    setCurrentStep(2);
  };

  const handleCheckIn = () => {
    if (!selectedContainer || !selectedDriver) return;

    message.success("Check-in thành công! Đang chuyển đến yard...");
    
    setTimeout(() => {
      onCheckInComplete({
        container: selectedContainer,
        driver: selectedDriver,
        containerStatus,
      });
    }, 1000);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Card
        style={{ width: "100%", maxWidth: 800 }}
        title={
          <div style={{ fontSize: 24, fontWeight: "bold" }}>
            🚪 Cổng Check-In Container
          </div>
        }
      >
        <Steps
          current={currentStep}
          items={[
            { title: "Xác thực", icon: <FileTextOutlined /> },
            { title: "Kiểm tra", icon: <ContainerOutlined /> },
            { title: "Hoàn tất", icon: <CheckCircleOutlined /> },
          ]}
          style={{ marginBottom: 30 }}
        />

        {/* Step 0: Document Verification */}
        {currentStep === 0 && (
          <Form form={form} layout="vertical">
            <Form.Item label="Chọn Container" required>
              <Select
                size="large"
                placeholder="Chọn container cần check-in"
                onChange={handleContainerSelect}
              >
                {containers.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    <Space>
                      <Tag color={c.status === "empty" ? "green" : "orange"}>
                        {c.code}
                      </Tag>
                      <span>{c.type}</span>
                      <span style={{ color: "#999" }}>- {c.owner}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Chọn Tài xế" required>
              <Select
                size="large"
                placeholder="Chọn tài xế"
                onChange={handleDriverSelect}
              >
                {drivers
                  .filter((d) => d.status === "available")
                  .map((d) => (
                    <Select.Option key={d.id} value={d.id}>
                      <Space>
                        <CarOutlined />
                        <span>{d.name}</span>
                        <Tag>{d.licenseNumber}</Tag>
                        <span style={{ color: "#999" }}>⭐ {d.rating}</span>
                      </Space>
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Button
              type="primary"
              size="large"
              block
              onClick={handleVerifyDocuments}
              disabled={!selectedContainer || !selectedDriver}
            >
              Xác thực giấy tờ
            </Button>
          </Form>
        )}

        {/* Step 1: Container Inspection */}
        {currentStep === 1 && selectedContainer && selectedDriver && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Container">{selectedContainer.code}</Descriptions.Item>
              <Descriptions.Item label="Loại">{selectedContainer.type}</Descriptions.Item>
              <Descriptions.Item label="Chủ sở hữu">{selectedContainer.owner}</Descriptions.Item>
              <Descriptions.Item label="Tài xế">{selectedDriver.name}</Descriptions.Item>
            </Descriptions>

            <Card title="Kiểm tra Container" size="small" style={{ marginBottom: 20 }}>
              <Form.Item label="Trạng thái container">
                <Radio.Group
                  value={containerStatus}
                  onChange={(e) => setContainerStatus(e.target.value)}
                  size="large"
                >
                  <Radio.Button value="empty">
                    <Space>
                      📦 Rỗng
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="full">
                    <Space>
                      📦 Đầy hàng
                    </Space>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Card>

            <Button type="primary" size="large" block onClick={handleInspectContainer}>
              Hoàn tất kiểm tra
            </Button>
          </div>
        )}

        {/* Step 2: Complete Check-in */}
        {currentStep === 2 && selectedContainer && selectedDriver && (
          <div style={{ textAlign: "center" }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a", marginBottom: 20 }} />
            <h2>Kiểm tra hoàn tất!</h2>
            <Descriptions bordered column={1} style={{ marginTop: 20, marginBottom: 20 }}>
              <Descriptions.Item label="Container">{selectedContainer.code}</Descriptions.Item>
              <Descriptions.Item label="Tài xế">{selectedDriver.name}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={containerStatus === "empty" ? "green" : "orange"}>
                  {containerStatus === "empty" ? "Rỗng" : "Đầy hàng"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Button type="primary" size="large" block onClick={handleCheckIn}>
              ✅ Check-In và chuyển đến Yard
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

