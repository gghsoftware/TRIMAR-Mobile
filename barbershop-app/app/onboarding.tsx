import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
  Linking,
  Alert,
  Modal,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get("window");
const AR_URL =
  process.env.EXPO_PUBLIC_AR_URL ||
  "https://trim-ar.vercel.app/";

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

/** Slides
 * - Local file: use require("../assets/hero.jpg")
 * - Remote URLs: pass a string; renderer supports both
 */
const SLIDES = [
  {
    key: "hero",
    title: "Style, Before You Style",
    sub: "Crystal-clear AR try-ons with true-to-shape face tracking.",
    // You can switch to a local asset any time:
    // image: require("../assets/hero.jpg"),
    image:
      "https://scontent.fmnl17-7.fna.fbcdn.net/v/t39.30808-6/557514374_1854179762159061_4695275994791126632_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeGUyi5m_idMRjlN5yqWTAxKmhVjCwQ2J_2aFWMLBDYn_f561I3j5nxuh_lXWZsUdUCvMzy2Q8vwGpo-oWRdSyXh&_nc_ohc=m0J6VfUmaXQQ7kNvwFtq48L&_nc_oc=Admsz-oB9A9nDowxkNSJxnCV1HW_WUWEn6X4kNs-QryYMYIVGbwB4s_j6MRXO3juGRg&_nc_zt=23&_nc_ht=scontent.fmnl17-7.fna&_nc_gid=1Td8tAw0EoYNWBnpVvOGjg&oh=00_AfZ_xij0EbpsaBpx2EZ_QqKH4e45b-99s2yc50W70pk02g&oe=68DF3EDA",
    chips: ["Live AR", "True Fit", "Before / After"],
    cta: { label: "Try AR now", action: "ar" },
  },
  {
    key: "book",
    title: "Book in 3 Taps",
    sub: "Pick a service, time, and your barber — done.",
    image: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?q=80&w=1600",
    chips: ["1-tap confirm", "Smart reminders", "Reschedule"],
    accent: "#06b6d4",
    cta: { label: "View services", action: "services" },
  },
  {
    key: "team",
    title: "Meet the Masters",
    sub: "Barbers with specialties, ratings, and portfolios.",
    image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1600",
    chips: ["Specialties", "Ratings", "Portfolio"],
    accent: "#22c55e",
    cta: { label: "See barbers", action: "barbers" },
  },
  {
    key: "privacy",
    title: "Private by Design",
    sub: "Your camera stays local. You control what's shared.",
    image: "https://images.unsplash.com/photo-1573167243872-43c6433b9d40?q=80&w=1600",
    chips: ["Local camera", "No uploads", "Granular control"],
    accent: "#f59e0b",
    cta: { label: "Learn more", action: "privacy" },
  },
];

/* Optional niceties */
async function haptic(type: "Light" | "Medium" | "Heavy" = "Medium") {
  try {
    const H = await import("expo-haptics");
    const style = type === "Light" ? H.ImpactFeedbackStyle.Light : 
                  type === "Medium" ? H.ImpactFeedbackStyle.Medium : 
                  H.ImpactFeedbackStyle.Heavy;
    await H.impactAsync(style);
  } catch {}
}
async function requestCameraPermission() {
  try {
    const { Camera } = await import("expo-camera");
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === "granted";
  } catch {
    Alert.alert(
      "Camera",
      "Permission API not available. Install expo-camera:\n\nnpx expo install expo-camera"
    );
    return false;
  }
}

/* AR Modal */
function ARModal({ visible, url, onClose }: { visible: boolean; url: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  if (!visible) return null;
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>AR Try-on</Text>
          <View style={styles.headerBtn} />
        </View>
        {loading && (
          <View style={styles.webLoader}>
            <ActivityIndicator size="large" />
            <Text style={{ color: "#e5e7eb", marginTop: 8 }}>Loading site…</Text>
            {Platform.OS === "web" && (
              <Text style={styles.webHint}>
                If it never loads, the website may block embedding (X-Frame-Options / frame-ancestors).
              </Text>
            )}
          </View>
        )}
        <WebView
          source={{ uri: url }}
          onLoadEnd={() => setLoading(false)}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          onError={(e) => Alert.alert("Website error", e?.nativeEvent?.description || "Failed to load")}
        />
      </View>
    </Modal>
  );
}

