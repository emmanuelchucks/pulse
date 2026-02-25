import { Alert } from "react-native";

export function showSaveErrorAlert() {
  Alert.alert("Update failed", "Could not save your changes. Please try again.");
}
