import { useState, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, FlatList,
  SafeAreaView
} from "react-native";
import { router } from "expo-router";
import api from "../lib/api";

const today = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

// Optional quick choices (edit for your shop)
const SERVICE_OPTIONS = ["Haircut", "Shave", "Haircut + Shave", "Color"];
const STYLIST_OPTIONS = ["Jay", "Ali", "Ken"];

// 09:00–18:00 in 30-min steps
const TIMES = Array.from({ length: (18 - 9) * 2 + 1 }, (_, i) => {
  const mins = 9 * 60 + i * 30;
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
});

export default function NewBooking() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [stylist, setStylist] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("09:00");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => !!(customerName.trim() && phone.trim() && date.trim() && time.trim()),
    [customerName, phone, date, time]
  );

  const submit = async () => {
    if (!canSubmit) {
      Alert.alert("Missing info", "Please fill name, phone, date and time.");
      return;
    }
    const payload = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      service: service.trim() || null,
      stylist: stylist.trim() || null,
      date: date.trim(),
      time: time.trim(),
      price: price.trim() ? Number(price) : null,
      notes: notes.trim() || null,
    };
    if (payload.price !== null && Number.isNaN(payload.price)) {
      Alert.alert("Invalid price", "Price must be a number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/bookings", payload);
      router.replace({ pathname: "/success", params: { booking: JSON.stringify(res.data || {}) } });
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.error || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {/* Top header */}
        <View style={hdr.wrap}>
          <Text style={hdr.title}>New booking</Text>
          <Text style={hdr.subtitle}>Create and confirm a client appointment</Text>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer card */}
          <Section title="Customer">
            <Field label="Customer name" required helper="Full name for the booking record">
              <Input
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Juan Dela Cruz"
                autoCapitalize="words"
              />
            </Field>
            <Field label="Phone" required helper="We’ll use this for SMS reminders">
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="09xxxxxxxxx"
                keyboardType="phone-pad"
              />
            </Field>
          </Section>

          {/* Service card */}
          <Section title="Service">
            <Field label="Quick select">
              <View style={s.rowWrap}>
                {SERVICE_OPTIONS.map((opt) => (
                  <Chip key={opt} selected={service === opt} onPress={() => setService(opt)}>
                    {opt}
                  </Chip>
                ))}
              </View>
            </Field>
            <Field label="Custom service (optional)" helper="Override or add details">
              <Input
                value={service}
                onChangeText={setService}
                placeholder="e.g., Skin fade + beard trim"
              />
            </Field>
          </Section>

          {/* Staff & schedule card */}
          <Section title="Schedule">
            <Field label="Stylist" helper="Pick a preferred stylist (optional)">
              <View style={s.rowWrap}>
                {STYLIST_OPTIONS.map((opt) => (
                  <Chip key={opt} selected={stylist === opt} onPress={() => setStylist(opt)}>
                    {opt}
                  </Chip>
                ))}
              </View>
            </Field>
            <Field label="Custom stylist (optional)">
              <Input
                value={stylist}
                onChangeText={setStylist}
                placeholder="Type a name"
              />
            </Field>

            <Field label="Date" required helper="YYYY-MM-DD">
              <Input
                value={date}
                onChangeText={setDate}
                placeholder={today()}
                autoCapitalize="none"
              />
            </Field>

            <Field label="Time" required helper="Scroll to choose a slot">
              <FlatList
                data={TIMES}
                keyExtractor={(t) => t}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 6 }}
                ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                renderItem={({ item }) => (
                  <Chip selected={time === item} onPress={() => setTime(item)}>
                    {item}
                  </Chip>
                )}
              />
            </Field>
          </Section>

          {/* Pricing & notes */}
          <Section title="Details">
            <Field label="Price (₱)" helper="Optional; you can set at checkout">
              <Input
                value={price}
                onChangeText={setPrice}
                placeholder="e.g., 350"
                keyboardType="numeric"
              />
            </Field>

            <Field label="Notes" helper="Special requests, allergies, etc.">
              <Input
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requests…"
                multiline
                style={{ minHeight: 96, textAlignVertical: "top" }}
              />
            </Field>
          </Section>

          {/* Spacer to avoid overlap with sticky footer */}
          <View style={{ height: 96 }} />
        </ScrollView>

        <FooterBar>
          <TouchableOpacity
            onPress={submit}
            disabled={submitting || !canSubmit}
            style={[cta.btn, (submitting || !canSubmit) && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            <Text style={cta.text}>{submitting ? "Saving…" : "Create booking"}</Text>
          </TouchableOpacity>
        </FooterBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ──────────────────────────────
 * Reusable UI atoms
 * ────────────────────────────── */

function Section({ title, children }: { title: string; children: any }) {
  return (
    <View style={card.wrap}>
      <View style={card.header}>
        <Text style={card.title}>{title}</Text>
      </View>
      <View style={card.body}>{children}</View>
    </View>
  );
}

function Field({
  label,
  required,
  helper,
  children
}: {
  label: string;
  required?: boolean;
  helper?: string;
  children: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={fld.row}>
        <Text style={fld.label}>
          {label} {required && <Text style={fld.req}>*</Text>}
        </Text>
        {helper ? <Text style={fld.helper}>{helper}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={t.muted}
      style={[inp.base, props.style]}
    />
  );
}

function Chip({ children, onPress, selected }: { children: any; onPress: () => void; selected?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[chip.base, selected ? chip.active : chip.idle]}
    >
      <Text style={selected ? chip.activeText : chip.idleText}>{children}</Text>
    </TouchableOpacity>
  );
}

function FooterBar({ children }: { children: any }) {
  return (
    <View style={ftr.wrap}>
      <View style={ftr.inner}>{children}</View>
    </View>
  );
}

/* ──────────────────────────────
 * Theme tokens
 * ────────────────────────────── */
const t = {
  bg: "#0f172a0a",        // slate-900 @ 4% overlay
  card: "#ffffff",
  ink: "#0f172a",
  muted: "#6b7280",       // gray-500
  line: "#e5e7eb",        // gray-200
  primary: "#111827",     // gray-900 (brand)
  subtle: "#f8fafc",      // slate-50
  focus: "#2563eb",       // brand accent for focus
  radius: 14,
  radiusLg: 18,
  shadow: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4
    }
  }
};

