import { useRef, useEffect, useState } from "react";
import { View, StyleSheet, TextInput, Platform } from "react-native";
import Colors from "@/constants/Colors";
import { Icon } from "./Icon";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const viewport = (window as any).visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeightEstimate = Math.max(0, windowHeight - viewportHeight);
      setKeyboardHeight(keyboardHeightEstimate);

      const inputElement = inputRef.current as unknown as HTMLElement;
      if (inputElement && keyboardHeightEstimate > 50) {
        inputElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  const handleFocus = () => {
    if (Platform.OS !== "web") return;
    const inputElement = inputRef.current as unknown as HTMLElement;
    setTimeout(() => {
      inputElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <View
      ref={containerRef}
      style={[
        styles.container,
        keyboardHeight > 0 && { paddingBottom: Math.min(keyboardHeight, 80) },
      ]}
    >
      <View style={styles.composerPill}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSend}
          onFocus={handleFocus}
          editable={!disabled}
          returnKeyType="send"
          placeholder="Digite sua mensagem..."
          placeholderTextColor={Colors.textSubtle}
          multiline={false}
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          aria-label="Enviar"
          title="Enviar"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 999,
            border: `1px solid ${canSend ? Colors.brand : Colors.sage300}`,
            backgroundColor: canSend ? Colors.brand : Colors.sage300,
            color: Colors.white,
            cursor: canSend ? "pointer" : "not-allowed",
            opacity: canSend ? 1 : 0.5,
            transition:
              "filter 130ms cubic-bezier(0.22,0.61,0.36,1), transform 130ms cubic-bezier(0.22,0.61,0.36,1)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (canSend) e.currentTarget.style.filter = "brightness(0.92)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
          onMouseDown={(e) => {
            if (canSend) e.currentTarget.style.transform = "scale(0.92)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Icon name="send" size={18} color={Colors.white} />
        </button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceApp,
    flexShrink: 0,
  },
  composerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: 999,
    boxShadow: "0 1px 2px rgba(67,83,52,0.06)" as any,
    maxWidth: 720,
    width: "100%",
    marginHorizontal: "auto" as any,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: "Plus Jakarta Sans",
    color: Colors.textBody,
    outlineStyle: "none" as any,
  },
});
