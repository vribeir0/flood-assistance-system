import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { API_URL } from "@/services/api";
import { clearSession } from "@/helpers/session";
import Colors from "@/constants/Colors";
import { Logo } from "@/components/chat/Logo";

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SESSION_KEY = "captcha_verified";
const SESSION_TOKEN_KEY = "captcha_session_token";
const SESSION_CREATED_AT_KEY = "captcha_session_created_at";
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hora

function isSessionValid(): boolean {
  if (typeof localStorage === "undefined") return false;
  const createdAt = localStorage.getItem(SESSION_CREATED_AT_KEY);
  if (!createdAt) return false;
  return Date.now() - Number(createdAt) < SESSION_TTL_MS;
}

export default function CaptchaGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [verified, setVerified] = useState(false);
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const containerRef = useRef<any>(null);

  const startCaptcha = () => {
    setVerifyError(false);

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
              localStorage.setItem(SESSION_TOKEN_KEY, session_token);
              localStorage.setItem(SESSION_KEY, "true");
              localStorage.setItem(SESSION_CREATED_AT_KEY, String(Date.now()));
              setVerified(true);
            } catch {
              setVerifyError(true);
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
      (window as any).__onTurnstileLoad?.();
    }
  };

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (
      localStorage.getItem(SESSION_KEY) === "true" &&
      token &&
      isSessionValid()
    ) {
      fetch(`${API_URL}/validate-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setVerified(true);
          } else {
            clearSession();
            setReady(true);
          }
        })
        .catch(() => {
          clearSession();
          setReady(true);
        });
      return;
    }

    clearSession();
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !verified) {
      startCaptcha();
    }
  }, [ready]);

  if (!mounted) return null;
  if (verified) return <>{children}</>;

  if (!ready) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Logo tone="dark" size="md" showWordmark={false} />
        <Text style={styles.title}>Um momento...</Text>
        <Text style={styles.subtitle}>
          Só precisamos confirmar que você é uma pessoa real.
        </Text>
        {verifyError && (
          <Text style={styles.errorText}>
            A verificação falhou. Recarregue a página para tentar de novo.
          </Text>
        )}
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
    backgroundColor: Colors.surfaceApp,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 40,
    alignItems: "center",
    width: "90%",
    maxWidth: 420,
    gap: 12,
    boxShadow: "0 6px 18px rgba(67,83,52,0.10)" as any,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textStrong,
    textAlign: "center",
    fontFamily: "Poppins",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Plus Jakarta Sans",
    marginBottom: 8,
  },
  widget: {
    minHeight: 65,
    minWidth: 300,
  },
  errorText: {
    fontSize: 13,
    color: Colors.riskDanger,
    backgroundColor: Colors.riskDangerBg,
    borderWidth: 1,
    borderColor: Colors.riskDangerBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "center",
    fontFamily: "Plus Jakarta Sans",
    overflow: "hidden" as any,
  },
});
