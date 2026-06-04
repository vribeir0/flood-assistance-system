import { StyleSheet } from "react-native";
import { LocationStatus } from "@/types/location";

const locationColors: Record<string, { bg: string; border: string }> = {
  granted: { bg: "#E8F5E9", border: "#A5D6A7" },
  loading: { bg: "#FFF9C4", border: "#FFF176" },
  denied: { bg: "#FFF3E0", border: "#FFCC80" },
  error: { bg: "#FFF3E0", border: "#FFCC80" },
  idle: { bg: "#E3F2FD", border: "#90CAF9" },
  skipped: { bg: "#E3F2FD", border: "#90CAF9" },
};

export function getLocationButtonStyle(
  status: LocationStatus
): React.CSSProperties {
  const colors = locationColors[status] ?? locationColors.idle;
  return {
    cursor: status === "loading" ? "default" : "pointer",
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    borderRadius: 20,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
    fontFamily: "inherit",
    lineHeight: "inherit",
  };
}

export const testModeBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 16px",
  backgroundColor: "#FFF8F0",
  borderBottom: "1px solid #F5D5B0",
  color: "#BF6A30",
  fontSize: 13,
  fontWeight: "600",
  fontFamily: "inherit",
};

export function getTestModeButtonStyle(active: boolean): React.CSSProperties {
  return {
    cursor: "pointer",
    border: `1px solid ${active ? "#FFCC80" : "#90CAF9"}`,
    backgroundColor: active ? "#FFF3E0" : "#E3F2FD",
    borderRadius: 20,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 13,
    color: active ? "#E65100" : "#444",
    fontWeight: "500",
    fontFamily: "inherit",
    lineHeight: "inherit",
  };
}

export const connectionLostBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "10px 16px",
  backgroundColor: "#FFF3E0",
  border: "none",
  borderBottom: "1px solid #FFCC80",
  color: "#E65100",
  fontSize: 13,
  fontWeight: "500",
  fontFamily: "inherit",
  cursor: "pointer",
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    height: "100vh" as any,
    maxHeight: "100vh" as any,
    overflow: "hidden" as any,
  },
  chatWrapper: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: 800,
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "white",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1976D2",
  },
});
