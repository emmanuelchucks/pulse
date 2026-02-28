import { showSaveErrorAlert } from "@/lib/save-error-alert";

export function runOrAlert(action: () => boolean): boolean {
  const ok = action();
  if (!ok) {
    showSaveErrorAlert();
  }
  return ok;
}
