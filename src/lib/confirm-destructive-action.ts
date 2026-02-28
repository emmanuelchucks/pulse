import * as Haptics from "expo-haptics";
import { Alert, Platform } from "react-native";

type ConfirmDestructiveActionOptions = {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  haptics?: boolean;
};

export function confirmDestructiveAction({
  title,
  message,
  confirmText,
  onConfirm,
  haptics = true,
}: ConfirmDestructiveActionOptions) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: confirmText,
      style: "destructive",
      onPress: () => {
        if (haptics && Platform.OS === "ios") {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }
        onConfirm();
      },
    },
  ]);
}
