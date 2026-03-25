import { Text, View } from "@/components/Themed";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from "react-native";
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

  const fetchLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }

    // getCurrentPosition deve ser a primeira chamada dentro do handler de
    // toque. No Safari, qualquer setState antes da chamada privilegiada pode
    // invalidar a user gesture e negar a permissão sem exibir o prompt.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("granted");
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
    if (message.trim() && socketRef.current) {
      const userMessage: Message = {
        text: message,
        source: "user",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const messageData: any = { message };
      if (location) {
        messageData.latitude = location.latitude;
        messageData.longitude = location.longitude;
      }

      socketRef.current.emit("chat_message", messageData);
      setMessage("");
      setIsStreaming(true);
    }
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.chatWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              locationStatus === "granted" && styles.locationButtonActive,
              locationStatus === "loading" && styles.locationButtonLoading,
              (locationStatus === "denied" || locationStatus === "error") &&
                styles.locationButtonError,
            ]}
            onPress={fetchLocation}
            disabled={locationStatus === "loading"}
          >
            <Text style={styles.locationButtonText}>{locationLabel}</Text>
          </TouchableOpacity>
        </View>

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
              {locationStatus === "idle" || locationStatus === "denied"
                ? "Compartilhe sua localização para obter informações mais precisas."
                : "Envie uma mensagem para começar."}
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
          <TouchableOpacity
            style={[
              styles.sendButton,
              isStreaming && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={isStreaming}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    // No web, garante que o container nunca ultrapasse a altura da viewport
    ...(Platform.OS === "web"
      ? {
          height: "100vh" as any,
          maxHeight: "100vh" as any,
          overflow: "hidden" as any,
        }
      : {}),
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
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  locationButtonActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#A5D6A7",
  },
  locationButtonLoading: {
    backgroundColor: "#FFF9C4",
    borderColor: "#FFF176",
  },
  locationButtonError: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FFCC80",
  },
  locationButtonText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
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
  sendButtonDisabled: {
    backgroundColor: "#90CAF9",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
});
