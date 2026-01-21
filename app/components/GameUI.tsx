"use client";

import { useState } from "react";
import {
  Card,
  List,
  Progress,
  Button,
  Space,
  Tag,
  Statistic,
  Row,
  Col,
  Tabs,
} from "antd";
import {
  TrophyOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import useGameStore from "../store/gameStore";
import WorkflowPanel from "./WorkflowPanel";
import DriverAssignment from "./DriverAssignment";
import mockData from "../data/mockData.json";
import { ActiveJob, WorkflowStep } from "../types";

export default function GameUI() {
  const { score, inventory, tasks, currentFactory, factories, resetGame } =
    useGameStore();

  const [activeJob] = useState<ActiveJob | null>(
    mockData.activeJobs[0] as ActiveJob,
  );
  const [workflowSteps] = useState<WorkflowStep[]>(
    mockData.workflowSteps as WorkflowStep[],
  );

  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const currentFactoryName = currentFactory
    ? factories.find((f) => f.id === currentFactory)?.name
    : null;

  return (
    <>
      {/* Left Panel - Stats & Tasks */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1000,
          maxWidth: "350px",
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Điểm số và thống kê */}
          <Card
            size="small"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Điểm số"
                  value={score}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Chuyến hàng"
                  value={inventory.length}
                  prefix={<InboxOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
            </Row>
          </Card>

          {/* Nhiệm vụ */}
          <Card
            title="Nhiệm vụ"
            size="small"
            extra={
              <Tag color="blue">
                {completedTasks}/{totalTasks}
              </Tag>
            }
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <List
              size="small"
              dataSource={tasks}
              renderItem={(task) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      task.completed ? (
                        <CheckCircleOutlined
                          style={{ color: "#52c41a", fontSize: 18 }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            border: "2px solid #d9d9d9",
                            borderRadius: "50%",
                          }}
                        />
                      )
                    }
                    title={
                      <span
                        style={{
                          textDecoration: task.completed
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {task.description}
                      </span>
                    }
                    description={<Tag color="gold">+{task.reward} điểm</Tag>}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Trạng thái Container */}
          <Card
            title="Container"
            size="small"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            {currentFactoryName ? (
              <Tag color="orange" style={{ fontSize: 14, padding: "5px 10px" }}>
                🚛 Đang chở hàng từ {currentFactoryName}
              </Tag>
            ) : (
              <Tag color="green" style={{ fontSize: 14, padding: "5px 10px" }}>
                ✅ Container trống - Sẵn sàng lấy hàng
              </Tag>
            )}
            <div style={{ marginTop: 10, fontSize: 12 }}>
              <strong>Mã container:</strong> CONT-1234567
            </div>
            {inventory.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong>Lịch sử:</strong>
                <div style={{ marginTop: 5 }}>
                  {inventory.map((item, idx) => (
                    <Tag key={idx} color="blue" style={{ marginTop: 5 }}>
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Điều khiển */}
          <Card
            title="Điều khiển"
            size="small"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
          >
            <div style={{ fontSize: 12, marginBottom: 10 }}>
              <div>
                🎮 <strong>W/↑</strong> - Tiến
              </div>
              <div>
                🎮 <strong>S/↓</strong> - Lùi
              </div>
              <div>
                🎮 <strong>A/←</strong> - Rẽ trái
              </div>
              <div>
                🎮 <strong>D/→</strong> - Rẽ phải
              </div>
              <div>
                🎮 <strong>E</strong> - Lấy/Giao hàng (khi gần nhà máy)
              </div>
            </div>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={resetGame}
              block
              danger
            >
              Chơi lại
            </Button>
          </Card>
        </Space>
      </div>

      {/* Right Panel - Workflow & Drivers */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 1000,
          width: "400px",
        }}
      >
        <Tabs
          defaultActiveKey="workflow"
          items={[
            {
              key: "workflow",
              label: (
                <span>
                  <FileTextOutlined /> Quy trình
                </span>
              ),
              children: (
                <WorkflowPanel
                  activeJob={activeJob}
                  workflowSteps={workflowSteps}
                  onCompleteStep={() => {
                    console.log("Complete step");
                  }}
                  onCancelJob={() => {
                    console.log("Cancel job");
                  }}
                />
              ),
            },
            {
              key: "drivers",
              label: (
                <span>
                  <UserOutlined /> Tài xế
                </span>
              ),
              children: <DriverAssignment />,
            },
          ]}
        />
      </div>
    </>
  );
}
