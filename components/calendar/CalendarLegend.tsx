import React from "react";
import { View, Text } from "react-native";

export function CalendarLegend() {
  return (
    <View className="flex-row justify-between items-center mt-4 px-4 py-2 bg-gray-50 rounded-lg">
      <View className="flex-row items-center">
        <View className="w-4 h-4 rounded-full bg-green-100 mr-2" />
        <Text className="text-xs text-gray-700">Available</Text>
      </View>

      <View className="flex-row items-center">
        <View className="w-4 h-4 rounded-full bg-yellow-100 mr-2" />
        <Text className="text-xs text-gray-700">Limited</Text>
      </View>

      <View className="flex-row items-center">
        <View className="w-4 h-4 rounded-full bg-red-100 mr-2" />
        <Text className="text-xs text-gray-700">Full</Text>
      </View>

      <View className="flex-row items-center">
        <View className="w-4 h-4 rounded-full bg-gray-100 mr-2" />
        <Text className="text-xs text-gray-700">No Allotment</Text>
      </View>
    </View>
  );
}
