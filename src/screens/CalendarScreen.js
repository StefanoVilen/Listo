import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CopyDatePicker from "../components/CopyDatePicker";
import DateSelector from "../components/DateSelector";
import TaskItem from "../components/TaskItem";
import { useTasks } from "../context/TasksContext";
import { theme } from "../theme";
import { toYMD } from "../utils/date";

export default function CalendarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const today = toYMD(new Date());

  const [mode, setMode] = useState("month"); // 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(today.slice(0, 7)); // 'YYYY-MM'

  // cópia
  const [copyingId, setCopyingId] = useState(null);
  const [copyVisible, setCopyVisible] = useState(false);

  const ctx = useTasks() || {};
  const {
    tasks,
    getTasksByDate,
    toggleComplete,
    deleteTask,
    deleteTaskSeries,
    deleteOccurrence,
  } = ctx;
  const copyTaskToDate = ctx.copyTaskToDate;

  const list = getTasksByDate ? getTasksByDate(selectedDate) : [];

  // dias do mês visível
  const monthDays = useMemo(() => {
    const [y, m] = visibleMonth.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) =>
      toYMD(new Date(y, m - 1, i + 1))
    );
  }, [visibleMonth]);

  // dots do mês
  const marked = useMemo(() => {
    if (!getTasksByDate) return {};
    const out = {};
    monthDays.forEach((ymd) => {
      const dayTasks = getTasksByDate(ymd);
      if (dayTasks.length === 0 && ymd !== selectedDate) return;

      let completed = 0,
        pending = 0;
      dayTasks.forEach((t) => {
        const isInstanceBased = !!t.rrule || t.repeat !== "none";
        const done = isInstanceBased
          ? (t.completedDates || []).includes(ymd)
          : t.completed;
        if (done) completed++;
        else pending++;
      });

      const dots = [];
      if (pending > 0) dots.push({ color: "#ef4444" });
      if (completed > 0) dots.push({ color: "#16a34a" });

      out[ymd] = {
        selected: ymd === selectedDate,
        selectedColor: theme.primary,
        dots,
        marked: dots.length > 0,
      };
    });
    return out;
  }, [monthDays, selectedDate, getTasksByDate]);

  const openCopyPicker = (taskId) => {
    setCopyingId(taskId);
    setCopyVisible(true);
  };

  const handleConfirmCopy = (ymd) => {
    setCopyVisible(false);
    if (!copyingId || typeof copyTaskToDate !== "function") {
      setCopyingId(null);
      return;
    }
    try {
      copyTaskToDate(copyingId, ymd);
      Alert.alert("Copiado", `Tarefa copiada para ${ymd}.`);
    } catch (e) {
      console.warn(e);
      Alert.alert("Ops", "Não foi possível copiar a tarefa agora.");
    } finally {
      setCopyingId(null);
    }
  };

  const handleDelete = (item) => {
    const all = Array.isArray(tasks) ? tasks : [];
    const sameSeriesCount = all.filter(
      (t) => (t.seriesId || t.id) === (item.seriesId || item.id)
    ).length;

    const canDelete = typeof deleteTask === "function";
    const canDeleteSeries = typeof deleteTaskSeries === "function";
    const canDeleteOcc = typeof deleteOccurrence === "function";

    const isLegacyRecurring = item?.repeat && item.repeat !== "none";
    const isRecurring = !!item?.rrule || isLegacyRecurring;

    if (isRecurring && (canDeleteOcc || canDeleteSeries)) {
      Alert.alert(
        "Excluir tarefa",
        "O que você deseja excluir?",
        [
          canDeleteOcc && {
            text: "Ocorrência desta data",
            style: "destructive",
            onPress: () => deleteOccurrence(item.id, selectedDate),
          },
          canDeleteSeries && {
            text: "Série inteira",
            style: "destructive",
            onPress: () => deleteTaskSeries(item.id),
          },
          { text: "Cancelar", style: "cancel" },
        ].filter(Boolean)
      );
      return;
    }

    if (sameSeriesCount > 1 && (canDelete || canDeleteSeries)) {
      Alert.alert(
        "Excluir tarefa",
        "Excluir somente esta ou todas as cópias desta série?",
        [
          canDelete && {
            text: "Somente esta",
            style: "destructive",
            onPress: () => deleteTask(item.id),
          },
          canDeleteSeries && {
            text: "Todas as cópias",
            style: "destructive",
            onPress: () => deleteTaskSeries(item.id),
          },
          { text: "Cancelar", style: "cancel" },
        ].filter(Boolean)
      );
      return;
    }

    if (canDelete) {
      Alert.alert(
        "Excluir tarefa",
        `Tem certeza que deseja excluir "${item.title}"?`,
        [
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => deleteTask(item.id),
          },
          { text: "Cancelar", style: "cancel" },
        ]
      );
    } else {
      Alert.alert("Ops", "Funções de exclusão indisponíveis no momento.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Header + toggle */}
        <View style={styles.header}>
          <Text style={styles.h1}>Calendário</Text>
          <View style={styles.toggle}>
            <TouchableOpacity
              onPress={() => setMode("week")}
              style={[styles.segment, mode === "week" && styles.segmentOn]}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === "week" && styles.segmentTextOn,
                ]}
              >
                Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("month")}
              style={[styles.segment, mode === "month" && styles.segmentOn]}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === "month" && styles.segmentTextOn,
                ]}
              >
                Mês
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === "week" ? (
          <DateSelector
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
        ) : (
          <Calendar
            markingType="multi-dot"
            markedDates={marked}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            onMonthChange={(m) =>
              setVisibleMonth(`${m.year}-${String(m.month).padStart(2, "0")}`)
            }
            initialDate={selectedDate}
            theme={{
              todayTextColor: theme.primary,
              selectedDayBackgroundColor: theme.primary,
              textMonthFontWeight: "800",
              arrowColor: theme.text,
            }}
            style={styles.calendar}
          />
        )}

        {/* Linha de data + ações */}
        <View style={styles.row}>
          <Text style={styles.label}>Data:</Text>
          <Text style={styles.pill}>{selectedDate}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditarTarefa", {
                draft: { date: selectedDate },
              })
            }
            style={styles.addBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.addLabel}>+ Nova</Text>
          </TouchableOpacity>
        </View>

        {/* Lista do dia */}
        {list.length === 0 ? (
          <Text style={{ color: theme.textMuted }}>Sem tarefas neste dia.</Text>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TaskItem
                task={item}
                ymd={selectedDate}
                onToggle={() =>
                  toggleComplete && toggleComplete(item.id, selectedDate)
                }
                onEdit={() =>
                  navigation.navigate("EditarTarefa", { id: item.id })
                }
                onCopy={() => openCopyPicker(item.id)}
                onDelete={() => handleDelete(item)}
              />
            )}
          />
        )}

        {/* Picker de cópia (com calendário) */}
        <CopyDatePicker
          visible={copyVisible}
          initialDate={selectedDate}
          onCancel={() => {
            setCopyVisible(false);
            setCopyingId(null);
          }}
          onConfirm={handleConfirmCopy}
        />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  h1: { fontSize: 24, fontWeight: "800", color: theme.text },
  toggle: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 999,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  segment: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  segmentOn: { backgroundColor: theme.primary },
  segmentText: { color: theme.text },
  segmentTextOn: { color: "#fff", fontWeight: "700" },
  calendar: {
    borderRadius: theme.radius,
    ...theme.shadow,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
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
  addBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius,
  },
  addLabel: { color: "#fff", fontWeight: "700" },
});