/* ──────────────────────────────
 * Styles
 * ────────────────────────────── */
const hdr = StyleSheet.create({
  wrap: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: t.line
  },
  title: { fontSize: 22, fontWeight: "800", color: t.ink },
  subtitle: { marginTop: 2, color: t.muted }
});

const s = StyleSheet.create({
  scroll: { padding: 16, gap: 14 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
});

const card = StyleSheet.create({
  wrap: {
    backgroundColor: t.card,
    borderRadius: t.radiusLg,
    borderWidth: 1,
    borderColor: t.line,
    ...t.shadow.card,
    overflow: "hidden"
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: t.subtle,
    borderBottomWidth: 1,
    borderBottomColor: t.line
  },
  title: { fontSize: 15, fontWeight: "800", color: t.ink, letterSpacing: 0.2, textTransform: "uppercase" },
  body: { padding: 16 }
});

const fld = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "700", color: t.ink },
  req: { color: "#ef4444" },
  helper: { fontSize: 12, color: t.muted, marginLeft: 8 }
});

const inp = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: t.line,
    backgroundColor: "#fafafa",
    borderRadius: t.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: t.ink
  }
});

const chip = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1
  },
  idle: { backgroundColor: "#fff", borderColor: t.line },
  idleText: { color: t.ink, fontWeight: "700" },
  active: { backgroundColor: t.primary, borderColor: t.primary },
  activeText: { color: "#fff", fontWeight: "700" }
});

const cta = StyleSheet.create({
  btn: {
    flex: 1,
    backgroundColor: t.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  text: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.2 }
});

const ftr = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: t.line
  },
  inner: {
    padding: 16,
  }
});
