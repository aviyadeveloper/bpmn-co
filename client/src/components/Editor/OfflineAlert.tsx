export const OfflineAlert: React.FC = ({}) => {
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
        : "Connecting to server..."
      </span>
    </div>
  );
};
