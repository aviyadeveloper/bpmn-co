import React from "react";

type ConnectionStatusIndicatorProps = {
  isConnected: boolean;
  lastActivity: string;
  connectionError: string | null;
};

export const ConnectionStatusIndicator: React.FC<
  ConnectionStatusIndicatorProps
> = ({ isConnected, lastActivity, connectionError }) => (
  <div
    style={{
      position: "absolute",
      top: 10,
      right: 10,
      padding: "8px 12px",
      backgroundColor: isConnected ? "#4caf50" : "#f44336",
      color: "white",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "bold",
      zIndex: 1000,
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    }}
  >
    {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
    {lastActivity && (
      <div style={{ fontSize: "10px", marginTop: "4px", fontWeight: "normal" }}>
        {lastActivity}
      </div>
    )}
    {connectionError && (
      <div style={{ fontSize: "10px", marginTop: "4px" }}>
        {connectionError}
      </div>
    )}
  </div>
);
