import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTasks } from "../context/TasksContext";
import { theme } from "../theme";
import { toYMD } from "../utils/date";

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(toYMD(new Date()));
  const [show, setShow] = useState(false);

  // Context com fallback: evita crash em hot reloads
  const ctx = useTasks() || {};
  const getDailyReport =
    ctx.getDailyReport ||
    (() => ({
      date,
      total: 0,
      completedCount: 0,
      completionRate: 0,
      completedTitles: [],
      pendingTitles: [],
    }));
  const stats = ctx.stats || { points: 0, streak: 0, badges: [] };

  const report = getDailyReport(date);

  const shareReport = async () => {
    const text = `Relatório de Produtividade - ${date}
Total planejado: ${report.total}
Concluídas: ${report.completedCount}
Taxa de conclusão: ${report.completionRate}%

Tarefas concluídas:
- ${report.completedTitles.join("\n- ") || "—"}

Pendentes:
- ${report.pendingTitles.join("\n- ") || "—"}
`;
    await Share.share({ message: text });
  };

  const exportPdf = async () => {
    const html = `
    <html><head><meta charset="utf-8"/>
    <style>
      body { font-family: -apple-system, Roboto, Arial, sans-serif; padding:24px; color:#0f172a; }
      h1 { font-size:22px; margin:0 0 8px; }
      .muted { color:#475569; }
      .card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
      .row { margin:6px 0; }
      ul { margin:8px 0 0 18px; }
    </style></head>
    <body>
      <h1>Relatório de Produtividade — ${date}</h1>
      <p class="muted">Gerado via App de Tarefas</p>
      <div class="card">
        <div class="row"><strong>Total planejado:</strong> ${report.total}</div>
        <div class="row"><strong>Concluídas:</strong> ${
          report.completedCount
        }</div>
        <div class="row"><strong>Taxa de conclusão:</strong> ${
          report.completionRate
        }%</div>
        <div class="row"><strong>Concluídas:</strong>
          <ul>${
            (report.completedTitles || [])
              .map((t) => `<li>${t}</li>`)
              .join("") || "<li>—</li>"
          }</ul>
        </div>
        <div class="row"><strong>Pendentes:</strong>
          <ul>${
            (report.pendingTitles || []).map((t) => `<li>${t}</li>`).join("") ||
            "<li>—</li>"
          }</ul>
        </div>
      </div>
    </body></html>`;
    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.h1}>Relatório</Text>

        {/* Linha da data */}
        <View style={styles.row}>
          <Text style={styles.label}>Data:</Text>
          <Text style={styles.pill}>{date}</Text>
          <TouchableOpacity onPress={() => setShow(true)} style={styles.btnSm}>
            <Text style={styles.btnText}>Alterar</Text>
          </TouchableOpacity>
        </View>

        {show && (
          <DateTimePicker
            value={new Date(date)}
            mode="date"
            onChange={(_, d) => {
              setShow(false);
              if (d) setDate(toYMD(d));
            }}
          />
        )}

        {/* Stats simples (pontos / streak / badges) */}
        <Text style={{ color: "#475569", marginBottom: 6 }}>
          Pontos: <Text style={{ fontWeight: "800" }}>{stats.points}</Text>
          {"  "}·{"  "}
          Streak:{" "}
          <Text style={{ fontWeight: "800" }}>{stats.streak} dia(s)</Text>
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 10,
          }}
        >
          {(stats.badges || []).map((b, i) => (
            <Text
              key={i}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 4,
                color: theme.text,
              }}
            >
              {b}
            </Text>
          ))}
        </View>

        {/* Barra de progresso do dia */}
        <View
          style={{
            height: 10,
            backgroundColor: "#e5e7eb",
            borderRadius: 999,
            overflow: "hidden",
            marginVertical: 8,
          }}
        >
          <View
            style={{
              width: `${report.completionRate}%`,
              height: "100%",
              backgroundColor: "#16a34a",
            }}
          />
        </View>

        {/* Card com os números detalhados */}
        <View style={styles.card}>
          <Text style={styles.rowLine}>
            <Text style={styles.label}>Total:</Text> {report.total}
          </Text>
          <Text style={styles.rowLine}>
            <Text style={styles.label}>Concluídas:</Text>{" "}
            {report.completedCount}
          </Text>
          <Text style={styles.rowLine}>
            <Text style={styles.label}>Taxa:</Text> {report.completionRate}%
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
            Concluídas
          </Text>
          {(report.completedTitles || []).length ? (
            (report.completedTitles || []).map((t, i) => (
              <Text key={i}>• {t}</Text>
            ))
          ) : (
            <Text>—</Text>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>
            Pendentes
          </Text>
          {(report.pendingTitles || []).length ? (
            (report.pendingTitles || []).map((t, i) => (
              <Text key={i}>• {t}</Text>
            ))
          ) : (
            <Text>—</Text>
          )}
        </View>

        <TouchableOpacity onPress={shareReport} style={styles.shareBtn}>
          <Text style={styles.shareTxt}>Compartilhar relatório</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={exportPdf}
          style={[styles.shareBtn, { marginTop: 8, backgroundColor: "#0a7" }]}
        >
          <Text style={styles.shareTxt}>Exportar PDF</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: theme.bg,
  },
  h1: { fontSize: 24, fontWeight: "800", color: theme.text, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  label: { fontWeight: "700", color: theme.text },
  pill: {
    backgroundColor: "#f6f6f6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 90,
    textAlign: "center",
    color: theme.text,
  },
  btnSm: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadow,
    marginTop: 8,
  },
  rowLine: { marginBottom: 4, color: theme.text },
  sectionTitle: { fontWeight: "700", marginBottom: 6, color: theme.text },
  shareBtn: {
    marginTop: 16,
    backgroundColor: theme.primary,
    padding: 14,
    borderRadius: theme.radius,
    alignItems: "center",
  },
  shareTxt: { color: "#fff", fontWeight: "800" },
});
