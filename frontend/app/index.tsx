import { Text, View } from "@/components/Themed";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Sistema de Assistência contra Enchentes
          </Text>
          <Text style={styles.subtitle}>
            Orientação em eventos hidrometeorológicos extremos
          </Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Sobre o Sistema</Text>
          <Text style={styles.description}>
            Um chatbot que orienta pessoas em áreas de risco durante enchentes
            e alagamentos, com dados meteorológicos e rotas de evacuação.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Identificação de Riscos</Text>
                <Text style={styles.featureDescription}>
                  Avalia a situação relatada pelo usuário e sugere o que fazer.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Integração de Dados</Text>
                <Text style={styles.featureDescription}>
                  Consulta APIs meteorológicas em tempo real para avaliar o
                  risco na região do usuário.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Agentes MCP</Text>
                <Text style={styles.featureDescription}>
                  Usa agentes LLM com protocolo MCP para buscar dados e montar
                  as respostas.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Modo de Teste</Text>
                <Text style={styles.featureDescription}>
                  Simula um cenário de risco alto no chat, sem depender das
                  condições reais. Basta ativar no topo da tela de conversa.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push("/chat")}
        >
          <Text style={styles.startButtonText}>Iniciar Chat</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Trabalho de Conclusão de Curso
          </Text>
          <Text style={styles.footerText}>
            Vinicius Santos Ribeiro — UTFPR
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    overflow: "hidden" as any,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#1976D2",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#666",
    maxWidth: 600,
  },
  descriptionContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 30,
    maxWidth: 800,
    width: "100%",
    marginBottom: 30,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    marginBottom: 30,
  },
  featuresContainer: {
    gap: 20,
  },
  feature: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
  startButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 40,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
