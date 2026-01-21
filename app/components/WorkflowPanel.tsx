"use client";

import { Card, Steps, Tag, Descriptions, Button, Space } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  UserOutlined,
  ContainerOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { ActiveJob, WorkflowStep } from "../types";

interface WorkflowPanelProps {
  activeJob: ActiveJob | null;
  workflowSteps: WorkflowStep[];
  onCompleteStep?: () => void;
  onCancelJob?: () => void;
}

export default function WorkflowPanel({
  activeJob,
  workflowSteps,
  onCompleteStep,
  onCancelJob,
}: WorkflowPanelProps) {
  if (!activeJob) {
    return (
      <Card
        title="Quy trình làm việc"
        size="small"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
      >
        <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
          Chưa có công việc nào đang thực hiện
        </div>
      </Card>
    );
  }

  const currentStepIndex = activeJob.currentStep - 1;

  return (
    <Card
      title={
        <Space>
          <span>Quy trình làm việc</span>
          <Tag color={activeJob.type === "import" ? "blue" : "green"}>
            {activeJob.type.toUpperCase()}
          </Tag>
        </Space>
      }
      size="small"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
      extra={
        <Tag color="processing">
          Bước {activeJob.currentStep}/{workflowSteps.length}
        </Tag>
      }
    >
      {/* Job Info */}
      <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
        <Descriptions.Item label={<><UserOutlined /> Tài xế</>}>
          {activeJob.driverId}
        </Descriptions.Item>
        <Descriptions.Item label={<><ContainerOutlined /> Container</>}>
          {activeJob.containerId}
        </Descriptions.Item>
        <Descriptions.Item label={<><CarOutlined /> Xe</>}>
          {activeJob.vehicleId}
        </Descriptions.Item>
        <Descriptions.Item label="Từ">
          {activeJob.fromLocation}
        </Descriptions.Item>
        <Descriptions.Item label="Đến">
          {activeJob.toLocation}
        </Descriptions.Item>
      </Descriptions>

      {/* Workflow Steps */}
      <Steps
        direction="vertical"
        size="small"
        current={currentStepIndex}
        items={workflowSteps.map((step, index) => {
          const jobStep = activeJob.steps[index];
          let status: "wait" | "process" | "finish" | "error" = "wait";
          let icon = <ClockCircleOutlined />;

          if (jobStep.status === "completed") {
            status = "finish";
            icon = <CheckCircleOutlined />;
          } else if (jobStep.status === "in-progress") {
            status = "process";
            icon = <LoadingOutlined />;
          } else if (jobStep.status === "failed") {
            status = "error";
          }

          return {
            title: step.name,
            description: (
              <div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {step.description}
                </div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                  ⏱️ ~{step.estimatedTime} phút
                </div>
                {jobStep.completedAt && (
                  <Tag color="success" style={{ marginTop: 4 }}>
                    ✓ Hoàn thành lúc{" "}
                    {new Date(jobStep.completedAt).toLocaleTimeString("vi-VN")}
                  </Tag>
                )}
              </div>
            ),
            status,
            icon,
          };
        })}
      />

      {/* Actions */}
      <Space style={{ marginTop: 16, width: "100%" }} direction="vertical">
        {activeJob.status === "in-progress" && (
          <Button
            type="primary"
            block
            onClick={onCompleteStep}
            icon={<CheckCircleOutlined />}
          >
            Hoàn thành bước hiện tại
          </Button>
        )}
        <Button danger block onClick={onCancelJob}>
          Hủy công việc
        </Button>
      </Space>
    </Card>
  );
}

