# Listo

App de tarefas focado em rotina semanal/mensal, com **calendário**, **recorrência** (RRULE), **gamificação** (pontos/streak/badges), **relatórios em PDF** e **lembretes** de pendências a cada 2 horas.  
Construído com **React Native + Expo (SDK 54)**.

> **Status:** MVP funcional em desenvolvimento ativo.

---

## ✨ Recursos

- **Tarefas diárias/semanais/mensais**
- **Calendário** (mês/semana) com marcações de concluídas/pendentes
- **Recorrência avançada** via `RRULE` + exceções (`exdates`)
- **Cópia para outra data** (com seletor de data)
- **Concluir / desmarcar** por instância de data
- **Excluir** tarefa (somente esta / toda a série / ocorrência do dia)
- **Gamificação**: +10 pontos por conclusão, streak diário, badges
- **Relatório diário** com taxa de conclusão + **Exportar PDF**
- **Notificações** de pendências (2/2h) — *requer Dev Client/Build*
- **Tema** minimalista com tokens centralizados (`theme.js`)
- **UI/Safe Area/Teclado**: margens seguras e dismiss ao tocar fora

---

## 🧱 Tecnologias

- **Expo SDK 54**
- **React Navigation** (Bottom Tabs + Native Stack)
- **AsyncStorage** (persistência local)
- **rrule** (recorrência avançada)
- **expo-notifications**, **expo-task-manager** (lembretes)
- **expo-print**, **expo-sharing** (PDF e compartilhamento)
- **react-native-calendars** (visão mensal com “dots”)
- **date-fns** (datas utilitárias)

---

## 📁 Estrutura (resumo)

