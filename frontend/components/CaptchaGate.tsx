import { Text, View } from "@/components/Themed";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet } from "react-native";
import { API_URL } from "@/services/api";

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SESSION_KEY = "captcha_verified";
const SESSION_TOKEN_KEY = "captcha_session_token";

export default function CaptchaGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [verified, setVerified] = useState(false);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<View>(null);

  useEffect(() => {
    setMounted(true);

    // Só reutiliza a sessão se ainda existir um token válido
    if (
      sessionStorage.getItem(SESSION_KEY) === "true" &&
      sessionStorage.getItem(SESSION_TOKEN_KEY)
    ) {
      setVerified(true);
      return;
    }

    // Garante estado limpo caso o token tenha expirado
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setReady(true);

    (window as any).__onTurnstileLoad = () => {
      const el = document.getElementById("turnstile-container");
      if (el && (window as any).turnstile) {
        (window as any).turnstile.render(el, {
          sitekey: SITE_KEY,
          callback: async (cfToken: string) => {
            try {
              const res = await fetch(`${API_URL}/verify-captcha`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: cfToken }),
              });
              if (!res.ok) throw new Error("Verificação falhou");
              const { session_token } = await res.json();
              sessionStorage.setItem(SESSION_TOKEN_KEY, session_token);
              sessionStorage.setItem(SESSION_KEY, "true");
              setVerified(true);
            } catch {
              // Re-renderiza o widget para nova tentativa
              (window as any).turnstile?.reset();
            }
          },
          theme: "light",
          language: "pt-br",
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

  // Antes de montar no cliente, não renderiza nada
  if (!mounted) return null;

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
