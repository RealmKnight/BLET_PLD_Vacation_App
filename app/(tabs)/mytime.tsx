import React from "react";
import { StyleSheet, ScrollView, useWindowDimensions, Platform, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { AppHeader } from "@/components/AppHeader";
import { AuthHeader } from "@/components/AuthHeader";
import { TimeStats } from "@/components/my-time/TimeStats";
import { TimeOffRequestsList } from "@/components/my-time/TimeOffRequestsList";
import { useMyTime } from "@/hooks/useMyTime";

export default function MyTimeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { timeStats, timeOffRequests, isLoading, error, cancelRequest, requestPaidInLieu, refresh } = useMyTime();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <AppHeader />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#BAC42A" />}
        >
          <ThemedView style={[styles.content, isMobile && styles.contentMobile]}>
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Image source={require("@/assets/images/BLETblackgold.png")} style={styles.logo} contentFit="contain" />
              </View>
            </View>

            <ThemedText type="title" style={styles.title}>
              My Time
            </ThemedText>

            {error && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            )}

            {/* Time Statistics */}
            <TimeStats stats={timeStats} isLoading={isLoading} onRequestPaidInLieu={requestPaidInLieu} />

            {/* Time Off Requests */}
            <TimeOffRequestsList
              requests={timeOffRequests}
              onCancel={cancelRequest}
              onRequestPaidInLieu={requestPaidInLieu}
              isLoading={isLoading}
              showWaitlisted={false}
            />

            {/* Waitlisted Requests */}
            <TimeOffRequestsList
              requests={timeOffRequests}
              onCancel={cancelRequest}
              onRequestPaidInLieu={requestPaidInLieu}
              isLoading={isLoading}
              showWaitlisted={true}
            />
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
    paddingBottom: 40,
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
  logo: {
    width: 160,
    height: 100,
    marginBottom: 8,
  },
  title: {
    color: "#BAC42A",
    fontSize: 24,
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: "#FF000030",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FF0000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 14,
  },
});
