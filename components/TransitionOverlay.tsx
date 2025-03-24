import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";

export function TransitionOverlay() {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="small" color="#BAC42A" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
});
