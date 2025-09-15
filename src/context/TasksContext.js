import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseISO } from "date-fns";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { RRule, RRuleSet } from "rrule";

import { toYMD } from "../utils/date";

const TasksContext = createContext(null);
const STORAGE_KEY = "@tasks_v1";

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);

  const defaultStats = {
    points: 0,
    streak: 0,
    lastCompletionDate: null,
    badges: [],
  };
  const [stats, setStats] = useState(defaultStats);

  // Util: normaliza 'YYYY-MM-DD' para Date no fuso local (00:00)
  const parseYMD = (s) => new Date(`${s}T00:00:00`);

  // carregar
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // versão antiga: só tasks
          setTasks(parsed);
          setStats(defaultStats);
        } else {
          // versão nova: objeto { tasks, stats }
          setTasks(parsed.tasks || []);
          setStats(parsed.stats || defaultStats);
        }
      } catch {
        setTasks([]);
        setStats(defaultStats);
      }
    })();
  }, []);

  // persistir tasks + stats juntos
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, stats }));
  }, [tasks, stats]);

  const createTask = (data) => {
    const now = Date.now();
    const id = Math.random().toString(36).slice(2);
    const t = {
      id,
      // se veio de uma cópia, mantenha a série; senão, a própria task é a série
      seriesId: data.seriesId || id,

      title: data.title?.trim() || "Sem título",
      notes: data.notes || "",
      date: data.date, // 'YYYY-MM-DD'

      rrule: data.rrule || null,
      exdates: data.exdates || [],

      // legado:
      repeat: data.repeat || "none",
      repeatUntil: data.repeatUntil || null,

      completed: false,
      completedDates: [],
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [t, ...prev]);
    return t.id;
  };

  const updateTask = (id, patch) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              ...(patch.rrule !== undefined
                ? { repeat: "none", repeatUntil: null }
                : {}),
              updatedAt: Date.now(),
            }
          : t
      )
    );
  };

  const copyTaskToDate = (id, newDate) => {
    const base = tasks.find((t) => t.id === id);
    if (!base) return null;
    return createTask({
      title: base.title,
      notes: base.notes,
      date: newDate,
      repeat: "none",
      repeatUntil: null,
      seriesId: base.seriesId || base.id, // <- mantém vínculo com a série
    });
  };

  function taskOccursOn(task, ymd) {
    if ((task.exdates || []).includes(ymd)) return false;
    // 1) RRULE moderno
    if (task.rrule) {
      try {
        const set = new RRuleSet();

        const dtstart = parseISO(`${task.date}T00:00:00`);
        const rule = RRule.fromString(task.rrule);
        const ruleWithStart = new RRule({ ...rule.origOptions, dtstart });

        set.rrule(ruleWithStart);
        (task.exdates || []).forEach((d) =>
          set.exdate(parseISO(`${d}T00:00:00`))
        );

        const dayStart = parseISO(`${ymd}T00:00:00`);
        const dayEnd = parseISO(`${ymd}T23:59:59`);
        const res = set.between(dayStart, dayEnd, true);
        return res.length > 0;
      } catch {
        // se falhar, cai no fallback
      }
    }

    // 2) Fallback legado (repeat simples)
    if (task.repeat === "none") return task.date === ymd;

    const start = parseISO(`${task.date}T00:00:00`);
    const current = parseISO(`${ymd}T00:00:00`);
    if (current < start) return false;
    if (task.repeatUntil && current > parseISO(`${task.repeatUntil}T23:59:59`))
      return false;

    if (task.repeat === "daily") return true;
    if (task.repeat === "weekly") {
      const delta = Math.round((current - start) / 86400000);
      return delta % 7 === 0;
    }
    if (task.repeat === "monthly") {
      return start.getDate() === current.getDate();
    }
    return task.date === ymd;
  }

  // MANTENHA APENAS ESTA getTasksByDate
  const getTasksByDate = (ymd) => {
    return tasks
      .filter((t) =>
        t.repeat === "none" && !t.rrule ? t.date === ymd : taskOccursOn(t, ymd)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  };

  // Premiação ao concluir (pontos/streak/badges)
  const awardForCompletion = (ymd) => {
    const today = ymd || toYMD(new Date());

    setStats((prev) => {
      let points = prev.points + 10; // 10 pts por conclusão
      let streak;

      const last = prev.lastCompletionDate;
      const d = parseYMD(today);
      const y = last ? parseYMD(last) : null;
      const diff = y ? Math.round((d - y) / 86400000) : null; // diferença em dias

      if (!last) {
        streak = 1;
      } else if (diff === 0) {
        // já houve conclusão hoje, não muda streak
        streak = prev.streak;
      } else if (diff === 1) {
        streak = prev.streak + 1;
      } else {
        streak = 1;
      }

      const badges = new Set(prev.badges);
      if (streak === 3) badges.add("Foco 3 dias");
      if (streak === 7) badges.add("Semana lendária");
      if (points >= 100) badges.add("Produtivo 100+");

      return {
        points,
        streak,
        lastCompletionDate: today,
        badges: Array.from(badges),
      };
    });
  };

  // Recalcula stats 100% a partir do estado de tasks
  const recomputeStatsFromList = (list) => {
    // total de conclusões (cada conclusão vale 10 pts)
    let completions = 0;

    // conjunto de dias com pelo menos UMA conclusão
    const daysWithCompletion = new Set();

    for (const t of list) {
      if (t.repeat === "none") {
        if (t.completed) {
          completions += 1;
          daysWithCompletion.add(t.date);
        }
      } else {
        const arr = t.completedDates || [];
        completions += arr.length;
        arr.forEach((d) => daysWithCompletion.add(d));
      }
    }

    const points = completions * 10;

    // lastCompletionDate = maior YMD do set
    let lastCompletionDate = null;
    if (daysWithCompletion.size > 0) {
      lastCompletionDate = Array.from(daysWithCompletion).sort().slice(-1)[0];
    }

    // streak = nº de dias consecutivos terminando em lastCompletionDate
    let streak = 0;
    if (lastCompletionDate) {
      let cursor = parseYMD(lastCompletionDate);
      while (daysWithCompletion.has(toYMD(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // badges simples (mesma lógica anterior)
    const badges = new Set();
    if (streak >= 3) badges.add("Foco 3 dias");
    if (streak >= 7) badges.add("Semana lendária");
    if (points >= 100) badges.add("Produtivo 100+");

    setStats({
      points,
      streak,
      lastCompletionDate,
      badges: Array.from(badges),
    });
  };

  // Concluir (considerando instância)
  const toggleComplete = (id, ymd) => {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;

        if (t.repeat === "none") {
          const now = !t.completed;
          return { ...t, completed: now, updatedAt: Date.now() };
        } else {
          const set = new Set(t.completedDates || []);
          if (set.has(ymd)) set.delete(ymd);
          else set.add(ymd);
          return {
            ...t,
            completedDates: Array.from(set),
            updatedAt: Date.now(),
          };
        }
      });

      // Recalcula pontos/streak/badges considerando o novo estado
      recomputeStatsFromList(next);
      return next;
    });
  };
  const deleteTask = (id) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      recomputeStatsFromList(next);
      return next;
    });
  };

  const deleteTaskSeries = (id) => {
    const base = tasks.find((t) => t.id === id);
    if (!base) return;

    const sid = base.seriesId || base.id;
    setTasks((prev) => {
      const next = prev.filter((t) => (t.seriesId || t.id) !== sid);
      recomputeStatsFromList(next);
      return next;
    });
  };

  // Para recorrentes com RRULE: exclui só a ocorrência no dia informado
  const deleteOccurrence = (id, ymd) => {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;
        // Sempre adiciona exdate — serve para RRULE e repeat "legacy"
        const ex = new Set(t.exdates || []);
        ex.add(ymd);
        return { ...t, exdates: Array.from(ex), updatedAt: Date.now() };
      });
      recomputeStatsFromList(next);
      return next;
    });
  };

  // Estatísticas/relatório do dia
  const getDailyReport = (ymd) => {
    const list = getTasksByDate(ymd);
    const total = list.length;
    const completed = list.filter((t) =>
      t.repeat === "none" ? t.completed : (t.completedDates || []).includes(ymd)
    );
    const completedCount = completed.length;
    const completionRate =
      total === 0 ? 0 : Math.round((completedCount / total) * 100);

    return {
      date: ymd,
      total,
      completedCount,
      completionRate,
      completedTitles: completed.map((t) => t.title),
      pendingTitles: list
        .filter((t) => !completed.includes(t))
        .map((t) => t.title),
    };
  };

  const value = useMemo(
    () => ({
      tasks,
      stats,
      createTask,
      updateTask,
      deleteTask,
      deleteTaskSeries,
      deleteOccurrence,
      copyTaskToDate,
      getTasksByDate,
      toggleComplete,
      getDailyReport,
    }),
    [tasks, stats /* se quiser rigor, liste funções aqui também */]
  );
  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  return useContext(TasksContext);
}
