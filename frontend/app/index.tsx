import { useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

import { ChatInput } from "@/components/chat/ChatInput";
import { LocationModal } from "@/components/chat/LocationModal";
import { MessageList } from "@/components/chat/MessageList";
import { Logo } from "@/components/chat/Logo";
import { SuggestionCard } from "@/components/chat/SuggestionCard";
import { Icon, IconName } from "@/components/chat/Icon";
import { useLocation } from "@/hooks/useLocation";
import { useSocket } from "@/hooks/useSocket";
import { ChatPayload, Message } from "@/types/chat";
import { LocationCoords } from "@/types/location";
import Colors from "@/constants/Colors";

const SUGGESTIONS: {
  icon: IconName;
  title: string;
  subtitle: string;
  seed: string;
}[] = [
  {
    icon: "cloud-rain",
    title: "Está chovendo muito aqui",
    subtitle: "quero saber se há risco de alagamento",
    seed: "Está chovendo muito forte na minha região. Há risco de alagamento?",
  },
  {
    icon: "waves",
    title: "A água está subindo",
    subtitle: "o que devo fazer neste momento?",
    seed: "A água está subindo perto de casa. O que eu devo fazer agora?",
  },
  {
    icon: "navigation",
    title: "Preciso de uma rota segura",
    subtitle: "para sair da minha região agora",
    seed: "Preciso de uma rota segura para sair da minha região.",
  },
  {
    icon: "shield-check",
    title: "Onde fica o abrigo",
    subtitle: "mais próximo e seguro de mim?",
    seed: "Onde fica o abrigo seguro mais próximo da minha localização?",
  },
];

function Switch({ on }: { on: boolean }) {
  const trackColor = on ? Colors.riskDanger : Colors.gold400;
  return (
    <span
      style={{
        width: 40,
        height: 23,
        borderRadius: 99,
        background: trackColor,
        position: "relative",
        transition: "background 220ms",
        flexShrink: 0,
        display: "inline-block",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2.5,
          left: on ? 19 : 2.5,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 220ms cubic-bezier(0.22,0.61,0.36,1)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      />
    </span>
  );
}

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

  const handleSend = (text?: string) => {
    const msgText = text ?? message;
    if (!msgText.trim()) return;

    if (locationStatus === "granted") {
      sendMessage(buildPayload(msgText, messages, location));
      setMessage("");
      return;
    }

    if (
      locationStatus === "skipped" ||
      locationStatus === "denied" ||
      locationStatus === "error"
    ) {
      sendMessage(buildPayload(msgText, messages, null));
      setMessage("");
      return;
    }

    pendingRef.current = { text: msgText, history: messages };
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

  const isEmpty = messages.length === 0 && !isStreaming;

  const locationTone =
    {
      granted: "safe",
      loading: "watch",
      denied: "danger",
      error: "danger",
      idle: "neutral",
      skipped: "neutral",
    }[locationStatus] || "neutral";

  const TONES: Record<string, { bg: string; border: string; fg: string }> = {
    neutral: {
      bg: Colors.sage100,
      border: Colors.sage200,
      fg: Colors.olive700,
    },
    safe: {
      bg: Colors.riskSafeBg,
      border: Colors.riskSafeBorder,
      fg: Colors.riskSafe,
    },
    watch: {
      bg: Colors.riskWatchBg,
      border: Colors.riskWatchBorder,
      fg: Colors.riskWatch,
    },
    danger: {
      bg: Colors.riskDangerBg,
      border: Colors.riskDangerBorder,
      fg: Colors.riskDanger,
    },
  };

  function locationPillStyle(): React.CSSProperties {
    const tone = locationTone;
    const t = TONES[tone] || TONES.neutral;
    const onDark = tone === "neutral";
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "6px 14px",
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 500,
      fontSize: 13,
      lineHeight: "1",
      color: onDark ? Colors.white : t.fg,
      background: onDark ? "rgba(255,255,255,0.10)" : t.bg,
      border: `1px solid ${onDark ? "rgba(255,255,255,0.18)" : t.border}`,
      borderRadius: 999,
      cursor: locationStatus === "loading" ? "default" : "pointer",
      whiteSpace: "nowrap",
      transition: "filter 130ms cubic-bezier(0.22,0.61,0.36,1)",
    };
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 64,
          flexShrink: 0,
          background: Colors.surfaceHeader,
          borderBottom: "1px solid rgba(0,0,0,0.12)",
        }}
      >
        <Logo tone="light" size="sm" wordmarkClassName="hide-mobile" />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Modo Teste toggle */}
          <button
            onClick={() => setTestMode((prev) => !prev)}
            aria-pressed={testMode}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "5px 7px 5px 14px",
              borderRadius: 999,
              cursor: "pointer",
              border: `1px solid ${
                testMode ? Colors.riskDangerBorder : "rgba(255,255,255,0.18)"
              }`,
              background: testMode
                ? Colors.riskDangerBg
                : "rgba(255,255,255,0.10)",
              color: testMode ? Colors.riskDanger : Colors.white,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 600,
              fontSize: 13,
              whiteSpace: "nowrap",
              transition: "filter 130ms cubic-bezier(0.22,0.61,0.36,1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(0.96)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            Modo Teste
            <Switch on={testMode} />
          </button>
          {/* Location pill */}
          <button
            onClick={fetchLocation}
            disabled={locationStatus === "loading"}
            style={locationPillStyle()}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(0.96)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            {locationLabel}
          </button>
        </div>
      </header>

      {/* ── Test mode active banner ── */}
      {testMode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 16px",
            backgroundColor: Colors.riskWatchBg,
            borderBottom: `1px solid ${Colors.riskWatchBorder}`,
            color: Colors.riskWatch,
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.35,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          <Icon name="alert-triangle" size={16} color={Colors.riskWatch} />
          <span>
            Modo teste ligado — as respostas simulam um cenário de risco ALTO,
            mesmo sem chuva real.
          </span>
        </div>
      )}

      {/* ── Location modal ── */}
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

      {/* ── Welcome state OR message thread ── */}
      {isEmpty ? (
        <ScrollView contentContainerStyle={styles.welcomeContent}>
          <View style={styles.welcomeInner}>
            <Logo tone="dark" showWordmark={false} size="lg" />
            <Text style={styles.headline}>Como posso te ajudar agora?</Text>
            <Text style={styles.subtitle}>
              Orientação em tempo real durante enchentes e alagamentos. Descreva
              sua situação ou escolha um ponto de partida.
            </Text>

            {/* ── Test mode hint banner ── */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "flex-start",
                gap: 8,
                marginTop: 2,
                padding: "10px 14px",
                background: Colors.riskWatchBg,
                border: `1px solid ${Colors.riskWatchBorder}`,
                borderRadius: 10,
                textAlign: "left",
                maxWidth: 480,
              }}
            >
              <span
                style={{ color: Colors.riskWatch, flexShrink: 0, marginTop: 1 }}
              >
                <Icon
                  name="alert-triangle"
                  size={15}
                  color={Colors.riskWatch}
                />
              </span>
              <span
                style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: Colors.riskWatch,
                }}
              >
                Só quer testar? Ligue o <strong>Modo Teste</strong> no topo para
                simular uma emergência, sem depender da chuva real.
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 14,
                width: "100%",
                maxWidth: 680,
                marginTop: 4,
              }}
            >
              {SUGGESTIONS.map((s, i) => (
                <SuggestionCard
                  key={i}
                  icon={s.icon}
                  title={s.title}
                  subtitle={s.subtitle}
                  onPress={() => handleSend(s.seed)}
                />
              ))}
            </div>
          </View>
        </ScrollView>
      ) : (
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamResponse={streamResponse}
        />
      )}

      {/* ── Composer ── */}
      <ChatInput
        value={message}
        onChange={setMessage}
        onSend={() => handleSend()}
        disabled={isStreaming}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%" as any,
    width: "100%",
    maxWidth: 800,
    marginHorizontal: "auto" as any,
    backgroundColor: Colors.surfaceApp,
    display: "flex" as any,
    flexDirection: "column",
    overflow: "visible" as any,
    position: "relative" as any,
  },
  welcomeContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  welcomeInner: {
    alignItems: "center",
    gap: 16,
    maxWidth: 720,
    width: "100%",
    backgroundColor: "transparent",
  },
  headline: {
    fontFamily: "Poppins",
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 40,
    color: Colors.textStrong,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 560,
  },
});
