import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DateSelector from "../components/DateSelector";
import TaskForm from "../components/TaskForm";
import TaskItem from "../components/TaskItem";
import { useTasks } from "../context/TasksContext";
import { theme } from "../theme";
import { toYMD } from "../utils/date";

export default function WeekScreen({ navigation }) {
  const [copyingId, setCopyingId] = useState(null);
  const [showCopyPicker, setShowCopyPicker] = useState(false);
  const insets = useSafeAreaInsets();
  const today = toYMD(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [creating, setCreating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { getTasksByDate, toggleComplete, createTask } = useTasks();

  const data = getTasksByDate(selectedDate);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.h1}>Semana</Text>

        <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.pill}>{selectedDate}</Text>
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={styles.btnSm}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.btnText}>Alterar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setCreating(true)}
            style={styles.addBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.addLabel}>+ Nova</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            onChange={(_, d) => {
              setShowPicker(false);
              if (d) setSelectedDate(toYMD(d));
            }}
          />
        )}

        {data.length === 0 ? (
          <Text style={{ color: theme.textMuted }}>Sem tarefas neste dia.</Text>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TaskItem
                task={item}
                ymd={selectedDate}
                onToggle={() => toggleComplete(item.id, selectedDate)}
                onEdit={() =>
                  navigation.navigate("EditarTarefa", { id: item.id })
                }
                onCopy={() => {
                  // <<-- alterado
                  setCopyingId(item.id);
                  setShowCopyPicker(true);
                }}
              />
            )}
          />
        )}
        {/* Picker para escolher a data da cópia */}
        {showCopyPicker && (
          <DateTimePicker
            value={new Date(selectedDate)}
            mode="date"
            onChange={(event, d) => {
              setShowCopyPicker(false);
              if (event?.type !== "set" || !d) return;
              const ymd = toYMD(d);
              copyTaskToDate(copyingId, ymd);
              setCopyingId(null);
              Alert.alert("Copiado", `Tarefa copiada para ${ymd}.`);
            }}
          />
        )}

        {creating && (
          <View style={styles.sheet}>
            <TaskForm
              initial={{ date: selectedDate }}
              onSubmit={(payload) => {
                createTask(payload); // cria direto (1 clique)
                setCreating(false);
              }}
              onCancel={() => setCreating(false)}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: theme.bg,
  },
  h1: { fontSize: 24, fontWeight: "800", color: theme.text, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  btnSm: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "80%",
    ...theme.shadow,
  },
});
