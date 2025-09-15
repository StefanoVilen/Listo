import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";
import { toYMD } from "../utils/date";

const WEEKDAYS = [
  { key: "MO", label: "S" }, // segunda
  { key: "TU", label: "T" },
  { key: "WE", label: "Q" },
  { key: "TH", label: "Q" },
  { key: "FR", label: "S" },
  { key: "SA", label: "S" },
  { key: "SU", label: "D" },
];

export default function RecurrenceEditor({ startDate, value, onChange }) {
  // value = rrule string | null
  // estado simples
  const [freq, setFreq] = useState("none"); // none|DAILY|WEEKLY|MONTHLY
  const [interval, setInterval] = useState(1);
  const [byday, setByday] = useState([]); // ['MO','WE']
  const [bymonthday, setBymonthday] = useState(null);
  const [bysetpos, setBysetpos] = useState(null); // 1..4 or -1 (último)
  const [until, setUntil] = useState(null);

  // hidrata a partir de value (se vier pronta)
  useEffect(() => {
    if (!value) {
      setFreq("none");
      return;
    }
    const parts = Object.fromEntries(
      value.split(";").map((p) => {
        const [k, v] = p.split("=");
        return [k, v];
      })
    );
    setFreq(parts.FREQ || "none");
    setInterval(Number(parts.INTERVAL || 1));
    setByday((parts.BYDAY || "").split(",").filter(Boolean));
    setBymonthday(parts.BYMONTHDAY ? Number(parts.BYMONTHDAY) : null);
    setBysetpos(parts.BYSETPOS ? Number(parts.BYSETPOS) : null);
    setUntil(parts.UNTIL || null);
  }, [value]);

  // monta a RRULE de saída
  useEffect(() => {
    if (freq === "none") {
      onChange(null);
      return;
    }
    const tokens = [`FREQ=${freq}`];
    if (interval && interval !== 1) tokens.push(`INTERVAL=${interval}`);
    if (freq === "WEEKLY" && byday.length)
      tokens.push(`BYDAY=${byday.join(",")}`);
    if (freq === "MONTHLY") {
      if (bysetpos) {
        // ex.: 2ª segunda => BYSETPOS=2;BYDAY=MO
        if (byday.length) tokens.push(`BYDAY=${byday.join(",")}`);
        tokens.push(`BYSETPOS=${bysetpos}`);
      } else if (bymonthday) {
        tokens.push(`BYMONTHDAY=${bymonthday}`);
      }
    }
    if (until) tokens.push(`UNTIL=${until.replaceAll("-", "")}T235959Z`);
    onChange(tokens.join(";"));
  }, [freq, interval, byday, bymonthday, bysetpos, until, onChange]);

  // helpers UI
  const start = new Date(startDate || new Date());
  const startDay = start.getDate();
  const weekdayIdx = (start.getDay() + 6) % 7; // 0=MO
  const toggleByday = (d) => {
    setByday((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>Recorrência</Text>
      <View style={styles.rowWrap}>
        {[
          { k: "none", t: "Nenhuma" },
          { k: "DAILY", t: "Diária" },
          { k: "WEEKLY", t: "Semanal" },
          { k: "MONTHLY", t: "Mensal" },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.k}
            onPress={() => setFreq(opt.k)}
            style={[styles.chip, freq === opt.k && styles.chipOn]}
          >
            <Text
              style={[styles.chipText, freq === opt.k && styles.chipTextOn]}
            >
              {opt.t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {freq !== "none" && (
        <>
          <Text style={styles.label}>A cada</Text>
          <View style={styles.rowWrap}>
            {[1, 2, 3, 4].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setInterval(n)}
                style={[styles.chip, interval === n && styles.chipOn]}
              >
                <Text
                  style={[styles.chipText, interval === n && styles.chipTextOn]}
                >
                  {n}{" "}
                  {freq === "DAILY"
                    ? "dia(s)"
                    : freq === "WEEKLY"
                    ? "semana(s)"
                    : "mês(es)"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {freq === "WEEKLY" && (
        <>
          <Text style={styles.label}>Dias da semana</Text>
          <View style={styles.rowWrap}>
            {WEEKDAYS.map((w, i) => (
              <TouchableOpacity
                key={w.key}
                onPress={() => toggleByday(w.key)}
                style={[styles.dot, byday.includes(w.key) && styles.dotOn]}
              >
                <Text
                  style={[
                    styles.dotText,
                    byday.includes(w.key) && styles.chipTextOn,
                  ]}
                >
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {!byday.length && (
            <Text style={{ color: theme.textMuted }}>
              Sugestão: selecione pelo menos {WEEKDAYS[weekdayIdx].label} (dia
              inicial).
            </Text>
          )}
        </>
      )}

      {freq === "MONTHLY" && (
        <>
          <Text style={styles.label}>Padrão mensal</Text>
          <View style={styles.rowWrap}>
            <TouchableOpacity
              onPress={() => {
                setBysetpos(null);
                setByday([]);
                setBymonthday(startDay);
              }}
              style={[
                styles.chip,
                bysetpos == null && bymonthday != null && styles.chipOn,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  bysetpos == null && bymonthday != null && styles.chipTextOn,
                ]}
              >
                No dia {startDay}
              </Text>
            </TouchableOpacity>
            {[1, 2, 3, 4, -1].map((pos) => (
              <TouchableOpacity
                key={pos}
                onPress={() => {
                  setBysetpos(pos);
                  setBymonthday(null);
                  setByday([WEEKDAYS[weekdayIdx].key]);
                }}
                style={[styles.chip, bysetpos === pos && styles.chipOn]}
              >
                <Text
                  style={[
                    styles.chipText,
                    bysetpos === pos && styles.chipTextOn,
                  ]}
                >
                  {pos === -1 ? "Último" : `${pos}º`}{" "}
                  {
                    ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"][
                      (weekdayIdx + 0) % 7
                    ]
                  }
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {freq !== "none" && (
        <>
          <Text style={styles.label}>Repetir até</Text>
          <View style={styles.rowWrap}>
            <TouchableOpacity
              onPress={() => setUntil(null)}
              style={[styles.chip, !until && styles.chipOn]}
            >
              <Text style={[styles.chipText, !until && styles.chipTextOn]}>
                Nunca
              </Text>
            </TouchableOpacity>
            {/* simplificado: 30/60/90 dias de atalho */}
            {[30, 60, 90].map((days) => {
              const d = new Date(start);
              d.setDate(d.getDate() + days);
              const ymd = toYMD(d);
              const active = until === ymd;
              return (
                <TouchableOpacity
                  key={days}
                  onPress={() => setUntil(ymd)}
                  style={[styles.chip, active && styles.chipOn]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextOn]}>
                    Até {ymd}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: "700", color: theme.text, marginTop: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  chipOn: { backgroundColor: theme.primary },
  chipText: { color: theme.text, fontWeight: "600" },
  chipTextOn: { color: "#fff" },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  dotOn: { backgroundColor: theme.primary },
  dotText: { color: theme.text, fontWeight: "700" },
});
