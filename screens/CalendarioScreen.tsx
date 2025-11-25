import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, Platform, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, DateObject } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

type Task = {
  id: string;
  title: string;
  description?: string;
  dueAt: string; // ISO
};

type TasksByDay = Record<string, Task[]>; // key: YYYY-MM-DD

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const STORAGE_KEY = '@tasks_data';

export default function CalendarioScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [tasksByDay, setTasksByDay] = useState<TasksByDay>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed: TasksByDay = JSON.parse(json);
          setTasksByDay(parsed);
        }
      } catch (e) {
        // ignore
      }
      await ensurePermissions();
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
    })();
  }, []);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.keys(tasksByDay).forEach((day) => {
      if (tasksByDay[day]?.length) {
        marks[day] = { marked: true, dots: [{ color: '#F77F00' }] };
      }
    });
    marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: '#F77F00' };
    return marks;
  }, [tasksByDay, selectedDate]);

  const tasks = tasksByDay[selectedDate] || [];

  const ensurePermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const res = await Notifications.requestPermissionsAsync();
      if (res.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa las notificaciones para recordar tus tareas.');
      }
    }
  };

  const saveTasks = async (next: TasksByDay) => {
    setTasksByDay(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const scheduleTaskNotification = async (t: Task) => {
    try {
      const triggerDate = new Date(t.dueAt);
      if (triggerDate.getTime() <= Date.now()) return; // no programar en el pasado
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Tarea próxima a vencer',
          body: `${t.title} vence el ${triggerDate.toLocaleString()}`,
          sound: true,
        },
        trigger: triggerDate,
      });
    } catch (e) {
      // ignore
    }
  };

  const onSubmitTask = async () => {
    if (!title.trim()) {
      Alert.alert('Título requerido', 'Por favor, escribe el título de la tarea.');
      return;
    }
    const id = `${Date.now()}`;
    const dueAtIso = dueDate.toISOString();
    const t: Task = { id, title: title.trim(), description: description.trim() || undefined, dueAt: dueAtIso };
    const dayKey = dueAtIso.slice(0, 10);
    const next: TasksByDay = { ...tasksByDay, [dayKey]: [...(tasksByDay[dayKey] || []), t] };
    await saveTasks(next);
    await scheduleTaskNotification(t);
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setSelectedDate(dayKey);
  };

  const handleChangeDate = (_event: any, date?: Date) => {
    if (date) setDueDate(date);
    setShowDatePicker(false);
  };

  const handleChangeTime = (_event: any, date?: Date) => {
    if (date) setDueDate(date);
    setShowTimePicker(false);
  };

  const deleteTask = async (taskId: string, dayKey: string) => {
    const dayTasks = tasksByDay[dayKey] || [];
    const nextDayTasks = dayTasks.filter((t) => t.id !== taskId);
    const next: TasksByDay = { ...tasksByDay, [dayKey]: nextDayTasks };
    await saveTasks(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Calendario de Tareas</Text>
      <Calendar
        onDayPress={(d: DateObject) => setSelectedDate(d.dateString)}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#F77F00',
          todayTextColor: '#F77F00',
          arrowColor: '#F77F00',
        }}
      />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Tareas para {selectedDate}</Text>
        <Pressable style={styles.addButton} onPress={() => {
          setDueDate(new Date(selectedDate + 'T12:00:00'));
          setShowAddModal(true);
        }}>
          <Text style={styles.addButtonText}>+ Nueva tarea</Text>
        </Pressable>
      </View>

      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>No tienes tareas para este día</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}
                <Text style={styles.taskDue}>Vence: {new Date(item.dueAt).toLocaleString()}</Text>
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => deleteTask(item.id, selectedDate)}>
                <Text style={styles.deleteText}>✕</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva tarea</Text>
              <Pressable onPress={() => setShowAddModal(false)}><Text style={styles.modalClose}>✕</Text></Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Título"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción (opcional)"
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.pickersRow}>
              <Pressable style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.pickerBtnText}>📅 {dueDate.toLocaleDateString()}</Text>
              </Pressable>
              <Pressable style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.pickerBtnText}>⏰ {dueDate.toLocaleTimeString()}</Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleChangeDate}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={dueDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleChangeTime}
              />
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]} onPress={onSubmitTask} disabled={!title.trim()}>
                <Text style={styles.saveText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#161616', padding: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  listTitle: { fontSize: 16, fontWeight: '600', color: '#161616' },
  addButton: { backgroundColor: '#F77F00', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  emptyText: { paddingHorizontal: 16, color: '#6B6B6B', marginTop: 8 },
  taskItem: { marginHorizontal: 16, marginTop: 10, backgroundColor: '#FEF9F3', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F0E8DC' },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#161616' },
  taskDesc: { fontSize: 13, color: '#3D3D3D', marginTop: 4 },
  taskDue: { fontSize: 12, color: '#6B6B6B', marginTop: 6 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FECB62', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  deleteText: { fontSize: 16, fontWeight: '700', color: '#161616' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  modalBox: { width: '90%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#161616' },
  modalClose: { fontSize: 18 },
  input: { backgroundColor: '#FEF9F3', borderRadius: 10, padding: 12, fontSize: 16, marginTop: 12, borderWidth: 1, borderColor: '#F0E8DC' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickersRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pickerBtn: { flex: 1, backgroundColor: '#FFEEDD', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#F0E8DC' },
  pickerBtnText: { fontWeight: '600', color: '#161616' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F0E8DC' },
  cancelText: { color: '#161616' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F77F00' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '700' },
});