export default function Onboarding() {
  const listRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [arVisible, setArVisible] = useState(false);
  const [arUrl, setArUrl] = useState(AR_URL);

  // -------- RESPONSIVE LAYOUT CONSTANTS (prevents overlap) --------
  const COMPACT = H < 720; // small devices
  const SAFE_TOP_PAD = Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0;
  const BOTTOM_GUTTER = COMPACT ? 12 : 18;        // distance from bottom edge
  const ROW_H = COMPACT ? 48 : 56;                // approx button row height
  const DOTS_BOTTOM = BOTTOM_GUTTER + ROW_H + 14; // dots sit above bottom row
  const PROGRESS_BOTTOM = DOTS_BOTTOM + 18;       // progress sits above dots
  const FAB_BOTTOM = PROGRESS_BOTTOM + 34;        // FAB above progress
  const GLASS_BOTTOM = FAB_BOTTOM + 12;           // glass card above FAB

  // Button animations
  const nextScale = useRef(new Animated.Value(1)).current;
  const pressDown = (a: Animated.Value) =>
    Animated.spring(a, { toValue: 0.92, useNativeDriver: true, bounciness: 8, speed: 40 }).start();
  const pressUp = (a: Animated.Value) =>
    Animated.spring(a, { toValue: 1, useNativeDriver: true, bounciness: 8, speed: 40 }).start();

  const go = (i: number) => listRef.current?.scrollToIndex({ index: i, animated: true });

  const finish = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    router.replace("/");
  };
  const next = async () => {
    await haptic("Medium");
    if (index < SLIDES.length - 1) go(index + 1);
    else finish();
  };
  const onCta = async (action: string) => {
    await haptic("Light");
    if (action === "ar") {
      const ok = await requestCameraPermission();
      if (!ok && Platform.OS !== "web") return;
      setArUrl(AR_URL);
      setArVisible(true);
    } else if (action === "services") {
      router.push("/new");
    } else if (action === "barbers") {
      router.push("/");
    } else if (action === "privacy") {
      Linking.openURL("https://example.com/privacy");
    }
  };

  const progress = Animated.divide(scrollX, W * (SLIDES.length - 1 || 1));

  const renderItem = ({ item, index: i }: { item: any; index: number }) => {
    const tx = scrollX.interpolate({
      inputRange: [(i - 1) * W, i * W, (i + 1) * W],
      outputRange: [20, 0, -20], // smaller motion for small card
      extrapolate: "clamp",
    });
    const sc = scrollX.interpolate({
      inputRange: [(i - 1) * W, i * W, (i + 1) * W],
      outputRange: [1.02, 1, 1.02],
      extrapolate: "clamp",
    });
    const op = scrollX.interpolate({
      inputRange: [(i - 0.6) * W, i * W, (i + 0.6) * W],
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });
    const ty = scrollX.interpolate({
      inputRange: [(i - 1) * W, i * W, (i + 1) * W],
      outputRange: [10, 0, 10],
      extrapolate: "clamp",
    });

    // ✅ Support both local require(...) (number) and string URLs
    const bgSource = typeof item.image === "number" ? item.image : { uri: item.image };

    return (
      <View style={{ width: W, height: H }}>
        {/* Small hero image card */}
        <Animated.View
          style={[
            styles.heroBox,
            {
              transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }],
              opacity: op,
            },
          ]}
        >
          <AnimatedImageBackground
            source={bgSource}
            style={styles.heroInner}
            imageStyle={styles.heroImgSmall}
          >
            <View style={styles.heroShade} />
          </AnimatedImageBackground>
        </Animated.View>

        {/* Glass info card */}
        <Animated.View
          style={[
            styles.glassWrap,
            {
              bottom: GLASS_BOTTOM,
              opacity: op,
              transform: [{ translateY: ty }],
            },
          ]}
        >
          <View style={[styles.glass, { padding: COMPACT ? 14 : 18 }]}>
            <Text style={[styles.title, COMPACT && { fontSize: 24, lineHeight: 28 }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.sub, COMPACT && { fontSize: 13 }]} numberOfLines={2}>
              {item.sub}
            </Text>

            {!!item.chips?.length && (
              <View style={styles.chipsRow}>
                {item.chips.map((c: string, k: number) => (
                  <View key={k} style={styles.chip}>
                    <Text style={styles.chipText}>{c}</Text>
                  </View>
                ))}
              </View>
            )}

            {!!item.cta && (
              <TouchableOpacity
                style={[styles.inlineCta, { backgroundColor: item.accent || "#111827" }]}
                onPress={() => onCta(item.cta.action)}
              >
                <Text style={styles.inlineCtaText}>{item.cta.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: SAFE_TOP_PAD }]}>
      <StatusBar barStyle="light-content" />

      {/* Layer 0: background */}
      <View style={styles.container} />

      {/* Layer 1: Slides */}
      <Animated.FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        data={SLIDES}
        keyExtractor={(it) => it.key}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
        renderItem={renderItem}
        style={{ zIndex: 1 }}
      />

      {/* Layer 2: Top bar */}
      <View style={[styles.topBar, { paddingTop: 8, zIndex: 5 }]}>
        <Text style={styles.brand}>Trim AR</Text>
        <TouchableOpacity onPress={() => { haptic("Light"); finish(); }}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Layer 3: Progress + Dots */}
      <View style={[styles.progressTrack, { bottom: PROGRESS_BOTTOM, zIndex: 3 }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              transform: [
                {
                  scaleX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      <View style={[styles.dots, { bottom: DOTS_BOTTOM, zIndex: 3 }]}>
        {SLIDES.map((_, i) => {
          const o = scrollX.interpolate({
            inputRange: [(i - 1) * W, i * W, (i + 1) * W],
            outputRange: [0.45, 1, 0.45],
            extrapolate: "clamp",
          });
          const scale = scrollX.interpolate({
            inputRange: [(i - 1) * W, i * W, (i + 1) * W],
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: "clamp",
          });
          return (
            <TouchableOpacity key={i} onPress={() => go(i)}>
              <Animated.View style={[styles.dot, { opacity: o, transform: [{ scale }] }]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom row */}
      <View
        style={[
          styles.bottomRow,
          { bottom: BOTTOM_GUTTER, zIndex: 6, height: ROW_H, alignItems: "stretch" },
        ]}
      >
        <TouchableOpacity
          style={[styles.bottomBtn, styles.bottomGhost]}
          onPress={() => {
            haptic("Light");
            router.push("/login");
          }}
        >
          <Text style={[styles.bottomText, { color: "#0f172a" }]}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => {
            haptic("Medium");
            router.push("/register");
          }}
        >
          <Text style={styles.bottomText}>Create account</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Next */}
      <AnimatedTouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => pressDown(nextScale)}
        onPressOut={() => pressUp(nextScale)}
        onPress={next}
        style={[
          styles.fab,
          { bottom: FAB_BOTTOM, transform: [{ scale: nextScale }], zIndex: 4 },
        ]}
      >
        <Text style={styles.fabArrow}>➜</Text>
      </AnimatedTouchableOpacity>

      {/* AR modal */}
      <ARModal visible={arVisible} url={arUrl} onClose={() => setArVisible(false)} />
    </SafeAreaView>
  );
}

/* Styles */
const HERO_CARD_H = Math.max(180, Math.round(H * 0.38)); // small hero height

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0f1a" },
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0b0f1a" },

  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 64,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brand: { color: "#fff", fontWeight: "900", fontSize: 18, letterSpacing: 0.6 },
  skip: { color: "#ffffffcc", fontWeight: "700" },

  // Small hero card (instead of full-screen)
  heroBox: {
    position: "absolute",
    top: 76,
    left: 18,
    right: 18,
    height: HERO_CARD_H,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroInner: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  heroImgSmall: {
    resizeMode: "cover",
    borderRadius: 20,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  // (kept for reference, no longer used)
  hero: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroImg: { resizeMode: "cover" },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.0)" },

  glassWrap: { position: "absolute", left: 18, right: 18 },
  glass: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  title: { color: "#fff", fontSize: 28, fontWeight: "900", lineHeight: 32 },
  sub: { color: "#e5e7eb", marginTop: 6, fontSize: 14 },
  chipsRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  chipText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  inlineCta: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  inlineCtaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  progressTrack: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  progressFill: { 
    position: "absolute", 
    left: 0, 
    top: 0, 
    bottom: 0, 
    backgroundColor: "#fff", 
    borderRadius: 2,
    width: '100%',
  },
  dots: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { 
    height: 8, 
    width: 8,
    borderRadius: 4, 
    backgroundColor: "rgba(255,255,255,0.95)" 
  },

  bottomRow: { position: "absolute", left: 18, right: 18, flexDirection: "row", gap: 10 },
  bottomBtn: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  bottomText: { color: "#fff", fontWeight: "800" },

  fab: {
    position: "absolute",
    right: 18,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fabArrow: { color: "#fff", fontSize: 26, fontWeight: "900" },

  // Modal
  modalHeader: {
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: "#000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 8 },
  headerBtnText: { color: "#fff", fontWeight: "700" },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  webLoader: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    zIndex: 1,
  },
  webHint: { color: "#9ca3af", marginTop: 4, fontSize: 12, paddingHorizontal: 16, textAlign: "center" },
});
