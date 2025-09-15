import * as BackgroundFetch from "expo-background-fetch";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { getLastNotifyAt, getStoredState, setLastNotifyAt } from "./storage";

const TASK_NAME = "TASKS_PENDING_CHECK";
const TWO_HOURS = 2 * 60 * 60 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// utils de data
function toYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function parseYMD(s) {
  return new Date(`${s}T00:00:00`);
}

function matchesRecurrence(task, ymd) {
  if (task.rrule) {
    // Se você já migrou para RRULE no TasksContext, idealmente
    // reusesse lá. Aqui mantemos a lógica simples de legado:
  }
  if (task.repeat === "none") return task.date === ymd;

  const start = parseYMD(task.date);
  const cur = parseYMD(ymd);
  if (cur < start) return false;
  if (task.repeatUntil && cur > new Date(`${task.repeatUntil}T23:59:59`))
    return false;

  if (task.repeat === "daily") return true;
  if (task.repeat === "weekly") {
    const delta = Math.round((cur - start) / 86400000);
    return delta % 7 === 0;
  }
  if (task.repeat === "monthly") {
    return start.getDate() === cur.getDate();
  }
  return false;
}

async function getPendingToday() {
  const state = await getStoredState();
  const tasks = state.tasks || [];
  const ymd = toYMD(new Date());
  const todayList = tasks.filter(
    (t) => matchesRecurrence(t, ymd) || (t.repeat === "none" && t.date === ymd)
  );
  const pendingList = todayList.filter((t) =>
    t.repeat === "none" ? !t.completed : !(t.completedDates || []).includes(ymd)
  );
  return { ymd, pendingList };
}

async function notifyPendingNow() {
  const { pendingList } = await getPendingToday();
  const count = pendingList.length;
  if (count <= 0) return false;

  const topTitles = pendingList.slice(0, 3).map((t) => t.title);
  const rest = count - topTitles.length;
  const body = topTitles.length
    ? `${topTitles.join(" · ")}${rest > 0 ? ` · +${rest}` : ""}`
    : `Você tem ${count} tarefa(s) pendente(s).`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Pendências de hoje (${count})`,
      body,
    },
    trigger: null,
  });
  return true;
}

// Task de background
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const last = await getLastNotifyAt();
    const now = Date.now();
    if (now - last < 90 * 60 * 1000) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    const didNotify = await notifyPendingNow();
    if (didNotify) await setLastNotifyAt(now);
    return didNotify
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Fallback: lembrete fixo a cada 2h
async function scheduleFallbackReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Lembrete de produtividade",
      body: "Confira suas tarefas do dia. 😉",
    },
    trigger: { seconds: 2 * 60 * 60, repeats: true },
  });
}

export async function setupNotifications() {
  if (Device.isDevice) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      return;
    }
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  try {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    const exists = tasks.find((t) => t.taskName === TASK_NAME);
    if (!exists) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: TWO_HOURS / 1000, // em segundos
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // segue só com fallback
  }
  await scheduleFallbackReminder();
}

export async function testNotifyNow() {
  await notifyPendingNow();
}
