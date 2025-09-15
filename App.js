// App.js
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TasksProvider } from "./src/context/TasksContext";
import CalendarScreen from "./src/screens/CalendarScreen";
import EditTaskScreen from "./src/screens/EditTaskScreen";
import ReportScreen from "./src/screens/ReportScreen";
import TodayScreen from "./src/screens/TodayScreen";
import { setupNotifications } from "./src/service/notifications";
import { theme } from "./src/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Hoje" component={TodayScreen} />
      <Tab.Screen name="Calendário" component={CalendarScreen} />
      <Tab.Screen name="Relatório" component={ReportScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // Em Expo Go, push remoto não funciona; mantenho try/catch para não quebrar
    (async () => {
      try {
        await setupNotifications?.();
      } catch (e) {
        console.log("Notifications disabled in Expo Go:", String(e));
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <TasksProvider>
        <NavigationContainer
          theme={{
            ...DefaultTheme,
            colors: { ...DefaultTheme.colors, background: theme?.bg || "#fff" },
          }}
        >
          <Stack.Navigator>
            <Stack.Screen
              name="HomeTabs"
              component={Tabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditarTarefa"
              component={EditTaskScreen}
              options={{ title: "Tarefa" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </TasksProvider>
    </SafeAreaProvider>
  );
}
