import { Text, View } from "@/components/Themed";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet } from "react-native";

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SESSION_KEY = "captcha_verified";

export default function CaptchaGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [verified, setVerified] = useState(false);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setVerified(true);
      return;
    }

    setReady(true);

    // Callback global chamado pelo Turnstile ao concluir o desafio
    (window as any).__turnstileSuccess = () => {
      sessionStorage.setItem(SESSION_KEY, "true");
      setVerified(true);
    };

    // Callback global chamado quando o script do Turnstile termina de carregar
    (window as any).__onTurnstileLoad = () => {
      const el = document.getElementById("turnstile-container");
      if (el && (window as any).turnstile) {
        (window as any).turnstile.render(el, {
          sitekey: SITE_KEY,
          callback: "__turnstileSuccess",
          theme: "light",
          language: "pt-BR",
        });
      }
    };

    if (!document.getElementById("cf-turnstile-script")) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__onTurnstileLoad";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      // Script já carregado — renderiza imediatamente
      (window as any).__onTurnstileLoad?.();
    }
  }, []);

  if (verified) return <>{children}</>;

  if (!ready) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Verificação de Segurança</Text>
        <Text style={styles.subtitle}>
          Complete o desafio abaixo para acessar o sistema
        </Text>
        {/* nativeID mapeia para id no DOM em Expo Web */}
        <View
          ref={containerRef}
          nativeID="turnstile-container"
          style={styles.widget}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    width: "90%",
    maxWidth: 420,
    // @ts-ignore — shadow funciona em web
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  widget: {
    minHeight: 65,
    minWidth: 300,
  },
});
