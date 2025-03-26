import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Calendar as RNCalendar, DateData } from "react-native-calendars";
import { format, addDays, addMonths, isBefore, isAfter, startOfDay, isEqual, isSameMonth } from "date-fns";
import { formatDateToYMD, normalizeDate, parseYMDDate } from "@/utils/date";
import { useCalendarStore } from "@/store/calendarStore";

interface CalendarProps {
  onSelectDate?: (date: Date) => void;
  currentViewDate?: Date;
  onChangeViewDate?: (date: Date) => void;
}

export function Calendar({ onSelectDate, currentViewDate, onChangeViewDate }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState(formatDateToYMD(currentViewDate || new Date()));
  const [markedDates, setMarkedDates] = useState<any>({});

  const {
    allotments,
    isLoading,
    error,
    userDivision,
    currentMonth: storeMonth,
    setCurrentMonth: setStoreMonth,
    fetchAllotments,
    initialize,
  } = useCalendarStore();

  // Initialize the store
  useEffect(() => {
    const cleanup = initialize();
    return () => cleanup();
  }, [initialize]);

  // Memoize the normalized current view date
  const normalizedCurrentViewDate = useMemo(() => {
    return normalizeDate(currentViewDate || new Date());
  }, [currentViewDate]);

  // Update store month when currentViewDate prop changes
  useEffect(() => {
    if (!isEqual(normalizedCurrentViewDate, storeMonth)) {
      setStoreMonth(normalizedCurrentViewDate);
    }
  }, [normalizedCurrentViewDate, storeMonth, setStoreMonth]);

  // Fetch allotments when month or division changes
  useEffect(() => {
    if (userDivision && storeMonth) {
      fetchAllotments(storeMonth, userDivision);
    }
  }, [storeMonth, userDivision, fetchAllotments]);

  // Calculate the minimum and maximum allowed request dates
  const dateRanges = useMemo(() => {
    const today = normalizeDate(new Date());
    return {
      minAllowedDate: normalizeDate(addDays(today, 2)),
      maxAllowedDate: normalizeDate(addMonths(today, 6)),
    };
  }, []);

  // Check if a date is eligible for requests (within allowed range)
  const isDateEligibleForRequest = useCallback(
    (date: Date) => {
      const normalized = normalizeDate(date);
      return !isBefore(normalized, dateRanges.minAllowedDate) && !isAfter(normalized, dateRanges.maxAllowedDate);
    },
    [dateRanges]
  );

  // Memoize the handleDateSelect callback
  const handleDateSelect = useCallback(
    (day: DateData) => {
      const dateStr = day.dateString;
      const selectedDateObj = normalizeDate(dateStr);

      if (isDateEligibleForRequest(selectedDateObj)) {
        setSelectedDate(dateStr);
        if (onSelectDate) {
          onSelectDate(selectedDateObj);
        }
      }
    },
    [isDateEligibleForRequest, onSelectDate]
  );

  // Memoize the handleMonthChange callback
  const handleMonthChange = useCallback(
    (monthData: DateData) => {
      const newDate = normalizeDate(new Date(monthData.year, monthData.month - 1, 1));
      setStoreMonth(newDate);
      if (onChangeViewDate) {
        onChangeViewDate(newDate);
      }
    },
    [setStoreMonth, onChangeViewDate]
  );

  // Update marked dates when allotments change
  useEffect(() => {
    if (isLoading || !storeMonth) return;

    const newMarkedDates: any = {};
    const firstDayOfMonth = normalizeDate(new Date(storeMonth.getFullYear(), storeMonth.getMonth(), 1));
    const lastDayOfMonth = normalizeDate(new Date(storeMonth.getFullYear(), storeMonth.getMonth() + 1, 0));

    const colors = {
      available: "#BAC42A",
      limited: "#F59E0B",
      full: "#EF4444",
      restricted: "#6B7280",
      unavailable: "#6B7280",
    };

    for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateToYMD(d);
      const allotment = allotments[dateStr];
      const isEligible = isDateEligibleForRequest(d);
      const isSelected = dateStr === selectedDate;

      let backgroundColor = colors.unavailable;
      let textColor = "#FFFFFF";
      let disabledDate = false;

      if (!isEligible) {
        backgroundColor = colors.restricted;
        disabledDate = true;
        textColor = "#CCCCCC";
      } else if (allotment && allotment.maxAllotment > 0) {
        if (allotment.availability === "available") {
          backgroundColor = colors.available;
          textColor = "#000000";
        } else if (allotment.availability === "limited") {
          backgroundColor = colors.limited;
          textColor = "#000000";
        } else if (allotment.availability === "full") {
          backgroundColor = colors.full;
        } else if (allotment.availability === "restricted") {
          backgroundColor = colors.restricted;
          disabledDate = true;
          textColor = "#CCCCCC";
        }
      }

      newMarkedDates[dateStr] = {
        selected: isSelected && !disabledDate,
        selectedColor: "#BAC42A",
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
  }, [allotments, isLoading, selectedDate, storeMonth, isDateEligibleForRequest]);

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
        current={format(storeMonth, "yyyy-MM-dd")}
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
