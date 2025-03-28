import React, { useState } from "react";
import { StyleSheet, ScrollView, useWindowDimensions, Platform, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AppHeader } from "@/components/AppHeader";
import { AdminNavigation } from "@/components/AdminNavigation";
import { SDVEntitlementManager } from "@/components/admin/SDVEntitlementManager";

export default function DivisionDashboardScreen() {
  const { width } = useWindowDimensions();
  const { member } = useAuth();
  const isMobile = width < 768;
  const [activeTab, setActiveTab] = useState<"members" | "officers" | "leaves" | "calendar">("members");

  // All admin types can access this page
  if (!member?.role || !["division_admin", "union_admin", "application_admin"].includes(member.role)) {
    return <Redirect href="/(tabs)" />;
  }

  // Get the division ID from the member
  const divisionId = member.division || "";

  const renderContent = () => {
    switch (activeTab) {
      case "members":
        return (
          <View style={[styles.section, { backgroundColor: "#000000", flex: Platform.OS === "web" ? 0 : 1 }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Member Management
            </ThemedText>
            <SDVEntitlementManager divisionId={divisionId} />
          </View>
        );
      case "officers":
        return (
          <View style={[styles.section, { backgroundColor: "#000000" }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Division Officers
            </ThemedText>
            <View style={styles.placeholderContainer}>
              <ThemedText style={styles.placeholderText}>Officer management features coming soon</ThemedText>
            </View>
          </View>
        );
      case "leaves":
        return (
          <View style={[styles.section, { backgroundColor: "#000000" }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Leave Requests
            </ThemedText>
            <View style={styles.placeholderContainer}>
              <ThemedText style={styles.placeholderText}>Leave request management features coming soon</ThemedText>
            </View>
          </View>
        );
      case "calendar":
        return (
          <View style={[styles.section, { backgroundColor: "#000000" }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Division Calendar
            </ThemedText>
            <View style={styles.placeholderContainer}>
              <ThemedText style={styles.placeholderText}>Calendar management features coming soon</ThemedText>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === "members" && styles.activeTabButton]}
        onPress={() => setActiveTab("members")}
      >
        <ThemedText style={[styles.tabText, activeTab === "members" && styles.activeTabText]}>Members</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === "officers" && styles.activeTabButton]}
        onPress={() => setActiveTab("officers")}
      >
        <ThemedText style={[styles.tabText, activeTab === "officers" && styles.activeTabText]}>Officers</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === "leaves" && styles.activeTabButton]}
        onPress={() => setActiveTab("leaves")}
      >
        <ThemedText style={[styles.tabText, activeTab === "leaves" && styles.activeTabText]}>Leaves</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === "calendar" && styles.activeTabButton]}
        onPress={() => setActiveTab("calendar")}
      >
        <ThemedText style={[styles.tabText, activeTab === "calendar" && styles.activeTabText]}>Calendar</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={[styles.container, { backgroundColor: "#000000" }]}>
        <AppHeader />
        <AdminNavigation />
        {Platform.OS === "web" ? (
          <ScrollView
            style={[styles.scrollView, { backgroundColor: "#000000" }]}
            contentContainerStyle={[styles.scrollContent, { backgroundColor: "#000000" }]}
            showsVerticalScrollIndicator={false}
          >
            <ThemedView style={[styles.content, isMobile && styles.contentMobile, { backgroundColor: "#000000" }]}>
              <ThemedText type="title" style={styles.title}>
                Division Admin Dashboard
              </ThemedText>
              <ThemedText style={styles.text}>Manage division-specific settings and member configurations</ThemedText>
              {renderTabs()}
              {renderContent()}
            </ThemedView>
          </ScrollView>
        ) : (
          <View style={[styles.content, isMobile && styles.contentMobile, { backgroundColor: "#000000", flex: 1 }]}>
            {renderTabs()}
            {renderContent()}
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === "web" ? 0 : 16,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  contentMobile: {
    padding: 16,
  },
  title: {
    color: "#BAC42A",
    fontSize: 28,
    marginBottom: 8,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#BAC42A",
  },
  tabText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  activeTabText: {
    color: "#BAC42A",
    fontWeight: "600",
  },
  section: {
    marginBottom: Platform.OS === "web" ? 32 : 0,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    marginBottom: 16,
  },
  placeholderContainer: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  placeholderText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
});
