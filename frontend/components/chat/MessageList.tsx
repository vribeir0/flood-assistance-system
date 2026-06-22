import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/types/chat";
import Colors from "@/constants/Colors";
import { Icon } from "./Icon";

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
      style={styles.scroll}
      contentContainerStyle={styles.content}
      onContentSizeChange={() =>
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }
    >
      {messages.map((msg, idx) => {
        const isUser = msg.source === "user";
        return (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: isUser ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 10,
              maxWidth: "82%",
              alignSelf: isUser ? "flex-end" : "flex-start",
            }}
          >
            {!isUser && <AssistantAvatar />}
            <div
              style={{
                padding: "11px 15px",
                boxShadow: "0 1px 2px rgba(67,83,52,0.06)",
                minWidth: 0,
                overflowWrap: "break-word",
                wordBreak: "break-word",
                ...(isUser
                  ? {
                      backgroundColor: Colors.sage100,
                      border: `1px solid ${Colors.sage200}`,
                      borderRadius: "16px 16px 4px 16px",
                    }
                  : {
                      backgroundColor: Colors.surfaceCard,
                      border: `1px solid ${Colors.borderHair}`,
                      borderRadius: "16px 16px 16px 4px",
                    }),
              }}
            >
              {isUser ? (
                <span style={{
                  fontSize: 15,
                  color: Colors.textBody,
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  lineHeight: "1.5",
                }}>
                  {msg.text}
                </span>
              ) : (
                <Markdown style={markdownStyles}>{msg.text}</Markdown>
              )}
            </div>
          </div>
        );
      })}
      {isStreaming && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 10,
            maxWidth: "82%",
            alignSelf: "flex-start",
          }}
        >
          <AssistantAvatar />
          <div
            style={{
              padding: "11px 15px",
              backgroundColor: Colors.surfaceCard,
              border: `1px solid ${Colors.borderHair}`,
              borderRadius: "16px 16px 16px 4px",
              boxShadow: "0 1px 2px rgba(67,83,52,0.06)",
              minWidth: 0,
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
          >
            {streamResponse.trim() ? (
              <Markdown style={markdownStyles}>{streamResponse}</Markdown>
            ) : (
              <TypingDots />
            )}
          </div>
        </div>
      )}
    </ScrollView>
  );
}

function AssistantAvatar() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: 10,
        backgroundColor: Colors.brand,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name="droplet" size={17} color={Colors.cream200} />
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "inline-flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      <span style={{ ...dotStyle, animationDelay: "0ms" }} />
      <span style={{ ...dotStyle, animationDelay: "160ms" }} />
      <span style={{ ...dotStyle, animationDelay: "320ms" }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes ava-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}`,
        }}
      />
    </div>
  );
}

const dotStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: Colors.sage300,
  display: "inline-block",
  animation: "ava-bounce 1s infinite ease-in-out",
};

const markdownStyles = {
  body: {
    fontSize: 15,
    color: Colors.textBody,
    fontFamily: "Plus Jakarta Sans",
    lineHeight: 22,
  },
  code_inline: {
    backgroundColor: Colors.sage050,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: "monospace",
  },
  fence: {
    backgroundColor: Colors.sage050,
    borderRadius: 6,
    padding: 10,
    fontFamily: "monospace",
    fontSize: 13,
  },
  strong: { fontWeight: "bold" as const },
  em: { fontStyle: "italic" as const },
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    padding: 24,
    paddingBottom: 16,
    flexGrow: 1,
    maxWidth: 720,
    width: "100%",
    marginHorizontal: "auto" as any,
    gap: 14,
  },
});
