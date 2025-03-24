import React from "react";
import { StyleSheet, ScrollView, useWindowDimensions, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AppHeader } from "@/components/AppHeader";
import { AuthHeader } from "@/components/AuthHeader";

export default function NotificationsScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <AppHeader />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={[styles.content, isMobile && styles.contentMobile]}>
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <AuthHeader />
              </View>
            </View>

            <ThemedText type="title" style={styles.title}>
              Notifications
            </ThemedText>
            {/* Add your notifications content here */}
            <ThemedText style={styles.text}>No new notifications</ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
    backgroundColor: "#000000",
  },
  content: {
    padding: 20,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    backgroundColor: "#000000",
  },
  contentMobile: {
    padding: 16,
    backgroundColor: "#000000",
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#000000",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#000000",
  },
  title: {
    color: "#BAC42A",
    fontSize: 24,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
  },
});
