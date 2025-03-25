import { Stack } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect } from "react";

export default function AuthLayout() {
  const navigation = useNavigation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Monitor navigation state to show overlay during transitions
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", () => {
      setIsTransitioning(true);
    });

    const subscribeToFocus = navigation.addListener("focus", () => {
      // Delay hiding the overlay slightly to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    });

    return () => {
      unsubscribe();
      subscribeToFocus();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "fade",
          animationDuration: 150,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="index" redirect={true} />
      </Stack>

      {isTransitioning && (
        <View style={styles.overlay}>
          <ActivityIndicator size="small" color="#BAC42A" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
});
