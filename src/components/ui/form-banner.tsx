import { Alert } from "@heroui/react";

import type { ActionResult } from "@/lib/types";

/** Renders the outcome of a Server Action above a form. */
export function FormBanner({ state }: { state: ActionResult | null }) {
  if (!state) return null;

  if (!state.ok) {
    return (
      <Alert status="danger">
        <Alert.Content>
          <Alert.Title>{state.error}</Alert.Title>
          {state.fieldErrors ? (
            <Alert.Description>
              {Object.values(state.fieldErrors).flat().slice(0, 3).join(" · ")}
            </Alert.Description>
          ) : null}
        </Alert.Content>
      </Alert>
    );
  }

  if (!state.message) return null;

  return (
    <Alert status="success">
      <Alert.Content>
        <Alert.Title>{state.message}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
}
