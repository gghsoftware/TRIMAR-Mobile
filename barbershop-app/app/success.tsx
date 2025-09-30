import { useLocalSearchParams, router } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function Success() {
  const { booking } = useLocalSearchParams();
  const data = booking && typeof booking === 'string' ? JSON.parse(booking) : null;

  return (
    <View style={s.container}>
      <Text style={s.h1}>Booking saved 🎉</Text>
      {data ? (
        <>
          {data.id && <Text style={s.detail}>Ref: {data.id}</Text>}
          {data.customerName && <Text style={s.detail}>{data.customerName}</Text>}
          {(data.date || data.time) && <Text style={s.detail}>{data.date}{data.time ? ` at ${data.time}` : ""}</Text>}
          {data.phone && <Text style={s.detail}>{data.phone}</Text>}
        </>
      ) : <Text style={{ opacity:.8 }}>Created.</Text>}
      <TouchableOpacity onPress={() => router.replace("/")} style={s.btn}>
        <Text style={{ color:"#fff", fontWeight:"700" }}>Back to list</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:{ flex:1, padding:16, gap:8, backgroundColor:"#fff" },
  h1:{ fontSize:22, fontWeight:"800" },
  detail:{ opacity:.9 },
  btn:{ marginTop:12, backgroundColor:"#111827", padding:14, borderRadius:14, alignItems:"center" }
});
