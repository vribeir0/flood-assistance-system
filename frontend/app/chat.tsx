import { Text, View } from "@/components/Themed";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import Markdown from "react-native-markdown-display";

import { getCurrentLocation, LocationCoords } from "@/helpers/location";
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
    setLocationStatus("loading");
    getCurrentLocation()
      .then((coords) => {
        setLocation(coords);
        setLocationStatus("granted");
      })
      .catch((error) => {
        const msg: string = error.message ?? "Erro desconhecido";
        setLocationStatus(msg.includes("negada") ? "denied" : "error");
      });
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

  const locationIcon =
    locationStatus === "granted"
      ? "📍"
      : locationStatus === "loading"
      ? "⏳"
      : locationStatus === "denied"
      ? "🚫"
      : locationStatus === "error"
      ? "⚠️"
      : "📍";

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
            <Text style={styles.locationButtonText}>
              {locationIcon} {locationLabel}
            </Text>
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
                ? "💡 Compartilhe sua localização para obter rotas de evacuação precisas."
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

import { getCurrentLocation, LocationCoords } from "@/helpers/location";
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
    "loading" | "granted" | "denied" | "error"
  >("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLocation = () => {
    setLocationStatus("loading");
    getCurrentLocation()
      .then((coords) => {
        setLocation(coords);
        setLocationStatus("granted");
      })
      .catch((error) => {
        const msg: string = error.message ?? "Erro desconhecido";
        setErrorMsg(msg);
        setLocationStatus(msg.includes("negada") ? "denied" : "error");
      });
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    socketRef.current = chatService.createWebSocket();
    const socket = socketRef.current;

    socket.on("connect_error", (error) => {
      console.error("Erro de conexão:", error);
    });

    socket.on("chat_response", (data) => {
      try {
        let response;
        // Verificar se precisa alterar o formato da resposta para lidar com streaming
        if (typeof data === "string") {
          response = JSON.parse(data);
        } else if (data.data && typeof data.data === "string") {
          response = JSON.parse(data.data);
        } else {
          response = data;
        }

        // Se for token, acumula na resposta de streaming
        if (response.type === "token") {
          setStreamResponse((prev) => prev + (response.reply || ""));
          setIsStreaming(true);
        }
        // Se for done, finaliza o streaming e adiciona mensagem completa
        else if (response.type === "done") {
          setIsStreaming(false);

          // pegar o valor atual do streamResponse
          setStreamResponse((currentStream) => {
            if (currentStream.trim()) {
              const botMessage: Message = {
                text: currentStream,
                source: "system",
                timestamp: Date.now(),
              };
              setMessages((prev) => [...prev, botMessage]);
            }

            return ""; // Limpa o stream
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

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      const messageData: any = {
        message: message,
      };

      if (location) {
        messageData.latitude = location.latitude;
        messageData.longitude = location.longitude;
      } else {
        console.warn("Localização não disponível");
      }

      socketRef.current.emit("chat_message", messageData);

      setMessage("");
      setIsStreaming(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatWrapper}>
        <Text style={styles.title}>ChatT</Text>

        {/* Banner de status de localização */}
        {locationStatus === "loading" && (
          <View style={[styles.locationBanner, styles.locationLoading]}>
            <Text style={styles.locationBannerText}>
              📍 Obtendo localização...
            </Text>
          </View>
        )}
        {locationStatus === "denied" && (
          <View style={[styles.locationBanner, styles.locationError]}>
            <Text style={styles.locationBannerText}>
              ⚠️ Permissão de localização negada. Ative nas configurações do
              navegador.
            </Text>
          </View>
        )}
        {locationStatus === "error" && (
          <View style={[styles.locationBanner, styles.locationError]}>
            <Text style={styles.locationBannerText}>⚠️ {errorMsg}</Text>
            <TouchableOpacity
              onPress={fetchLocation}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
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

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSendMessage}
            editable={!isStreaming}
            autoFocus={true}
            returnKeyType="send"
            placeholder="Digite sua mensagem..."
            placeholderTextColor="gray"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={isStreaming}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const markdownStyles = {
  body: {
    fontSize: 16,
    color: "#333",
  },
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
    fontSize: 14,
  },
  strong: {
    fontWeight: "bold" as const,
  },
  em: {
    fontStyle: "italic" as const,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatWrapper: {
    flex: 1,
    alignSelf: "center",
    width: "50%",
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  messagesContainer: {
    flex: 1,
    width: "100%",
  },
  messagesList: {
    paddingBottom: 10,
  },
  messageBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  systemMessage: {
    backgroundColor: "lightgray",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  waitingText: {
    color: "gray",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "lightgray",
    paddingTop: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "lightgray",
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  locationBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  locationLoading: {
    backgroundColor: "#E3F2FD",
  },
  locationError: {
    backgroundColor: "#FFF3E0",
  },
  locationBannerText: {
    fontSize: 13,
    color: "#555",
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#FF9800",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
