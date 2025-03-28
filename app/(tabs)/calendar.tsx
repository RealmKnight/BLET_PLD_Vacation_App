import React, { useState, useMemo, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from "react-native";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, parseISO } from "date-fns";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "@/components/calendar/Calendar";
import { RequestModal } from "@/components/calendar/RequestModal";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentMember } from "@/lib/supabase";
import { TextInput } from "react-native";
import { useMyTime } from "@/hooks/useMyTime";
import { useCalendarStore } from "@/store/calendarStore";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    // Initialize with noon to avoid timezone issues
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return today;
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dateInputValue, setDateInputValue] = useState<string>("");
  const { refresh: refreshTimeData } = useMyTime();
  const { userDivision, setUserDivision } = useCalendarStore();

  // Memoize loadUserData to prevent unnecessary recreations
  const loadUserData = useCallback(async () => {
    try {
      const member = await getCurrentMember();
      if (member?.division) {
        setUserDivision(member.division);
      }
    } catch (error) {
      console.error("Error fetching user division:", error);
    }
  }, [setUserDivision]);

  // Fetch the user's division when component mounts
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Calculate the allowed date range
  const dateRanges = useMemo(() => {
    const today = startOfDay(new Date());
    // Set time to noon to avoid timezone issues
    today.setHours(12, 0, 0, 0);

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

  // Memoize handlers
  const handleDateSelect = useCallback((date: Date) => {
    // Make sure to set the time to noon to avoid timezone issues
    date.setHours(12, 0, 0, 0);
    setSelectedDate(date);
  }, []);

  const handleRequestPress = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleSubmitRequest = useCallback(
    async (type: "PLD" | "SDV") => {
      setIsModalVisible(false);

      try {
        // Batch the async operations
        await Promise.all([
          new Promise((resolve) => setTimeout(resolve, 1000)), // Wait for DB trigger
          refreshTimeData(),
        ]);

        // Only update view date if we have a selected date
        if (selectedDate) {
          setCurrentViewDate(new Date(selectedDate));
        }
      } catch (error) {
        console.error("Error in handleSubmitRequest:", error);
      }
    },
    [selectedDate, refreshTimeData]
  );

  const handleJumpToDate = useCallback(() => {
    try {
      // Check if the input is a valid date format (yyyy-MM-dd)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInputValue)) {
        const newDate = parseISO(dateInputValue);

        // Set time to noon to avoid timezone issues
        newDate.setHours(12, 0, 0, 0);

        if (!isNaN(newDate.getTime())) {
          setCurrentViewDate(newDate);
          setSelectedDate(newDate);
          setDateInputValue("");
        }
      }
    } catch (error) {
      console.error("Invalid date format:", error);
    }
  }, [dateInputValue]);

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    // Set time to noon to avoid timezone issues
    today.setHours(12, 0, 0, 0);

    setCurrentViewDate(today);
    setSelectedDate(today);
  }, []);

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

          <View style={styles.calendarNavigation}>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
                value={dateInputValue}
                onChangeText={setDateInputValue}
                onSubmitEditing={handleJumpToDate}
              />
              <TouchableOpacity style={styles.jumpButton} onPress={handleJumpToDate}>
                <Text style={styles.jumpButtonText}>Jump to Date</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.todayButton} onPress={handleGoToToday}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <Calendar
              onSelectDate={handleDateSelect}
              currentViewDate={currentViewDate}
              onChangeViewDate={setCurrentViewDate}
            />
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
            division={userDivision || ""}
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
  calendarNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateInputContainer: {
    flex: 1,
    flexDirection: "row",
    marginRight: 8,
  },
  dateInput: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  jumpButton: {
    backgroundColor: "#333333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  jumpButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  todayButton: {
    backgroundColor: "#BAC42A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  todayButtonText: {
    color: "#000000",
    fontWeight: "600",
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
