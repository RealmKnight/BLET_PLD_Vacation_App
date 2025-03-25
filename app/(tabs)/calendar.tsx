import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from "react-native";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay } from "date-fns";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "@/components/calendar/Calendar";
import { RequestModal } from "@/components/calendar/RequestModal";
import { AppHeader } from "@/components/AppHeader";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Calculate the allowed date range
  const dateRanges = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      minAllowedDate: addDays(today, 2), // Min: current date + 2 days (48 hours)
      maxAllowedDate: addMonths(today, 6), // Max: current date + 6 months
    };
  }, []);

  // Check if selected date is eligible for requests
  const dateStatus = useMemo(() => {
    if (!selectedDate) return { isEligible: false, isTooEarly: false, isTooLate: false };

    const isTooEarly = isBefore(selectedDate, dateRanges.minAllowedDate);
    const isTooLate = isAfter(selectedDate, dateRanges.maxAllowedDate);
    const isEligible = !isTooEarly && !isTooLate;

    return { isEligible, isTooEarly, isTooLate };
  }, [selectedDate, dateRanges]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRequestPress = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSubmitRequest = (type: "PLD" | "SDV") => {
    // This will be implemented in the next phase
    console.log(`Submitting ${type} request for ${format(selectedDate!, "yyyy-MM-dd")}`);
    setIsModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <AppHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Image source={require("@/assets/images/BLETblackgold.png")} style={styles.logo} />
            <Text style={styles.title}>PLD/SDV Calendar</Text>
          </View>

          <View style={styles.calendarContainer}>
            <Calendar onSelectDate={handleDateSelect} />
          </View>

          {selectedDate && dateStatus.isEligible && (
            <TouchableOpacity style={styles.requestButton} onPress={handleRequestPress}>
              <Text style={styles.requestButtonText}>Request for {format(selectedDate, "MMM d, yyyy")}</Text>
            </TouchableOpacity>
          )}

          {selectedDate && !dateStatus.isEligible && (
            <View style={styles.ineligibleContainer}>
              <Text style={styles.ineligibleText}>
                {dateStatus.isTooEarly
                  ? "Requests must be made at least 48 hours in advance"
                  : "Requests can only be made up to 6 months in advance"}
              </Text>
            </View>
          )}

          <RequestModal
            visible={isModalVisible}
            date={selectedDate}
            onClose={handleCloseModal}
            onSubmit={handleSubmitRequest}
          />
        </ScrollView>
      </View>
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
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 100 : 80, // Increased top padding
    paddingBottom: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 16, // Added top margin to prevent logo cutoff
  },
  logo: {
    width: 160,
    height: 100,
    resizeMode: "contain",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#BAC42A",
    textAlign: "center",
  },
  calendarContainer: {
    backgroundColor: "#000000",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#333333",
    minHeight: 350, // Ensure calendar has sufficient height
  },
  requestButton: {
    marginTop: 16,
    backgroundColor: "#BAC42A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  requestButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  ineligibleContainer: {
    marginTop: 16,
    backgroundColor: "#111111",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333333",
  },
  ineligibleText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
