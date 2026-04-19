"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AdminStepUpResponse, ApiError } from "@/types";

interface PendingAction {
  action: () => Promise<void>;
  fallbackMessage: string;
}

function isStepUpError(error: unknown) {
  return (error as Partial<ApiError> | null)?.error === "Step-up authentication required";
}

export function useAdminStepUp() {
  const { showToast } = useToast();
  const pendingActionRef = useRef<PendingAction | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetModal = useCallback(() => {
    setIsOpen(false);
    setPassword("");
    setErrorMessage("");
    pendingActionRef.current = null;
  }, []);

  const runWithStepUp = useCallback(
    async (action: () => Promise<void>, fallbackMessage = "Action failed") => {
      try {
        await action();
      } catch (error) {
        if (isStepUpError(error)) {
          pendingActionRef.current = { action, fallbackMessage };
          setPassword("");
          setErrorMessage("");
          setIsOpen(true);
          return;
        }

        showToast(getApiErrorMessage(error, fallbackMessage), "error");
      }
    },
    [showToast]
  );

  const submitStepUp = useCallback(async () => {
    const pendingAction = pendingActionRef.current;

    if (!pendingAction) {
      return;
    }

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setErrorMessage("Password is required");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await api.post<AdminStepUpResponse>("/admin/security/step-up", {
        password: trimmedPassword,
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to confirm password"));
      setLoading(false);
      return;
    }

    showToast("Sensitive action unlocked");
    setErrorMessage("");

    try {
      await pendingAction.action();
      setIsOpen(false);
      setPassword("");
      setErrorMessage("");
      pendingActionRef.current = null;
    } catch (error) {
      if (isStepUpError(error)) {
        pendingActionRef.current = pendingAction;
        setPassword("");
        setErrorMessage("Step-up verification expired. Please try again.");
        setIsOpen(true);
      } else {
        setIsOpen(false);
        setPassword("");
        setErrorMessage("");
        pendingActionRef.current = null;
        showToast(getApiErrorMessage(error, pendingAction.fallbackMessage), "error");
      }
    } finally {
      setLoading(false);
    }
  }, [password, showToast]);

  return {
    runWithStepUp,
    modalProps: {
      isOpen,
      password,
      onPasswordChange: setPassword,
      onSubmit: submitStepUp,
      onClose: resetModal,
      loading,
      errorMessage,
    },
  };
}
