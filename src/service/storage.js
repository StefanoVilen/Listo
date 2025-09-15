import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@tasks_v1";
const LAST_NOTIFY_KEY = "@tasks_last_notify";

export async function getStoredState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw)
    return {
      tasks: [],
      stats: { points: 0, streak: 0, lastCompletionDate: null, badges: [] },
    };
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? {
          tasks: parsed,
          stats: { points: 0, streak: 0, lastCompletionDate: null, badges: [] },
        }
      : parsed;
  } catch {
    return {
      tasks: [],
      stats: { points: 0, streak: 0, lastCompletionDate: null, badges: [] },
    };
  }
}

export async function getLastNotifyAt() {
  const raw = await AsyncStorage.getItem(LAST_NOTIFY_KEY);
  return raw ? Number(raw) : 0;
}

export async function setLastNotifyAt(ts) {
  await AsyncStorage.setItem(LAST_NOTIFY_KEY, String(ts));
}
