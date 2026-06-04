import { Text, View } from "@/components/Themed";
import { StyleSheet } from "react-native";

export function SessionExpiredModal() {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Conexão perdida</Text>
        <Text style={styles.body}>
          A sessão expirou ou a conexão foi recusada pelo servidor. Recarregue a
          página para reconectar.
        </Text>
        <button onClick={() => window.location.reload()} style={primaryButton}>
          Recarregar
        </button>
      </View>
    </View>
  );
}

const primaryButton: React.CSSProperties = {
  backgroundColor: "#1976D2",
  border: "none",
  borderRadius: 24,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 32,
  paddingRight: 32,
  color: "white",
  fontWeight: "bold",
  fontSize: 15,
  cursor: "pointer",
  fontFamily: "inherit",
  lineHeight: "inherit",
  width: "100%",
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 32,
    width: "85%",
    maxWidth: 420,
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1976D2",
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 21,
  },
});
