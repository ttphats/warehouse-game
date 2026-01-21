"use client";

import { useState } from "react";
import { Modal, Form, Select, Input, Radio, Button, Space, Tag, message } from "antd";
import { ContainerDirection, CargoType } from "../models/Workflow.model";

interface TaskAssignmentProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (task: TaskData) => void;
  drivers: any[];
  containers: any[];
}

export interface TaskData {
  driverId: string;
  containerId: string;
  vehicleId: string;
  direction: ContainerDirection;
  asnNumber: string;
  destination: string;
  cargoType: CargoType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function TaskAssignment({
  visible,
  onClose,
  onAssign,
  drivers,
  containers,
}: TaskAssignmentProps) {
  const [form] = Form.useForm();
  const [direction, setDirection] = useState<ContainerDirection>("inbound");

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const taskData: TaskData = {
        driverId: values.driverId,
        containerId: values.containerId,
        vehicleId: `TRUCK-${values.driverId}`,
        direction: values.direction,
        asnNumber: values.asnNumber || `ASN-${Date.now()}`,
        destination: values.destination,
        cargoType: values.cargoType || 'general',
        priority: values.priority || 'medium',
      };

      onAssign(taskData);
      message.success(`✅ Đã giao nhiệm vụ cho tài xế!`);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title="📋 Giao Nhiệm Vụ Cho Tài Xế"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Giao Nhiệm Vụ
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ direction: "inbound", priority: "medium" }}>
        {/* Driver Selection */}
        <Form.Item
          label="Chọn Tài Xế"
          name="driverId"
          rules={[{ required: true, message: "Vui lòng chọn tài xế" }]}
        >
          <Select
            placeholder="Chọn tài xế"
            options={drivers
              .filter(d => d.status === "available")
              .map(d => ({
                label: (
                  <Space>
                    <span>{d.name}</span>
                    <Tag color="blue">⭐ {d.rating}</Tag>
                    <Tag>{d.totalTrips} chuyến</Tag>
                  </Space>
                ),
                value: d.id,
              }))}
          />
        </Form.Item>

        {/* Container Selection */}
        <Form.Item
          label="Chọn Container"
          name="containerId"
          rules={[{ required: true, message: "Vui lòng chọn container" }]}
        >
          <Select
            placeholder="Chọn container"
            options={containers.map(c => ({
              label: (
                <Space>
                  <span>{c.code}</span>
                  <Tag color={c.status === "empty" ? "green" : "orange"}>
                    {c.status === "empty" ? "Rỗng" : "Đầy"}
                  </Tag>
                  <Tag>{c.type}</Tag>
                </Space>
              ),
              value: c.id,
            }))}
          />
        </Form.Item>

        {/* Direction */}
        <Form.Item
          label="Loại Nhiệm Vụ"
          name="direction"
          rules={[{ required: true }]}
        >
          <Radio.Group onChange={(e) => setDirection(e.target.value)}>
            <Radio.Button value="inbound">
              📦 Inbound (Giao Hàng Đầy)
            </Radio.Button>
            <Radio.Button value="outbound">
              📭 Outbound (Lấy Container Rỗng)
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Destination */}
        <Form.Item
          label="Điểm Đến"
          name="destination"
          rules={[{ required: true, message: "Vui lòng nhập điểm đến" }]}
        >
          <Input placeholder="Ví dụ: Kho ABC, Nhà máy XYZ" />
        </Form.Item>

        {/* ASN Number */}
        <Form.Item label="ASN Number" name="asnNumber">
          <Input placeholder="Tự động tạo nếu để trống" />
        </Form.Item>

        {/* Cargo Type */}
        <Form.Item label="Loại Hàng" name="cargoType">
          <Select
            placeholder="Chọn loại hàng"
            options={[
              { label: "🚚 General (Hàng Thường)", value: "general" },
              { label: "📦 E-commerce (Ưu Tiên)", value: "ecom" },
              { label: "❄️ Reefer (Lạnh)", value: "reefer" },
              { label: "⚠️ Hazmat (Nguy Hiểm)", value: "hazmat" },
            ]}
          />
        </Form.Item>

        {/* Priority */}
        <Form.Item label="Độ Ưu Tiên" name="priority">
          <Radio.Group>
            <Radio.Button value="low">Thấp</Radio.Button>
            <Radio.Button value="medium">Trung Bình</Radio.Button>
            <Radio.Button value="high">Cao</Radio.Button>
            <Radio.Button value="urgent">Khẩn Cấp</Radio.Button>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}

