// app/index.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TextInput,
  Modal,
  BackHandler,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import api from "../lib/api";

const AR_URL =
  process.env.EXPO_PUBLIC_AR_URL ||
  "https://hairbook.gghsoftwaredev.com/dashboard#tryon";

const today = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);

  // Website modal visibility
  const [webVisible, setWebVisible] = useState(false);

  // Filters -> maps to backend (?phone=, ?date=)
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (phone.trim()) params.phone = phone.trim();
      if (date.trim()) params.date = date.trim(); // YYYY-MM-DD
      const res = await api.get("/bookings", { params });
      setBookings(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error("GET /bookings failed:", e?.message || e);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [phone, date]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const clearFilters = () => {
    setPhone("");
    setDate("");
    setTimeout(fetchBookings, 0);
  };

  const countText = useMemo(
    () => `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`,
    [bookings]
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text>{error}</Text>
        <TouchableOpacity
          style={[s.primaryBtn, { marginTop: 12 }]}
          onPress={fetchBookings}
        >
          <Text style={s.primaryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Top actions */}
      <View style={s.topRow}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => router.push("/new")}
          >
            <Text style={s.primaryBtnText}>+ New Booking</Text>
          </TouchableOpacity>

          {/* Try hairstyle → opens AR website in a modal (no URL bar) */}
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => setWebVisible(true)}
          >
            <Text style={s.secondaryBtnText}>Try hairstyle</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.countText}>{countText}</Text>
      </View>

      {/* Filters */}
      <View style={s.filters}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="09xxxxxxxxx"
            keyboardType="phone-pad"
            style={s.input}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder={today()}
            style={s.input}
          />
        </View>
      </View>

      <View style={s.filterButtons}>
        <TouchableOpacity
          style={[s.chipBtn, { backgroundColor: "#111827" }]}
          onPress={fetchBookings}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Apply</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.chipBtn, { backgroundColor: "#f3f4f6" }]}
          onPress={clearFilters}
        >
          <Text style={{ color: "#111827", fontWeight: "700" }}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={bookings}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchBookings} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => <BookingCard item={item} />}
        ListEmptyComponent={
          <Text
            style={{ opacity: 0.6, textAlign: "center", marginTop: 24 }}
          >
            No bookings found.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      {/* WEBSITE MODAL */}
      <WebsiteModal
        visible={webVisible}
        onClose={() => setWebVisible(false)}
        url={AR_URL}
      />
    </View>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { bg: "#fef3c7", fg: "#92400e", text: "Pending" },
    confirmed: { bg: "#dcfce7", fg: "#065f46", text: "Confirmed" },
    cancelled: { bg: "#ffe4e6", fg: "#9f1239", text: "Cancelled" },
  };
  const sdef = map[status] || { bg: "#e5e7eb", fg: "#374151", text: status || "—" };
  return (
    <View
      style={{
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: sdef.bg,
      }}
    >
      <Text style={{ color: sdef.fg, fontWeight: "700", fontSize: 12 }}>
        {sdef.text}
      </Text>
    </View>
  );
}

function BookingCard({ item }) {
  const customerName = item?.customerName ?? item?.name ?? "Customer";
  const phone = item?.phone ?? "";
  const service = item?.service ?? "";
  const stylist = item?.stylist ?? "";
  const date = item?.date ?? item?.appt_date ?? "";
  const time = item?.time ?? item?.appt_time ?? "";
  const price = item?.price;
  const status = item?.status ?? "pending";

  return (
    <View style={s.card}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={s.title} numberOfLines={1}>
          {customerName}
        </Text>
        <StatusBadge status={status} />
      </View>
      <Text style={s.muted} numberOfLines={1}>
        {phone}
      </Text>

      <View style={{ height: 6 }} />

      <Text style={s.meta} numberOfLines={1}>
        {service || "Service"}
        {stylist ? ` · ${stylist}` : ""}
      </Text>
      <Text style={s.meta}>
        {date || "YYYY-MM-DD"}
        {time ? ` at ${time}` : ""}
        {typeof price === "number" ? ` · ₱${price}` : ""}
      </Text>
    </View>
  );
}

/** Full-screen modal that embeds your AR website without showing the URL.
 * - Native (iOS/Android): react-native-webview
 * - Web (browser): <iframe> fallback
 */
function WebsiteModal({ visible, onClose, url }) {
  const isWeb = Platform.OS === "web";
  const webRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [frameLoaded, setFrameLoaded] = useState(false);

  // Android hardware back: go back in WebView if possible, else close
  useEffect(() => {
    if (isWeb) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!visible) return false;
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, canGoBack, onClose, isWeb]);

  if (!visible) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={s.modalRoot}>
        {/* Header (no visible URL) */}
        <View style={s.modalHeader}>
          <TouchableOpacity
            style={s.headerBtn}
            onPress={() => {
              if (!isWeb && canGoBack && webRef.current) webRef.current.goBack();
              else onClose();
            }}
          >
            <Text style={s.headerBtnText}>
              {!isWeb && canGoBack ? "Back" : "Close"}
            </Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>
            AR Try-on
          </Text>
          <View style={s.headerBtn} />
        </View>

        <View style={{ flex: 1 }}>
          {(loading || (isWeb && !frameLoaded)) && (
            <View style={s.webLoader}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 8 }}>Loading site…</Text>
              {isWeb && (
                <Text style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>
                  If this never loads, the website may block embedding (X-Frame-Options / frame-ancestors).
                </Text>
              )}
            </View>
          )}

          {/* Native path: WebView */}
          {!isWeb && (
            <WebView
              ref={webRef}
              source={{ uri: url }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              allowsBackForwardNavigationGestures
              setSupportMultipleWindows={false}
              onError={(e) =>
                Alert.alert(
                  "Website error",
                  e?.nativeEvent?.description || "Failed to load"
                )
              }
            />
          )}

          {/* Web path: <iframe> fallback */}
          {isWeb && (
            <div style={stylesWeb.iframeWrap}>
              <iframe
                title="AR"
                src={url}
                style={stylesWeb.iframe}
                allow="camera; microphone; gyroscope; accelerometer; xr-spatial-tracking; clipboard-read; clipboard-write"
                allowFullScreen
                onLoad={() => {
                  setFrameLoaded(true);
                  setLoading(false);
                }}
              />
            </div>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  countText: { fontWeight: "700", color: "#374151" },
  filters: { flexDirection: "row", marginBottom: 10 },
  filterButtons: { flexDirection: "row", gap: 8, marginBottom: 12 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  primaryBtn: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  secondaryBtnText: { color: "#111827", fontWeight: "700" },
  chipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  card: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
    borderRadius: 14,
  },
  title: { fontSize: 16, fontWeight: "800", color: "#0f172a", maxWidth: "70%" },
  muted: { marginTop: 4, color: "#6b7280" },
  meta: { color: "#374151" },

  // Modal
  modalRoot: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    height: 56,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 8 },
  headerBtnText: { color: "#111827", fontWeight: "700" },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
    textAlign: "center",
  },
  webLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    zIndex: 1,
  },
});

// Plain CSS objects for web-only elements
const stylesWeb = {
  iframeWrap: { position: "relative", width: "100%", height: "100%" },
  iframe: { border: "0", width: "100%", height: "100%" },
};
