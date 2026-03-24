import { Text, View } from "@/components/Themed";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";

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
            Chatbot Inteligente para Orientação em Eventos Hidrometeorológicos
          </Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Sobre o Sistema</Text>
          <Text style={styles.description}>
            Chatbot desenvolvido para orientar usuários localizados em áreas de
            risco durante eventos hidrometeorológicos extremos, como enchentes.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Identificação de Riscos</Text>
                <Text style={styles.featureDescription}>
                  Interpreta situações relatadas e fornece recomendações
                  preventivas.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Integração de Dados</Text>
                <Text style={styles.featureDescription}>
                  Consome dados de APIs metereológicas em tempo real.
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Agentes MCP</Text>
                <Text style={styles.featureDescription}>
                  Utiliza arquitetura de agentes baseados em LLM para análise de
                  risco e formulação de respostas.
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
            Sistema desenvolvido como parte do Trabalho de Conclusão de Curso
          </Text>
          <Text style={styles.footerText}>
            Vinicius Santos Ribeiro - UTFPR - Universidade Tecnológica Federal
            do Paraná
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
