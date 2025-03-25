import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Calendar as RNCalendar, DateData } from "react-native-calendars";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, isEqual } from "date-fns";

import { useCalendarAllotments } from "@/hooks/useCalendarAllotments";

interface CalendarProps {
  onSelectDate?: (date: Date) => void;
}

export function Calendar({ onSelectDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [markedDates, setMarkedDates] = useState<any>({});

  const { allotments, isLoading, error } = useCalendarAllotments(currentMonth);

  // Calculate the minimum and maximum allowed request dates
  const dateRanges = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      minAllowedDate: addDays(today, 2), // Min: current date + 2 days (48 hours)
      maxAllowedDate: addMonths(today, 6), // Max: current date + 6 months
    };
  }, []);

  // Check if a date is eligible for requests (within allowed range)
  const isDateEligibleForRequest = (date: Date) => {
    return !isBefore(date, dateRanges.minAllowedDate) && !isAfter(date, dateRanges.maxAllowedDate);
  };

  // Update marked dates when allotments change
  useEffect(() => {
    if (!isLoading && !error) {
      const newMarkedDates: any = {};
      const today = startOfDay(new Date());

      // Mark dates based on availability
      Object.entries(allotments).forEach(([dateStr, allotment]) => {
        const currentDate = new Date(dateStr);
        let dotColor = "#6B7280"; // gray (no allotment)
        let disabledDate = false;
        let textColor = undefined;

        // Check if date is outside allowed range (too early or too late)
        if (isBefore(currentDate, dateRanges.minAllowedDate)) {
          // Past dates or within 48 hours
          dotColor = "#6B7280"; // gray
          disabledDate = true;
          textColor = "#666666"; // dimmed text for unavailable dates
        } else if (isAfter(currentDate, dateRanges.maxAllowedDate)) {
          // More than 6 months in the future
          dotColor = "#6B7280"; // gray
          disabledDate = true;
          textColor = "#666666"; // dimmed text for unavailable dates
        } else if (allotment.maxAllotment > 0) {
          if (allotment.availability === "available") {
            dotColor = "#BAC42A"; // green (using brand color)
          } else if (allotment.availability === "limited") {
            dotColor = "#F59E0B"; // amber
          } else if (allotment.availability === "full") {
            dotColor = "#EF4444"; // red
          }
        }

        newMarkedDates[dateStr] = {
          marked: true,
          dotColor: dotColor,
          selected: dateStr === selectedDate && !disabledDate,
          selectedColor: "#BAC42A", // brand green
          allotment: allotment,
          disabled: disabledDate,
          disableTouchEvent: disabledDate,
          textColor: textColor,
        };
      });

      // Ensure selected date is always marked (if eligible)
      if (selectedDate && !newMarkedDates[selectedDate]) {
        const selectedDateObj = new Date(selectedDate);
        const isEligible = isDateEligibleForRequest(selectedDateObj);

        newMarkedDates[selectedDate] = {
          selected: isEligible,
          selectedColor: "#BAC42A", // brand green
          disabled: !isEligible,
          disableTouchEvent: !isEligible,
          textColor: !isEligible ? "#666666" : undefined,
        };
      }

      setMarkedDates(newMarkedDates);
    }
  }, [allotments, isLoading, error, selectedDate, dateRanges]);

  const handleDateSelect = (day: DateData) => {
    const dateStr = day.dateString;
    const selectedDateObj = new Date(dateStr);

    // Only allow selection of eligible dates
    if (isDateEligibleForRequest(selectedDateObj)) {
      setSelectedDate(dateStr);

      // Pass the selected date to parent
      if (onSelectDate) {
        onSelectDate(selectedDateObj);
      }
    }
  };

  const handleMonthChange = (month: DateData) => {
    const newMonth = new Date(month.year, month.month - 1, 1);
    setCurrentMonth(newMonth);
  };

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: "#BAC42A" }]} />
        <Text style={styles.legendText}>Available</Text>
      </View>

      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
        <Text style={styles.legendText}>Limited</Text>
      </View>

      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
        <Text style={styles.legendText}>Full</Text>
      </View>

      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: "#6B7280" }]} />
        <Text style={styles.legendText}>Unavailable</Text>
      </View>
    </View>
  );

  const renderSelectedDate = () => {
    if (!selectedDate || !allotments[selectedDate]) {
      return null;
    }

    const allotment = allotments[selectedDate];
    const selectedDateObj = new Date(selectedDate);
    const isEligible = isDateEligibleForRequest(selectedDateObj);
    const isTooEarly = isBefore(selectedDateObj, dateRanges.minAllowedDate);
    const isTooLate = isAfter(selectedDateObj, dateRanges.maxAllowedDate);

    return (
      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateTitle}>{format(selectedDateObj, "EEEE, MMMM d, yyyy")}</Text>

        <View style={styles.allotmentInfo}>
          {!isEligible ? (
            <Text style={styles.errorText}>
              {isTooEarly
                ? "Requests must be made at least 48 hours in advance"
                : "Requests can only be made up to 6 months in advance"}
            </Text>
          ) : (
            <>
              <Text style={styles.allotmentText}>Availability: {allotment.availability}</Text>
              <Text style={styles.allotmentText}>
                Requests: {allotment.currentRequests} / {allotment.maxAllotment}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BAC42A" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Get the min and max date strings for the calendar
  const minDateStr = format(new Date(), "yyyy-MM-dd");
  const maxDateStr = format(dateRanges.maxAllowedDate, "yyyy-MM-dd");

  return (
    <View style={styles.container}>
      <RNCalendar
        onDayPress={handleDateSelect}
        onMonthChange={handleMonthChange}
        markedDates={markedDates}
        markingType="dot"
        maxDate={maxDateStr}
        theme={{
          backgroundColor: "#000000",
          calendarBackground: "#000000",
          textSectionTitleColor: "#9CA3AF",
          selectedDayBackgroundColor: "#BAC42A",
          selectedDayTextColor: "#000000",
          todayTextColor: "#BAC42A",
          dayTextColor: "#FFFFFF",
          textDisabledColor: "#4B5563",
          dotColor: "#BAC42A",
          selectedDotColor: "#000000",
          arrowColor: "#BAC42A",
          monthTextColor: "#FFFFFF",
          indicatorColor: "#BAC42A",
          textDayFontWeight: "400",
          textMonthFontWeight: "600",
          textDayHeaderFontWeight: "500",
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
      />

      {renderLegend()}
      {renderSelectedDate()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#000000",
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#111111",
    borderRadius: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  selectedDateContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#111111",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  allotmentInfo: {
    marginTop: 8,
  },
  allotmentText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 4,
  },
});
