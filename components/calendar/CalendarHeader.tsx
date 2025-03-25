import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { format, addMonths, subMonths } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

interface CalendarHeaderProps {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}

export function CalendarHeader({ currentMonth, onMonthChange }: CalendarHeaderProps) {
  const prevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  return (
    <View className="flex-row justify-between items-center mb-4 px-2">
      <TouchableOpacity onPress={prevMonth} className="p-2 rounded-full bg-gray-100">
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
      </TouchableOpacity>

      <Text className="text-xl font-semibold text-gray-800">{format(currentMonth, "MMMM yyyy")}</Text>

      <TouchableOpacity onPress={nextMonth} className="p-2 rounded-full bg-gray-100">
        <Ionicons name="chevron-forward" size={24} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
}
