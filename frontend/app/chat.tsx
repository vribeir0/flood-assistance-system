import { Text, View } from "@/components/Themed";
import { useEffect, useRef, useState } from "react";
import {
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getCurrentLocation()
      .then((coords) => {
        setLocation(coords);
      })
      .catch((error) => {
        setErrorMsg("Erro ao obter localização: " + error.message);
      });
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
});
