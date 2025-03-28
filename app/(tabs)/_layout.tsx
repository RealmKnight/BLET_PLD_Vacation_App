import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { Platform, View, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
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
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
            },
            default: {
              backgroundColor: "#000000",
            },
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            tabBarIcon: ({ color }) => <Ionicons size={28} name="notifications-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color }) => <Ionicons size={28} name="calendar-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="mytime"
          options={{
            title: "My Time",
            tabBarIcon: ({ color }) => <Ionicons size={28} name="time-outline" color={color} />,
          }}
        />
      </Tabs>

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
