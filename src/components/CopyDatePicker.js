// src/components/CopyDatePicker.js
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { theme } from "../theme";

export default function CopyDatePicker({
  visible,
  initialDate, // 'YYYY-MM-DD'
  onConfirm, // (ymd) => void
  onCancel, // () => void
}) {
  const [selected, setSelected] = useState(initialDate);

  // Sempre que abrir, reseta a seleção para a data inicial
  useEffect(() => {
    if (visible) setSelected(initialDate);
  }, [visible, initialDate]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <Text style={styles.title}>Escolha a data</Text>

        <Calendar
          initialDate={selected}
          onDayPress={(d) => setSelected(d.dateString)}
          markedDates={{
            [selected]: { selected: true, selectedColor: theme.primary },
          }}
          theme={{
            todayTextColor: theme.primary,
            selectedDayBackgroundColor: theme.primary,
            arrowColor: theme.text,
            textMonthFontWeight: "800",
          }}
          style={styles.calendar}
        />

        <View style={styles.row}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.btn, styles.btnGhost]}
          >
            <Text style={styles.btnGhostTxt}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onConfirm(selected)}
            style={styles.btn}
          >
            <Text style={styles.btnTxt}>Copiar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 8,
  },
  calendar: {
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadow,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  btn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radius,
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
  btnGhost: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  btnGhostTxt: { color: theme.text, fontWeight: "800" },
});
