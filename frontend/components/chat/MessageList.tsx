import { Text, View } from "@/components/Themed";
import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/types/chat";

type Props = {
  messages: Message[];
  isStreaming: boolean;
  streamResponse: string;
};

export function MessageList({ messages, isStreaming, streamResponse }: Props) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, streamResponse]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      onContentSizeChange={() =>
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }
    >
      {messages.length === 0 && !isStreaming && (
        <Text style={styles.emptyText}>Envie uma mensagem para começar.</Text>
      )}
      {messages.map((msg, idx) => (
        <View
          key={idx}
          style={[
            styles.bubble,
            msg.source === "user" ? styles.userBubble : styles.systemBubble,
          ]}
        >
          {msg.source === "user" ? (
            <Text style={styles.text}>{msg.text}</Text>
          ) : (
            <Markdown style={markdownStyles}>{msg.text}</Markdown>
          )}
        </View>
      ))}
      {isStreaming && (
        <View style={[styles.bubble, styles.systemBubble]}>
          {streamResponse.trim() ? (
            <Markdown style={markdownStyles}>{streamResponse}</Markdown>
          ) : (
            <Text style={[styles.text, styles.waitingText]}>
              Aguardando resposta...
            </Text>
          )}
        </View>
      )}
    </ScrollView>
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
  container: { flex: 1, minHeight: 0 },
  content: { padding: 12, paddingBottom: 16, flexGrow: 1 },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 14,
    marginTop: 40,
    paddingHorizontal: 20,
  },
  bubble: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    maxWidth: "80%",
  },
  userBubble: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  systemBubble: { backgroundColor: "#F0F0F0", alignSelf: "flex-start" },
  text: { fontSize: 15, color: "#222" },
  waitingText: { color: "gray", fontStyle: "italic" },
});
