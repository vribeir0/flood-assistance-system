import { useRef } from "react";
import { View, StyleSheet, TextInput, Platform } from "react-native";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    if (Platform.OS !== "web") return;
    setTimeout(() => {
      (inputRef.current as unknown as HTMLElement)?.scrollIntoView?.({
        behavior: "smooth",
        block: "nearest",
      });
    }, 300);
  };

  return (
    <View style={styles.container}>
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
