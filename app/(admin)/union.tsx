import React from "react";
import { StyleSheet, ScrollView, useWindowDimensions, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AppHeader } from "@/components/AppHeader";
import { AdminNavigation } from "@/components/AdminNavigation";

export default function UnionDashboardScreen() {
  const { width } = useWindowDimensions();
  const { member } = useAuth();
  const isMobile = width < 768;

  // Only union or application admins can access this page
  if (!member?.role || !["union_admin", "application_admin"].includes(member.role)) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={[styles.container, { backgroundColor: "#000000" }]}>
        <AppHeader />
        <AdminNavigation />
        <ScrollView
          style={[styles.scrollView, { backgroundColor: "#000000" }]}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: "#000000" }]}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={[styles.content, isMobile && styles.contentMobile, { backgroundColor: "#000000" }]}>
            <ThemedText type="title" style={styles.title}>
              Union Admin Dashboard
            </ThemedText>
            <ThemedText style={styles.text}>Manage union-wide settings and division configurations</ThemedText>

            <View style={[styles.section, { backgroundColor: "#000000" }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Division Management
              </ThemedText>
              {/* Add division management components */}
            </View>

            <View style={[styles.section, { backgroundColor: "#000000" }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Union Officers
              </ThemedText>
              {/* Add officer management components */}
            </View>

            <View style={[styles.section, { backgroundColor: "#000000" }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Union Announcements
              </ThemedText>
              {/* Add announcement components */}
            </View>

            <View style={[styles.section, { backgroundColor: "#000000" }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Calendar Settings
              </ThemedText>
              {/* Add calendar management components */}
            </View>
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
    marginTop: 60,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    backgroundColor: "#000000",
  },
  content: {
    padding: 20,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    backgroundColor: "#000000",
  },
  contentMobile: {
    padding: 16,
    backgroundColor: "#000000",
  },
  title: {
    color: "#BAC42A",
    fontSize: 24,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
    backgroundColor: "#000000",
  },
  sectionTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 16,
  },
});
