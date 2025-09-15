// src/components/DateSelector.js
import { addDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";
import { toYMD } from "../utils/date";

function getMonday(d) {
  const date = new Date(d);
  const dow = (date.getDay() + 6) % 7; // 0 = segunda
  const monday = new Date(date);
  monday.setDate(date.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function DateSelector({ selectedDate, onChange }) {
  const [weekStart, setWeekStart] = useState(getMonday(new Date(selectedDate)));

  useEffect(() => {
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    const start = getMonday(sel);
    const end = addDays(start, 6);
    if (sel < start || sel > end) {
      setWeekStart(start);
    }
  }, [selectedDate]);

  const days = useMemo(
    () => [...Array(7)].map((_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekLabel = useMemo(() => {
    const s = days[0];
    const e = days[6];
    const fmt = (d) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;
    return `${fmt(s)} — ${fmt(e)}`;
  }, [days]);

  const goPrevWeek = () => setWeekStart(addDays(weekStart, -7));
  const goNextWeek = () => setWeekStart(addDays(weekStart, +7));

  return (
    <View style={styles.wrapper}>
      {/* header com setinhas */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goPrevWeek}
          style={styles.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navTxt}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.range}>{weekLabel}</Text>

        <TouchableOpacity
          onPress={goNextWeek}
          style={styles.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.navTxt}>›</Text>
        </TouchableOpacity>
      </View>

      {/* grade dos dias */}
      <View style={styles.container}>
        {days.map((d, idx) => {
          const ymd = toYMD(d);
          const isSelected = ymd === selectedDate;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onChange(ymd)}
              style={[styles.day, isSelected && styles.daySelected]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.weekday, isSelected && styles.textSelected]}>
                {"DSTQQSS".charAt((d.getDay() + 6) % 7)}
              </Text>
              <Text style={[styles.daynum, isSelected && styles.textSelected]}>
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  range: { color: theme.textMuted, fontWeight: "600" },
  navBtn: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...theme.shadow,
  },
  navTxt: { color: theme.text, fontWeight: "800", fontSize: 16 },
  container: { flexDirection: "row", justifyContent: "space-between" },
  day: {
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
    width: 44,
    ...theme.shadow,
  },
  daySelected: { backgroundColor: theme.primary, borderColor: theme.primary },
  weekday: { fontSize: 12, color: theme.textMuted },
  daynum: { fontSize: 16, fontWeight: "700", color: theme.text },
  textSelected: { color: "#fff" },
});
