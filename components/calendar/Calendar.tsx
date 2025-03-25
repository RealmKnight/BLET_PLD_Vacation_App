import React, { useState, useEffect, useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Calendar as RNCalendar, DateData } from "react-native-calendars";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, isEqual, isSameMonth } from "date-fns";
import { useCalendarAllotments } from "@/hooks/useCalendarAllotments";
import { formatDateToYMD, normalizeDate, parseYMDDate } from "@/utils/date";

interface CalendarProps {
  onSelectDate?: (date: Date) => void;
  currentViewDate?: Date;
  onChangeViewDate?: (date: Date) => void;
}

export function Calendar({ onSelectDate, currentViewDate, onChangeViewDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(normalizeDate(currentViewDate || new Date()));
  const [selectedDate, setSelectedDate] = useState(formatDateToYMD(currentViewDate || new Date()));
  const [markedDates, setMarkedDates] = useState<any>({});

  const { allotments, isLoading, error, refresh } = useCalendarAllotments(currentMonth);

  // Update internal state when currentViewDate prop changes
  useEffect(() => {
    if (currentViewDate) {
      const normalized = normalizeDate(currentViewDate);
      setCurrentMonth(normalized);
      // Only update selected date if it's a new date (to prevent overriding user selections)
      if (!isSameMonth(normalized, currentMonth)) {
        setSelectedDate(formatDateToYMD(normalized));
      }
      // Refresh allotments when view date changes
      refresh();
    }
  }, [currentViewDate]);

  // Calculate the minimum and maximum allowed request dates
  const dateRanges = useMemo(() => {
    const today = normalizeDate(new Date());
    return {
      minAllowedDate: normalizeDate(addDays(today, 2)), // Min: current date + 2 days (48 hours)
      maxAllowedDate: normalizeDate(addMonths(today, 6)), // Max: current date + 6 months
    };
  }, []);

  // Check if a date is eligible for requests (within allowed range)
  const isDateEligibleForRequest = (date: Date) => {
    const normalized = normalizeDate(date);
    return !isBefore(normalized, dateRanges.minAllowedDate) && !isAfter(normalized, dateRanges.maxAllowedDate);
  };

  // Update marked dates when allotments change
  useEffect(() => {
    if (!isLoading && !error) {
      const newMarkedDates: any = {};
      const today = normalizeDate(new Date());

      // Get all dates for the current month display
      const firstDayOfMonth = normalizeDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
      const lastDayOfMonth = normalizeDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

      // Colors for different states (using our brand colors)
      const colors = {
        available: "#BAC42A", // green
        limited: "#F59E0B", // amber/orange
        full: "#EF4444", // red
        restricted: "#6B7280", // gray
        unavailable: "#6B7280", // gray
      };

      // Mark all days in the visible month range
      for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDateToYMD(d);
        const allotment = allotments[dateStr];
        const isEligible = isDateEligibleForRequest(d);
        const isSelected = dateStr === selectedDate;

        let backgroundColor = colors.unavailable;
        let textColor = "#FFFFFF"; // Default text color is white
        let disabledDate = false;

        // Check if date is outside allowed range (too early or too late)
        if (!isEligible) {
          backgroundColor = colors.restricted;
          disabledDate = true;
          textColor = "#CCCCCC"; // Light gray text for unavailable dates
        } else if (allotment && allotment.maxAllotment > 0) {
          if (allotment.availability === "available") {
            backgroundColor = colors.available;
            textColor = "#000000"; // Black text on green background for better contrast
          } else if (allotment.availability === "limited") {
            backgroundColor = colors.limited;
            textColor = "#000000"; // Black text on orange background for better contrast
          } else if (allotment.availability === "full") {
            backgroundColor = colors.full;
          } else if (allotment.availability === "restricted") {
            backgroundColor = colors.restricted;
            disabledDate = true;
            textColor = "#CCCCCC"; // Light gray text for restricted dates
          }
        }

        newMarkedDates[dateStr] = {
          selected: isSelected && !disabledDate,
          selectedColor: "#BAC42A", // brand green for selection
          customStyles: {
            container: {
              backgroundColor: isSelected && !disabledDate ? "#BAC42A" : backgroundColor,
              borderRadius: 16,
            },
            text: {
              color: isSelected && !disabledDate ? "#000000" : textColor,
              fontWeight: isSelected ? "bold" : "normal",
            },
          },
          disabled: disabledDate,
          disableTouchEvent: disabledDate,
          allotment: allotment,
        };
      }

      setMarkedDates(newMarkedDates);
    }
  }, [allotments, isLoading, error, selectedDate, dateRanges, currentMonth]);

  const handleDateSelect = (day: DateData) => {
    const dateStr = day.dateString;
    const selectedDateObj = normalizeDate(dateStr);

    // Only allow selection of eligible dates
    if (isDateEligibleForRequest(selectedDateObj)) {
      setSelectedDate(dateStr);

      // Pass the selected date to parent
      if (onSelectDate) {
        onSelectDate(selectedDateObj);
      }
    }
  };

  const handleMonthChange = (monthData: DateData) => {
    // Create a new Date object for the first day of the selected month
    const newDate = normalizeDate(new Date(monthData.year, monthData.month - 1, 1));

    setCurrentMonth(newDate);

    // Notify parent component about the month change
    if (onChangeViewDate) {
      onChangeViewDate(newDate);
    }
  };

  const renderSelectedDate = () => {
    if (!selectedDate || !allotments[selectedDate]) {
      return null;
    }

    const allotment = allotments[selectedDate];
    const selectedDateObj = parseYMDDate(selectedDate);
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
  const minDateStr = formatDateToYMD(new Date());
  const maxDateStr = formatDateToYMD(dateRanges.maxAllowedDate);

  return (
    <View style={styles.container}>
      <RNCalendar
        current={format(currentMonth, "yyyy-MM-dd")}
        minDate={minDateStr}
        maxDate={maxDateStr}
        onDayPress={handleDateSelect}
        onMonthChange={handleMonthChange}
        markingType="custom"
        markedDates={markedDates}
        theme={{
          backgroundColor: "#000000",
          calendarBackground: "#000000",
          textSectionTitleColor: "#FFFFFF",
          selectedDayBackgroundColor: "#BAC42A",
          selectedDayTextColor: "#000000",
          todayTextColor: "#BAC42A",
          dayTextColor: "#FFFFFF",
          textDisabledColor: "#666666",
          monthTextColor: "#FFFFFF",
          arrowColor: "#BAC42A",
        }}
      />

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
