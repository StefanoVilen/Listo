import React, { useEffect, useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import TaskForm from "../components/TaskForm";
import { useTasks } from "../context/TasksContext";
import { theme } from "../theme";

export default function EditTaskScreen({ route, navigation }) {
  const { id, copyTo } = route.params || {}; // edição apenas (sem draft)
  const { tasks, updateTask, copyTaskToDate } = useTasks();
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    if (id) {
      const t = tasks.find((x) => x.id === id);
      if (t) setInitial(t);
    }
  }, [id, tasks]);

  const onSubmit = (payload) => {
    if (!id) return navigation.goBack(); // segurança

    updateTask(id, payload);
    if (copyTo) {
      copyTaskToDate(id, copyTo);
      Alert.alert("Copiada", `Tarefa copiada para ${copyTo}.`);
    }
    navigation.goBack();
  };

  if (!initial) return null;
  return (
    <View style={styles.container}>
      <TaskForm
        initial={initial}
        onSubmit={onSubmit}
        onCancel={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
});
