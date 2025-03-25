import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function CalendarLegend() {
  return (
    <View style={styles.container}>
      <View style={styles.legendItem}>
        <View style={[styles.colorDot, { backgroundColor: "#BAC42A" }]} />
        <Text style={styles.legendText}>Available</Text>
      </View>

      <View style={styles.legendItem}>
        <View style={[styles.colorDot, { backgroundColor: "#F59E0B" }]} />
        <Text style={styles.legendText}>Limited</Text>
      </View>

      <View style={styles.legendItem}>
        <View style={[styles.colorDot, { backgroundColor: "#EF4444" }]} />
        <Text style={styles.legendText}>Full</Text>
      </View>

      <View style={styles.legendItem}>
        <View style={[styles.colorDot, { backgroundColor: "#6B7280" }]} />
        <Text style={styles.legendText}>Restricted</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#111111",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
});
