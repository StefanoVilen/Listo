// src/components/TaskForm.js
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTasks } from "../context/TasksContext";
import { theme } from "../theme";
import { toYMD } from "../utils/date";

// Constrói Date em horário local (evita “voltar 1 dia” em alguns fusos)
const parseYMDLocal = (ymd) => {
  if (!ymd) return new Date();
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date();
  dt.setFullYear(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

export default function TaskForm({ initial, onSubmit, onCancel }) {
  const isEditing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [date, setDate] = useState(initial?.date || toYMD(new Date()));
  const [repeat, setRepeat] = useState(initial?.repeat || "none");
  const [repeatUntil, setRepeatUntil] = useState(initial?.repeatUntil || null);

  const [showPicker, setShowPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  // Acesso ao contexto para exclusão contextual direto da tela de edição
  const { tasks, deleteTask, deleteTaskSeries, deleteOccurrence } =
    useTasks() || {};

  // Quantas tarefas pertencem à mesma série (para oferecer “todas as cópias” quando fizer sentido)
  const sameSeriesCount = useMemo(() => {
    if (!isEditing || !tasks?.length) return 1;
    const sid = initial.seriesId || initial.id;
    return tasks.filter((t) => (t.seriesId || t.id) === sid).length;
  }, [isEditing, tasks, initial]);

  // Date pickers — sempre fechar no Android e aplicar apenas quando "set"
  const onPick = (event, d) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event?.type !== "set" || !d) return;
    setDate(toYMD(d));
  };

  const onPickUntil = (event, d) => {
    if (Platform.OS === "android") setShowUntilPicker(false);
    if (event?.type !== "set" || !d) return;
    setRepeatUntil(toYMD(d));
  };

  const handleSave = () => {
    onSubmit({
      title,
      notes,
      date,
      repeat, // legado simples (none/daily/weekly/monthly)
      repeatUntil,
      // (se no futuro usar RRULE, aqui enviaria rrule/exdates)
    });
  };

  const handleDelete = () => {
    // Se não estiver editando (criando nova), não há o que excluir
    if (!isEditing) return;
    const item = initial;
    const isRRule = !!item.rrule;
    const isLegacyRecurring = item.repeat && item.repeat !== "none";

    // 1) RRULE moderna: oferecer excluir ocorrência OU série inteira
    if (
      (isRRule || isLegacyRecurring) &&
      typeof deleteOccurrence === "function"
    ) {
      Alert.alert("Excluir tarefa", "O que você deseja excluir?", [
        {
          text: "Ocorrência desta data",
          style: "destructive",
          onPress: () => {
            try {
              deleteOccurrence(item.id, date);
              onCancel?.();
            } catch {
              Alert.alert("Ops", "Não foi possível excluir a ocorrência.");
            }
          },
        },
        {
          text: "Série inteira",
          style: "destructive",
          onPress: () => {
            try {
              deleteTaskSeries?.(item.id);
              onCancel?.();
            } catch {
              Alert.alert("Ops", "Não foi possível excluir a série.");
            }
          },
        },
        { text: "Cancelar", style: "cancel" },
      ]);
      return;
    }

    // 2) Sem RRULE — tarefas avulsas ou cópias em série (mesma seriesId)
    if (sameSeriesCount > 1) {
      Alert.alert(
        "Excluir tarefa",
        "Excluir somente esta ou todas as cópias desta série?",
        [
          {
            text: "Somente esta",
            style: "destructive",
            onPress: () => {
              try {
                deleteTask?.(item.id);
                onCancel?.();
              } catch (e) {
                Alert.alert("Ops", "Não foi possível excluir esta tarefa.");
              }
            },
          },
          {
            text: "Todas as cópias",
            style: "destructive",
            onPress: () => {
              try {
                deleteTaskSeries?.(item.id);
                onCancel?.();
              } catch (e) {
                Alert.alert("Ops", "Não foi possível excluir a série.");
              }
            },
          },
          { text: "Cancelar", style: "cancel" },
        ]
      );
    } else {
      // 3) Isolada
      Alert.alert(
        "Excluir tarefa",
        `Tem certeza que deseja excluir "${item.title || "Sem título"}"?`,
        [
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              try {
                deleteTask?.(item.id);
                onCancel?.();
              } catch (e) {
                Alert.alert("Ops", "Não foi possível excluir a tarefa.");
              }
            },
          },
          { text: "Cancelar", style: "cancel" },
        ]
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.form}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ex.: Fechar folha de ponto"
          style={styles.input}
          placeholderTextColor={theme.textMuted}
        />

        <Text style={styles.label}>Notas</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Detalhes, checklist, etc."
          style={[styles.input, { height: 80 }]}
          multiline
          placeholderTextColor={theme.textMuted}
        />

        <Text style={styles.label}>Data</Text>
        <View style={styles.row}>
          <Text style={styles.pill}>{date}</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={styles.btnSm}
          >
            <Text style={styles.btnText}>Alterar</Text>
          </TouchableOpacity>
        </View>
        {showPicker && (
          <DateTimePicker
            value={parseYMDLocal(date)}
            mode="date"
            onChange={onPick}
          />
        )}

        <Text style={styles.label}>Recorrência</Text>
        <View style={styles.rowWrap}>
          {["none", "daily", "weekly", "monthly"].map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setRepeat(opt)}
              style={[styles.chip, repeat === opt && styles.chipOn]}
            >
              <Text
                style={[styles.chipText, repeat === opt && styles.chipTextOn]}
              >
                {opt === "none"
                  ? "Nenhuma"
                  : opt === "daily"
                  ? "Diária"
                  : opt === "weekly"
                  ? "Semanal"
                  : "Mensal"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {repeat !== "none" && (
          <>
            <Text style={styles.label}>Repetir até</Text>
            <View style={styles.row}>
              <Text style={styles.pill}>{repeatUntil || "—"}</Text>
              <TouchableOpacity
                onPress={() => setShowUntilPicker(true)}
                style={styles.btnSm}
              >
                <Text style={styles.btnText}>Definir</Text>
              </TouchableOpacity>
              {!!repeatUntil && (
                <TouchableOpacity
                  onPress={() => setRepeatUntil(null)}
                  style={[styles.btnSm, { marginLeft: 8 }]}
                >
                  <Text style={styles.btnText}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
            {showUntilPicker && (
              <DateTimePicker
                value={parseYMDLocal(repeatUntil || date)}
                mode="date"
                onChange={onPickUntil}
              />
            )}
          </>
        )}

        <View style={styles.actions}>
          {isEditing && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.btn, styles.btnDanger, { marginRight: "auto" }]}
            >
              <Text style={styles.btnLabel}>Excluir</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onCancel}
            style={[styles.btn, styles.btnGhost]}
          >
            <Text style={[styles.btnLabel, { color: "#111" }]}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} style={styles.btn}>
            <Text style={styles.btnLabel}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  form: { padding: 12, gap: 8, backgroundColor: theme.bg },
  label: { fontWeight: "700", color: theme.text, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    padding: 10,
    backgroundColor: theme.card,
    color: theme.text,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
  },
  chipOn: { backgroundColor: theme.primary },
  chipText: { color: theme.text, fontWeight: "600" },
  chipTextOn: { color: "#fff" },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  btn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radius,
  },
  btnGhost: { backgroundColor: "#f1f1f1" },
  btnDanger: { backgroundColor: "#ef4444" },
  btnLabel: { color: "#fff", fontWeight: "700" },
  btnSm: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  pill: {
    backgroundColor: "#f6f6f6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 90,
    textAlign: "center",
    color: theme.text,
  },
});
