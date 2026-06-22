import Colors from "@/constants/Colors";
import { Icon, IconName } from "./Icon";

type Props = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
};

export function SuggestionCard({ title, subtitle, icon, onPress }: Props) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 5,
        textAlign: "left",
        width: "100%",
        padding: "16px 20px",
        background: Colors.surfaceCard,
        border: `1px solid ${Colors.borderSoft}`,
        borderRadius: 10,
        cursor: "pointer",
        transition:
          "transform 220ms cubic-bezier(0.22,0.61,0.36,1), box-shadow 220ms cubic-bezier(0.22,0.61,0.36,1), border-color 220ms cubic-bezier(0.22,0.61,0.36,1)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 6px 18px rgba(67,83,52,0.10)";
        el.style.borderColor = Colors.borderStrong;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "none";
        el.style.borderColor = Colors.borderSoft;
      }}
    >
      <span
        style={{
          display: "inline-flex",
          color: Colors.accent,
          marginBottom: 2,
        }}
      >
        <Icon name={icon} size={18} color={Colors.accent} />
      </span>
      <span
        style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1.25,
          color: Colors.textStrong,
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 400,
          fontSize: 12,
          lineHeight: 1.35,
          color: Colors.textMuted,
        }}
      >
        {subtitle}
      </span>
    </button>
  );
}
