// src/components/TaskItem.js
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";

export default function TaskItem({
  task,
  onToggle,
  onEdit,
  onCopy,
  onDelete,
  ymd,
}) {
  // Instância por data quando tem RRULE ou repeat != 'none'
  const isInstanceBased = !!task.rrule || task.repeat !== "none";
  const isCompleted = isInstanceBased
    ? (task.completedDates || []).includes(ymd)
    : !!task.completed;

  const showRecurrence = isInstanceBased;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={onToggle || undefined}
        disabled={!onToggle}
        style={[styles.checkbox, isCompleted && styles.checkboxOn]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={
          isCompleted ? "Desmarcar tarefa" : "Concluir tarefa"
        }
      />

      <View style={{ flex: 1 }}>
        <Text
          style={[styles.title, isCompleted && styles.titleDone]}
          numberOfLines={2}
        >
          {task.title}
          {showRecurrence ? " 🔁" : ""}
        </Text>

        {!!task.notes && (
          <Text style={styles.notes} numberOfLines={3}>
            {task.notes}
          </Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.link}>Editar</Text>
          </TouchableOpacity>
          <Text> · </Text>
          <TouchableOpacity onPress={onCopy}>
            <Text style={styles.link}>Copiar p/ outra data</Text>
          </TouchableOpacity>
          <Text> · </Text>
          <TouchableOpacity onPress={onDelete}>
            <Text style={[styles.link, { color: "#ef4444" }]}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    marginBottom: 10,
    backgroundColor: theme.card,
    ...theme.shadow,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.border,
  },
  checkboxOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  title: { fontSize: 16, fontWeight: "800", color: theme.text },
  titleDone: { textDecorationLine: "line-through", color: theme.textMuted },
  notes: { color: theme.textMuted, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  link: { color: theme.accent, fontWeight: "600" },
  dot: { color: theme.textMuted },
});
