import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  // Force black background for dark mode to prevent flashing
  const actualDarkColor = darkColor || "#000000";
  const backgroundColor = useThemeColor({ light: lightColor, dark: actualDarkColor }, "background");

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
