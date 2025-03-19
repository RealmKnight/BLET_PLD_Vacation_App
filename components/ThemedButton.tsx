import { TouchableOpacity, Text, TouchableOpacityProps, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ThemedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: any;
}

export function ThemedButton({ children, style, disabled, ...props }: ThemedButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? (isDark ? "#374151" : "#D1D5DB") : isDark ? "#3B82F6" : "#2563EB",
        },
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      <Text
        style={[
          styles.text,
          {
            color: disabled ? (isDark ? "#9CA3AF" : "#6B7280") : "#FFFFFF",
          },
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
