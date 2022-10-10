import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

export default function App() {
  const [quotes, setQuotes] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);

  const apiUrl = "https://type.fit/api/quotes";

  const notificationListener = useRef();
  const responseListener = useRef();

  const randomNumber = Math.floor(Math.random() * 100);
  const randomQuote = quotes[randomNumber]?.text;

  useEffect(() => {
    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => setQuotes(data));
  }, []);

  useEffect(() => {
    schedulePushNotification(quotes[randomNumber]?.text);
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>
        <Text> {randomQuote}</Text>
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

async function schedulePushNotification(quote) {
  const trigger = new Date(Date.now() + 24 * 60 * 60 * 1000);
  trigger.setMinutes(0);
  trigger.setSeconds(0);
  trigger.setHours(9);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily quote",
      body: quote,
    },
    trigger: { timezone: "Europe/Tallinn" },
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
