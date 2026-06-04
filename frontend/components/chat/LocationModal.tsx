import { Text, View } from "@/components/Themed";
import { StyleSheet } from "react-native";
import { LocationStatus } from "@/types/location";

type Props = {
  locationStatus: LocationStatus;
  onAllow: () => void;
  onSkip: () => void;
};

export function LocationModal({ locationStatus, onAllow, onSkip }: Props) {
  const bodyText =
    locationStatus === "denied"
      ? "Você negou o acesso à localização. Para respostas precisas, libere a permissão nas configurações do navegador e tente novamente."
      : locationStatus === "error"
      ? "Não foi possível obter sua localização. Verifique se o GPS está ativo e tente novamente."
      : "Para fornecer rotas de evacuação e condições meteorológicas da sua área, este sistema precisa da sua localização.";

  const allowLabel =
    locationStatus === "loading"
      ? "Obtendo..."
      : locationStatus === "denied" || locationStatus === "error"
      ? "Tentar novamente"
      : "Permitir localização";

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Localização necessária</Text>
        <Text style={styles.body}>{bodyText}</Text>
        <button
          onClick={onAllow}
          disabled={locationStatus === "loading"}
          style={{
            ...primaryButton,
            cursor: locationStatus === "loading" ? "default" : "pointer",
            backgroundColor:
              locationStatus === "loading" ? "#90CAF9" : "#1976D2",
          }}
        >
          {allowLabel}
        </button>
        <button onClick={onSkip} style={secondaryButton}>
          Continuar sem localização
        </button>
      </View>
    </View>
  );
}

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 24,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 32,
  paddingRight: 32,
  color: "white",
  fontWeight: "bold",
  fontSize: 15,
  fontFamily: "inherit",
  lineHeight: "inherit",
  width: "100%",
};

const secondaryButton: React.CSSProperties = {
  cursor: "pointer",
  backgroundColor: "transparent",
  border: "1px solid #9E9E9E",
  borderRadius: 24,
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 32,
  paddingRight: 32,
  color: "#757575",
  fontWeight: "500",
  fontSize: 14,
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
