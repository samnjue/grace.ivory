import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Animated,
} from "react-native";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { fetchVerseOfTheDay } from "../services/supabaseService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export default function VerseCard({ refreshKey }) {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigation = useNavigation();
  const theme = useSelector((state) => state.theme.theme);
  const styles = getStyle(theme);
  const isDarkTheme = theme.toLowerCase().includes("dark");

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const refreshVerse = async () => {
        try {
          const data = await fetchVerseOfTheDay();
          if (data) {
            setVerse(data);
            await AsyncStorage.setItem("verseOfTheDay", JSON.stringify(data));
          }
        } catch (err) {
          //console.log('Verse refresh failed:', err);
        }
      };

      refreshVerse();
    }, [])
  );

  useEffect(() => {
    const getVerse = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchVerseOfTheDay();
        if (data) {
          setVerse(data);
          await AsyncStorage.setItem("verseOfTheDay", JSON.stringify(data));
        } else {
          setError("No verse found");
        }
      } catch (err) {
        setError("Check your connection");
        const cachedVerse = await AsyncStorage.getItem("verseOfTheDay");
        if (cachedVerse) {
          setVerse(JSON.parse(cachedVerse));
        }
      } finally {
        setLoading(false);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 400,
            delay: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    getVerse();
  }, [refreshKey]);

  return (
    <View>
      {loading ? (
        <Animated.View style={[styles.shimmerWrapper, { opacity: fadeAnim }]}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            shimmerColors={
              isDarkTheme
                ? ["#202020", "#181818", "#202020"]
                : ["#e1e1e1", "#eeeeee", "#e1e1e1"]
            }
            style={styles.shimmerCard}
            autoRun={true}
          />
        </Animated.View>
      ) : error ? (
        <Animated.View>
          <Text style={styles.errorTitle} maxFontSizeMultiplier={1.2}>
            Verse of the Day
          </Text>
          <Text style={styles.errorText} maxFontSizeMultiplier={1.2}>
            {error}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View>
          <ImageBackground
            source={{ uri: verse?.backgroundImage }}
            style={styles.card}
            imageStyle={styles.image}
          >
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => navigation.navigate("VerseHistoryScreen")}
            >
              <Ionicons name="chevron-forward" size={22} color="white" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title} maxFontSizeMultiplier={1.2}>
                Verse of the Day
              </Text>
              <Text style={styles.reference} maxFontSizeMultiplier={1.2}>
                {verse?.reference}
              </Text>
              <Text style={styles.content} maxFontSizeMultiplier={1.2}>
                {verse?.verse_text}
              </Text>
            </View>
          </ImageBackground>
        </Animated.View>
      )}
    </View>
  );
}

const getStyle = (theme) => {
  const isDarkTheme = theme.toLowerCase().includes("dark");
  return {
    card: {
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 16,
      padding: 16,
      flexGrow: 1,
      minHeight: 200,
    },
    image: {
      borderRadius: 10,
      opacity: 0.8,
    },
    title: {
      fontSize: 16,
      fontWeight: "300",
      color: "#ffffff",
      marginBottom: 0,
      marginTop: 0,
    },
    reference: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
      marginBottom: 10,
      marginTop: 10,
    },
    content: {
      fontSize: 24,
      color: "white",
      fontWeight: "600",
      textAlign: "left",
      lineHeight: 29,
      marginTop: 5,
      fontFamily: "SourceSerif4_400Regular",
    },
    errorText: {
      color: isDarkTheme ? "#999" : "#555",
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 50,
    },
    errorCard: {
      borderRadius: 10,
      marginBottom: 16,
      padding: 16,
      backgroundColor: isDarkTheme ? "#2c2c2c" : "#ededed",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    errorTitle: {
      fontSize: 19,
      fontWeight: "300",
      marginBottom: 8,
      color: isDarkTheme ? "#fff" : "#000",
    },
    shimmerWrapper: {
      borderRadius: 10,
      marginBottom: 16,
      overflow: "hidden",
    },
    shimmerCard: {
      borderRadius: 10,
      minHeight: 200,
      backgroundColor: isDarkTheme ? "#1d1d1d" : "#eeeeee",
      height: 250,
      width: 380,
    },
    historyButton: {
      position: "absolute",
      top: 10,
      right: 10,
      backgroundColor: "rgba(0, 0, 0, 0.28)",
      borderRadius: 20,
      width: 35,
      height: 35,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
  };
};
