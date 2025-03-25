import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { TimeStats as TimeStatsType } from "@/hooks/useMyTime";

interface TimeStatsProps {
  stats: TimeStatsType;
  isLoading: boolean;
}

export function TimeStats({ stats, isLoading }: TimeStatsProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading time statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.firstColumn} />
        <View style={styles.column}>
          <Text style={styles.headerText}>PLD</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.headerText}>SDV</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Total</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.total.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.total.sdv}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Available</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.available.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.available.sdv}</Text>
        </View>
        <TouchableOpacity style={styles.iconContainer}>
          <Feather name="calendar" size={20} color="#BAC42A" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Requested</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.requested.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.requested.sdv}</Text>
        </View>
        <TouchableOpacity style={styles.iconContainer}>
          <Feather name="calendar" size={20} color="#BAC42A" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Waitlisted</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.waitlisted.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.waitlisted.sdv}</Text>
        </View>
        <TouchableOpacity style={styles.iconContainer}>
          <Feather name="calendar" size={20} color="#BAC42A" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Approved</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.approved.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.approved.sdv}</Text>
        </View>
        <TouchableOpacity style={styles.iconContainer}>
          <Feather name="calendar" size={20} color="#BAC42A" />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.firstColumn}>
          <Text style={styles.rowTitle}>Paid in Lieu</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.paidInLieu.pld}</Text>
        </View>
        <View style={styles.column}>
          <Text style={styles.value}>{stats.paidInLieu.sdv}</Text>
        </View>
        <TouchableOpacity style={styles.iconContainer}>
          <Feather name="calendar" size={20} color="#BAC42A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111111",
    borderRadius: 12,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333333",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    backgroundColor: "#1F1F1F",
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  firstColumn: {
    flex: 2,
    paddingLeft: 16,
    justifyContent: "center",
  },
  column: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#BAC42A",
  },
  rowTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  iconContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    backgroundColor: "#111111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingText: {
    color: "#FFFFFF",
    opacity: 0.7,
  },
});
