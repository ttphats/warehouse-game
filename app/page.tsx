"use client";

import dynamic from "next/dynamic";

const WarehouseGame = dynamic(() => import("./components/WarehouseGame"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100vw", height: "100vh", background: "#87CEEB" }} />
  ),
});

export default function Home() {
  return <WarehouseGame />;
}
