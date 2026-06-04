import { Text, View } from "@/components/Themed";
import { useRef, useState } from "react";

import { ChatInput } from "@/components/chat/ChatInput";
import { LocationModal } from "@/components/chat/LocationModal";
import { MessageList } from "@/components/chat/MessageList";
import { useLocation } from "@/hooks/useLocation";
import { useSocket } from "@/hooks/useSocket";
import { ChatPayload, Message } from "@/types/chat";
import { LocationCoords } from "@/types/location";
import {
  styles,
  getLocationButtonStyle,
  getTestModeButtonStyle,
  testModeBannerStyle,
} from "@/styles/chat";

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const pendingRef = useRef<{ text: string; history: Message[] } | null>(null);

  const { messages, isStreaming, streamResponse, sendMessage } = useSocket();

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
    ...(testMode ? { test_mode: true } : {}),
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
          <View style={{ flexDirection: "row", gap: 8 }}>
            <button
              onClick={() => setTestMode((prev) => !prev)}
              style={getTestModeButtonStyle(testMode)}
            >
              {testMode ? "⚠ Modo Teste" : "Modo Teste"}
            </button>
            <button
              onClick={fetchLocation}
              disabled={locationStatus === "loading"}
              style={getLocationButtonStyle(locationStatus)}
            >
              {locationLabel}
            </button>
          </View>
        </View>

        {testMode && (
          <div style={testModeBannerStyle}>
            Modo de teste ativo. O risco será tratado como alto, independente do
            clima real.
          </div>
        )}

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
