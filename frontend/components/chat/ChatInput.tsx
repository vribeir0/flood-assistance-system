import { useRef, useEffect, useState } from "react";
import { View, StyleSheet, TextInput, Platform } from "react-native";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  return (
    <View
      ref={containerRef}
      style={[
        styles.container,
        keyboardHeight > 0 && { paddingBottom: Math.min(keyboardHeight, 80) },
      ]}
    >
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
        placeholderTextColor="gray"
        multiline={false}
      />
      <button
        onClick={onSend}
        disabled={disabled}
        style={{
          backgroundColor: disabled ? "#90CAF9" : "#1976D2",
          border: "none",
          borderRadius: 24,
          paddingTop: 11,
          paddingBottom: 11,
          paddingLeft: 20,
          paddingRight: 20,
          color: "white",
          fontWeight: "bold",
          fontSize: 15,
          cursor: disabled ? "default" : "pointer",
          fontFamily: "inherit",
          lineHeight: "inherit",
        }}
      >
        Enviar
      </button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "white",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    backgroundColor: "#fafafa",
    maxHeight: 80,
  },
});
