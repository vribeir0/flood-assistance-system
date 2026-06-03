import { Text, View } from "@/components/Themed";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput } from "react-native";
import Markdown from "react-native-markdown-display";

import { LocationCoords } from "@/helpers/location";
import { chatService } from "@/services/chatService";
import { Message } from "@/types/chat";
import { Socket } from "socket.io-client";

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamResponse, setStreamResponse] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const socketRef = useRef<Socket | null>(null);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "loading" | "granted" | "denied" | "error"
  >("idle");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const fetchLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("granted");
        setShowLocationModal(false);
      },
      (error) => {
        setLocationStatus(
          error.code === error.PERMISSION_DENIED ? "denied" : "error"
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Atualiza o estado visual após disparar a requisição
    setLocationStatus("loading");
  };

  useEffect(() => {
    socketRef.current = chatService.createWebSocket();
    const socket = socketRef.current;

    socket.on("connect_error", (error) => {
      console.error("Erro de conexão:", error);
      if (error.message?.includes("rejected")) {
        socket.disconnect();
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("captcha_verified");
          sessionStorage.removeItem("captcha_session_token");
        }
        setSessionExpired(true);
      }
    });

    socket.on("reconnect_failed", () => {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("captcha_verified");
        sessionStorage.removeItem("captcha_session_token");
      }
      setSessionExpired(true);
    });

    socket.on("chat_response", (data) => {
      try {
        let response;
        if (typeof data === "string") {
          response = JSON.parse(data);
        } else if (data.data && typeof data.data === "string") {
          response = JSON.parse(data.data);
        } else {
          response = data;
        }

        if (response.type === "token") {
          setStreamResponse((prev) => prev + (response.reply || ""));
          setIsStreaming(true);
        } else if (response.type === "done") {
          setIsStreaming(false);
          setStreamResponse((currentStream) => {
            if (currentStream.trim()) {
              const botMessage: Message = {
                text: currentStream,
                source: "system",
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, botMessage]);
            }
            return "";
          });
        } else if (response.type === "error") {
          setIsStreaming(false);
          setStreamResponse("");
          const errorMessage: Message = {
            text: response.reply || "Erro desconhecido.",
            source: "system",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } catch (e) {
        console.error("Erro ao processar resposta:", e);
        const botMessage: Message = {
          text: data.data || "Erro ao processar resposta",
          source: "system",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsStreaming(false);
        setStreamResponse("");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, streamResponse]);

  const handleSendMessage = async () => {
    if (!message.trim() || !socketRef.current) return;

    if (locationStatus !== "granted") {
      setShowLocationModal(true);
      return;
    }

    const userMessage: Message = {
      text: message,
      source: "user",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const messageData: any = { message };
    messageData.latitude = location!.latitude;
    messageData.longitude = location!.longitude;

    socketRef.current.emit("chat_message", messageData);
    setMessage("");
    setIsStreaming(true);
  };

  const locationLabel =
    locationStatus === "granted"
      ? "Localização ativa"
      : locationStatus === "loading"
      ? "Obtendo..."
      : locationStatus === "denied"
      ? "Negada"
      : locationStatus === "error"
      ? "Erro"
      : "Compartilhar localização";

  return (
    <View style={styles.container}>
      <View style={styles.chatWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
          <button
            onClick={fetchLocation}
            disabled={locationStatus === "loading"}
            style={{
              cursor: locationStatus === "loading" ? "default" : "pointer",
              border: `1px solid ${
                locationStatus === "granted"
                  ? "#A5D6A7"
                  : locationStatus === "loading"
                  ? "#FFF176"
                  : locationStatus === "denied" || locationStatus === "error"
                  ? "#FFCC80"
                  : "#90CAF9"
              }`,
              backgroundColor:
                locationStatus === "granted"
                  ? "#E8F5E9"
                  : locationStatus === "loading"
                  ? "#FFF9C4"
                  : locationStatus === "denied" || locationStatus === "error"
                  ? "#FFF3E0"
                  : "#E3F2FD",
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
            }}
          >
            {locationLabel}
          </button>
        </View>

        {/* Overlay bloqueante de sessão expirada */}
        {sessionExpired && (
          <View style={styles.locationOverlay}>
            <View style={styles.locationOverlayCard}>
              <Text style={styles.locationOverlayTitle}>Conexão perdida</Text>
              <Text style={styles.locationOverlayText}>
                A sessão expirou ou a conexão foi recusada pelo servidor.
                Recarregue a página para reconectar.
              </Text>
              <button
                onClick={() => window.location.reload()}
                style={{
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
                }}
              >
                Recarregar
              </button>
            </View>
          </View>
        )}

        {showLocationModal && (
          <View style={styles.locationOverlay}>
            <View style={styles.locationOverlayCard}>
              <Text style={styles.locationOverlayTitle}>
                Localização necessária
              </Text>
              <Text style={styles.locationOverlayText}>
                {locationStatus === "denied"
                  ? "Você negou o acesso à localização. Para respostas precisas, libere a permissão nas configurações do navegador e tente novamente."
                  : locationStatus === "error"
                  ? "Não foi possível obter sua localização. Verifique se o GPS está ativo e tente novamente."
                  : "Para fornecer rotas de evacuação e condições meteorológicas da sua área, este sistema precisa da sua localização."}
              </Text>
              <button
                onClick={fetchLocation}
                disabled={locationStatus === "loading"}
                style={{
                  cursor: locationStatus === "loading" ? "default" : "pointer",
                  backgroundColor:
                    locationStatus === "loading" ? "#90CAF9" : "#1976D2",
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
                }}
              >
                {locationStatus === "loading"
                  ? "Obtendo..."
                  : locationStatus === "denied" || locationStatus === "error"
                  ? "Tentar novamente"
                  : "Permitir localização"}
              </button>
            </View>
          </View>
        )}

        {/* Mensagens — ocupa todo o espaço restante */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 && !isStreaming && (
            <Text style={styles.emptyText}>
              Envie uma mensagem para começar.
            </Text>
          )}
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.messageBox,
                msg.source === "user"
                  ? styles.userMessage
                  : styles.systemMessage,
              ]}
            >
              {msg.source === "user" ? (
                <Text style={styles.messageText}>{msg.text}</Text>
              ) : (
                <Markdown style={markdownStyles}>{msg.text}</Markdown>
              )}
            </View>
          ))}
          {isStreaming && (
            <View style={[styles.messageBox, styles.systemMessage]}>
              {streamResponse.trim() ? (
                <Markdown style={markdownStyles}>{streamResponse}</Markdown>
              ) : (
                <Text style={[styles.messageText, styles.waitingText]}>
                  Aguardando resposta...
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input fixo na base */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSendMessage}
            editable={!isStreaming}
            returnKeyType="send"
            placeholder="Digite sua mensagem..."
            placeholderTextColor="gray"
            multiline={false}
          />
          <button
            onClick={handleSendMessage}
            disabled={isStreaming}
            style={{
              backgroundColor: isStreaming ? "#90CAF9" : "#1976D2",
              border: "none",
              borderRadius: 24,
              paddingTop: 11,
              paddingBottom: 11,
              paddingLeft: 20,
              paddingRight: 20,
              color: "white",
              fontWeight: "bold",
              fontSize: 15,
              cursor: isStreaming ? "default" : "pointer",
              fontFamily: "inherit",
              lineHeight: "inherit",
            }}
          >
            Enviar
          </button>
        </View>
      </View>
    </View>
  );
}

const markdownStyles = {
  body: { fontSize: 15, color: "#333" },
  code_inline: {
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: "monospace",
  },
  fence: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    padding: 10,
    fontFamily: "monospace",
    fontSize: 13,
  },
  strong: { fontWeight: "bold" as const },
  em: { fontStyle: "italic" as const },
};

const styles = StyleSheet.create({
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
    // garante que o wrapper ocupe toda a altura e organize os filhos em coluna
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

  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 12,
    paddingBottom: 16,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 14,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  messageBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  systemMessage: {
    backgroundColor: "#F0F0F0",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 15,
    color: "#222",
  },
  waitingText: {
    color: "gray",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "white",
    // garante que o input nunca saia da tela
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    backgroundColor: "#fafafa",
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: "#1976D2",
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  locationOverlay: {
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
  locationOverlayCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 32,
    width: "85%",
    maxWidth: 420,
    alignItems: "center",
    gap: 16,
  },
  locationOverlayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1976D2",
    textAlign: "center",
  },
  locationOverlayText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 21,
  },
});
