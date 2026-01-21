"use client";

import { Card, Steps, Tag, Descriptions, Space, Progress } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { WorkflowModel } from "../models/Workflow.model";

interface WorkflowTrackerProps {
  workflow: WorkflowModel;
}

export default function WorkflowTracker({ workflow }: WorkflowTrackerProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleOutlined />;
      case "in-progress":
        return <LoadingOutlined />;
      case "failed":
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getStepStatus = (status: string) => {
    switch (status) {
      case "completed":
        return "finish";
      case "in-progress":
        return "process";
      case "failed":
        return "error";
      default:
        return "wait";
    }
  };

  const getDirectionTag = (direction: string) => {
    if (direction === "inbound") {
      return <Tag color="blue">📦 Đầy Hàng (Inbound)</Tag>;
    }
    return <Tag color="green">📭 Rỗng (Outbound)</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "red",
      high: "orange",
      medium: "blue",
      low: "default",
    };
    return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
  };

  const completedSteps = workflow.steps.filter(s => s.status === "completed").length;
  const totalSteps = workflow.steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <Card
      title={
        <Space>
          <span>🚛 Workflow Tracking</span>
          {getDirectionTag(workflow.direction)}
          {getPriorityTag(workflow.priority)}
        </Space>
      }
      extra={
        <Tag color={workflow.status === "completed" ? "success" : "processing"}>
          {workflow.status.toUpperCase()}
        </Tag>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Progress */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>Tiến Độ:</strong> {completedSteps}/{totalSteps} bước
          </div>
          <Progress percent={progressPercent} status="active" />
        </div>

        {/* Workflow Info */}
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="ASN Number">
            <Tag color="purple">{workflow.asnNumber}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Điểm Đến">
            {workflow.destination}
          </Descriptions.Item>
          <Descriptions.Item label="Container">
            {workflow.containerId}
          </Descriptions.Item>
          <Descriptions.Item label="Tài Xế">
            {workflow.driverId}
          </Descriptions.Item>
          {workflow.assignedSlot && (
            <Descriptions.Item label="Vị Trí Yard">
              <Tag color="gold">📍 {workflow.assignedSlot}</Tag>
            </Descriptions.Item>
          )}
          {workflow.assignedDoor && (
            <Descriptions.Item label="Door">
              <Tag color="cyan">🚪 {workflow.assignedDoor}</Tag>
            </Descriptions.Item>
          )}
          {workflow.sealNumber && (
            <Descriptions.Item label="Seal Number">
              <Tag color="red">🔒 {workflow.sealNumber}</Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Loại Hàng">
            {workflow.cargoType.toUpperCase()}
          </Descriptions.Item>
        </Descriptions>

        {/* Steps */}
        <Steps
          current={workflow.currentStep}
          direction="vertical"
          items={workflow.steps.map((step, index) => ({
            title: step.name,
            description: (
              <Space direction="vertical" size="small">
                <div>{step.description}</div>
                {step.status === "completed" && step.actualDuration && (
                  <Tag color="green">
                    ⏱️ {Math.round(step.actualDuration)}s (dự kiến: {step.estimatedDuration}s)
                  </Tag>
                )}
                {step.status === "in-progress" && (
                  <Tag color="processing">⏳ Đang xử lý...</Tag>
                )}
              </Space>
            ),
            status: getStepStatus(step.status),
            icon: getStepIcon(step.status),
          }))}
        />
      </Space>
    </Card>
  );
}

