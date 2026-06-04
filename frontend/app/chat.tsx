import { Text, View } from "@/components/Themed";
import { useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { ChatInput } from "@/components/chat/ChatInput";
import { LocationModal } from "@/components/chat/LocationModal";
import { MessageList } from "@/components/chat/MessageList";
import { SessionExpiredModal } from "@/components/chat/SessionExpiredModal";
import { useLocation } from "@/hooks/useLocation";
import { useSocket } from "@/hooks/useSocket";
import { ChatPayload, Message } from "@/types/chat";
import { LocationCoords } from "@/types/location";

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const pendingRef = useRef<{ text: string; history: Message[] } | null>(null);

  const { messages, isStreaming, streamResponse, sessionExpired, sendMessage } =
    useSocket();

  const { location, locationStatus, setLocationStatus, fetchLocation } =
    useLocation((coords) => {
      setShowLocationModal(false);
      flushPending(coords);
    });

  const buildPayload = (
    text: string,
    history: Message[],
    coords: LocationCoords | null
  ): ChatPayload => ({
    message: text,
    history: history.map((m) => ({ text: m.text, source: m.source })),
    ...(coords ?? {}),
  });

  const flushPending = (coords: LocationCoords | null) => {
    if (!pendingRef.current) return;
    const { text, history } = pendingRef.current;
    pendingRef.current = null;
    sendMessage(buildPayload(text, history, coords));
    setMessage("");
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (locationStatus === "granted") {
      sendMessage(buildPayload(message, messages, location));
      setMessage("");
      return;
    }

    if (
      locationStatus === "skipped" ||
      locationStatus === "denied" ||
      locationStatus === "error"
    ) {
      sendMessage(buildPayload(message, messages, null));
      setMessage("");
      return;
    }

    pendingRef.current = { text: message, history: messages };
    setShowLocationModal(true);
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
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
          <button
            onClick={fetchLocation}
            disabled={locationStatus === "loading"}
            style={{
              cursor: locationStatus === "loading" ? "default" : "pointer",
              border: `1px solid ${locationStatus === "granted" ? "#A5D6A7" : locationStatus === "loading" ? "#FFF176" : locationStatus === "denied" || locationStatus === "error" ? "#FFCC80" : "#90CAF9"}`,
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

        {sessionExpired && <SessionExpiredModal />}

        {showLocationModal && (
          <LocationModal
            locationStatus={locationStatus}
            onAllow={fetchLocation}
            onSkip={() => {
              setShowLocationModal(false);
              setLocationStatus("skipped");
              flushPending(null);
            }}
          />
        )}

        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamResponse={streamResponse}
        />

        <ChatInput
          value={message}
          onChange={setMessage}
          onSend={handleSendMessage}
          disabled={isStreaming}
        />
      </View>
    </View>
  );
}

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
});
