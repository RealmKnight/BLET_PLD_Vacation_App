import type { PropsWithChildren, ReactElement } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  Extrapolate,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";

const HEADER_HEIGHT = 250;

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerImage: React.ReactElement;
  headerBackgroundColor: {
    light: string;
    dark: string;
  };
  headerRight?: React.ReactNode;
}

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  headerRight,
}: ParallaxScrollViewProps) {
  const colorScheme = useColorScheme() ?? "light";
  const { height: windowHeight } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(windowHeight * 0.4);
  const bottom = useBottomTabOverflow();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
      transform: [
        {
          translateY: interpolate(scrollY.value, [0, headerHeight.value], [0, -headerHeight.value], Extrapolate.CLAMP),
        },
      ],
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, headerHeight.value],
            [0, -headerHeight.value * 0.5],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[styles.header, headerAnimatedStyle, { backgroundColor: headerBackgroundColor[colorScheme] }]}
      >
        <Animated.View style={[styles.headerImage, imageAnimatedStyle]}>{headerImage}</Animated.View>
        {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
      </Animated.View>
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom }}
      >
        <View style={[styles.content, { paddingTop: headerHeight.value }]}>{children}</View>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: "hidden",
  },
  headerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  headerRight: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 32,
    gap: 16,
    overflow: "hidden",
  },
});
