import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function ProfileLayout() {
  const { member } = useAuth();
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

  // Redirect if no member
  if (!member) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "fade",
          animationDuration: 150,
          presentation: "transparentModal",
        }}
      >
        <Stack.Screen name="index" />
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
