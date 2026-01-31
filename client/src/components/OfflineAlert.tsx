type OfflineAlertProps = {
  reconnectCount: number;
};

export const OfflineAlert: React.FC<OfflineAlertProps> = ({
  reconnectCount,
}) => {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#fff3cd",
        borderRadius: "4px",
        fontSize: "14px",
        textAlign: "center",
      }}
    >
      <strong>Offline Mode</strong>
      <br />
      <span style={{ fontSize: "12px", color: "#555" }}>
        {reconnectCount > 0
          ? `Reconnecting... (attempt ${reconnectCount})`
          : "Connecting to server..."}
      </span>
    </div>
  );
};
