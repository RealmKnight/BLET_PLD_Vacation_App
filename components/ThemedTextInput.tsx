import { TextInput, TextInputProps, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ThemedTextInputProps extends TextInputProps {
  style?: any;
}

export function ThemedTextInput({ style, ...props }: ThemedTextInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
          color: isDark ? "#F9FAFB" : "#111827",
        },
        style,
      ]}
      placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
});
