import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CopyDatePicker from "../components/CopyDatePicker";
import TaskForm from "../components/TaskForm";
import TaskItem from "../components/TaskItem";
import { useTasks } from "../context/TasksContext";
import { theme } from "../theme";
import { toYMD } from "../utils/date";

export default function TodayScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const ctx = useTasks() || {};
  const {
    tasks,
    getTasksByDate,
    toggleComplete,
    createTask,
    deleteTask,
    deleteTaskSeries,
    deleteOccurrence,
  } = ctx;
  const copyTaskToDate = ctx.copyTaskToDate;

  const [selectedDate] = useState(toYMD(new Date()));
  const [showForm, setShowForm] = useState(false);

  const [copyingId, setCopyingId] = useState(null);
  const [copyVisible, setCopyVisible] = useState(false);

  const data = getTasksByDate ? getTasksByDate(selectedDate) : [];

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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text style={styles.h1}>Hoje</Text>
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={styles.addBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.addLabel}>+ Nova</Text>
          </TouchableOpacity>
        </View>

        {data.length === 0 ? (
          <Text style={{ color: theme.textMuted }}>Sem tarefas hoje.</Text>
        ) : (
          <FlatList
            data={data}
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

        <Modal
          visible={showForm}
          animationType="slide"
          onRequestClose={() => setShowForm(false)}
        >
          <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={styles.modalHeader}>
              <Text style={styles.h1}>Nova tarefa</Text>
            </View>
            <TaskForm
              initial={{ date: selectedDate }}
              onSubmit={(payload) => {
                if (typeof createTask === "function") {
                  createTask(payload);
                  Alert.alert("Pronto!", "Tarefa criada com sucesso.");
                } else {
                  Alert.alert("Ops", "Não foi possível criar a tarefa agora.");
                }
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </View>
        </Modal>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  h1: { fontSize: 24, fontWeight: "800", color: theme.text },
  addBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addLabel: { color: "#fff", fontWeight: "700" },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
});
