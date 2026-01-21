"use client";

import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import SimpleGame from "./SimpleGame";

export default function GameContent() {
  return (
    <ConfigProvider locale={viVN}>
      <SimpleGame />
    </ConfigProvider>
  );
}
