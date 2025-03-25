import React from "react";
import { Pressable, Text, View } from "react-native";
import { format, isSameMonth, isToday } from "date-fns";
import { DayAllotment } from "@/hooks/useCalendarAllotments";

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  dayAllotment?: DayAllotment;
  isSelected: boolean;
  onSelectDate: (date: Date) => void;
}

export function CalendarDay({ date, currentMonth, dayAllotment, isSelected, onSelectDate }: CalendarDayProps) {
  const inCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isToday(date);

  // Get availability color
  const getAvailabilityColor = () => {
    if (!inCurrentMonth || !dayAllotment) return "bg-gray-100";

    switch (dayAllotment.availability) {
      case "available":
        return "bg-green-100";
      case "limited":
        return "bg-yellow-100";
      case "full":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  // Get text color
  const getTextColor = () => {
    if (!inCurrentMonth) return "text-gray-400";
    if (isSelected) return "text-white";
    if (isCurrentDay) return "text-blue-600";
    return "text-gray-800";
  };

  return (
    <Pressable onPress={() => onSelectDate(date)} className="flex-1 aspect-square justify-center items-center">
      <View
        className={`
          w-10 h-10 rounded-full justify-center items-center
          ${getAvailabilityColor()}
          ${isSelected ? "bg-blue-500" : ""}
          ${isCurrentDay && !isSelected ? "border border-blue-600" : ""}
        `}
      >
        <Text className={`font-medium ${getTextColor()}`}>{format(date, "d")}</Text>
      </View>

      {dayAllotment && inCurrentMonth && (
        <View className="mt-1 flex-row items-center justify-center">
          <Text className="text-xs text-gray-600">
            {dayAllotment.currentRequests}/{dayAllotment.maxAllotment}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
