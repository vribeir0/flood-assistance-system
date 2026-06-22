import { Text, View } from "react-native";
import { StyleSheet } from "react-native";
import { LocationStatus } from "@/types/location";
import Colors from "@/constants/Colors";
import { Icon } from "./Icon";

type Props = {
  locationStatus: LocationStatus;
  onAllow: () => void;
  onSkip: () => void;
};

export function LocationModal({ locationStatus, onAllow, onSkip }: Props) {
  const bodyText =
    locationStatus === "denied"
      ? "O acesso à localização foi negado. Para resultados mais precisos, libere a permissão nas configurações do navegador."
      : locationStatus === "error"
      ? "Não conseguimos obter sua localização. Verifique se o GPS está ativo e tente de novo."
      : "Precisamos da sua localização para consultar o clima da região e calcular rotas de evacuação.";

  const allowLabel =
    locationStatus === "loading"
      ? "Obtendo..."
      : locationStatus === "denied" || locationStatus === "error"
      ? "Tentar novamente"
      : "Permitir localização";

  const isLoading = locationStatus === "loading";

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Icon name="map-pin" size={24} color={Colors.brand} />
        </View>
        <Text style={styles.title}>Localização necessária</Text>
        <Text style={styles.body}>{bodyText}</Text>
        <button
          onClick={onAllow}
          disabled={isLoading}
          style={{
            ...primaryButton,
            cursor: isLoading ? "default" : "pointer",
            backgroundColor: isLoading ? Colors.sage300 : Colors.brand,
            borderColor: isLoading ? Colors.sage300 : Colors.brand,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.filter = "brightness(0.94)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
        >
          {allowLabel}
        </button>
        <button
          onClick={onSkip}
          style={secondaryButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = Colors.borderStrong;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = Colors.borderSoft;
          }}
        >
          Continuar sem localização
        </button>
      </View>
    </View>
  );
}

const primaryButton: React.CSSProperties = {
  border: `1px solid ${Colors.brand}`,
  borderRadius: 999,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 32,
  paddingRight: 32,
  color: Colors.white,
  fontWeight: 600,
  fontSize: 15,
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  lineHeight: "inherit",
  width: "100%",
  transition: "filter 130ms cubic-bezier(0.22,0.61,0.36,1)",
};

const secondaryButton: React.CSSProperties = {
  cursor: "pointer",
  backgroundColor: "transparent",
  border: `1px solid ${Colors.borderSoft}`,
  borderRadius: 999,
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 32,
  paddingRight: 32,
  color: Colors.textMuted,
  fontWeight: 500,
  fontSize: 14,
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  lineHeight: "inherit",
  width: "100%",
  transition: "border-color 130ms cubic-bezier(0.22,0.61,0.36,1)",
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(45,58,34,0.45)" as any,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 32,
    width: "85%",
    maxWidth: 420,
    alignItems: "center",
    gap: 16,
    boxShadow: "0 16px 40px rgba(45,58,34,0.16)" as any,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.sage100,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textStrong,
    textAlign: "center",
    fontFamily: "Poppins",
  },
  body: {
    fontSize: 14,
    color: Colors.textBody,
    textAlign: "center",
    lineHeight: 21,
    fontFamily: "Plus Jakarta Sans",
  },
});
