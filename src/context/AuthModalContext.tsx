"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

interface AuthModalContextValue {
  isOpen: boolean;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  onSuccessRef: React.RefObject<(() => void) | null>;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const onSuccessRef = useRef<(() => void) | null>(null);

  const openAuthModal = useCallback((onSuccess?: () => void) => {
    onSuccessRef.current = onSuccess ?? null;
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    onSuccessRef.current = null;
  }, []);

  return (
    <AuthModalContext.Provider
      value={{ isOpen, openAuthModal, closeAuthModal, onSuccessRef }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx)
    throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
