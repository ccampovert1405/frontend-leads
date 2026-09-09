import React, { createContext, useContext, useRef } from 'react';
import { Toast, ToastMessage } from 'primereact/toast';

interface ToastContextType {
  showSuccess: (summary: string, detail?: string) => void;
  showError: (summary: string, detail?: string) => void;
  showWarn: (summary: string, detail?: string) => void;
  showInfo: (summary: string, detail?: string) => void;
  showToast: (message: ToastMessage | ToastMessage[]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toastRef = useRef<Toast>(null);
  const lastToastRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  const shouldThrottle = (severity: string, summary: string, detail?: string): boolean => {
    const key = `${severity}:${summary}:${detail || ''}`;
    const now = Date.now();
    if (lastToastRef.current.key === key && now - lastToastRef.current.time < 1800) {
      return true;
    }
    lastToastRef.current = { key, time: now };
    return false;
  };

  const showToast = (message: ToastMessage | ToastMessage[]) => {
    toastRef.current?.show(message);
  };

  const showSuccess = (summary: string, detail?: string) => {
    if (shouldThrottle('success', summary, detail)) return;
    toastRef.current?.show({
      severity: 'success',
      summary,
      detail,
      life: 4500,
    });
  };

  const showError = (summary: string, detail?: string) => {
    if (shouldThrottle('error', summary, detail)) return;
    toastRef.current?.show({
      severity: 'error',
      summary,
      detail: detail || 'Ocurrió un error inesperado.',
      life: 6000,
    });
  };

  const showWarn = (summary: string, detail?: string) => {
    if (shouldThrottle('warn', summary, detail)) return;
    toastRef.current?.show({
      severity: 'warn',
      summary,
      detail,
      life: 5500,
    });
  };

  const showInfo = (summary: string, detail?: string) => {
    if (shouldThrottle('info', summary, detail)) return;
    toastRef.current?.show({
      severity: 'info',
      summary,
      detail,
      life: 4000,
    });
  };

  return (
    <ToastContext.Provider
      value={{
        showSuccess,
        showError,
        showWarn,
        showInfo,
        showToast,
      }}
    >
      <Toast ref={toastRef} position="top-right" className="app-global-toast" />
      {children}
    </ToastContext.Provider>
  );
};

export const useAppToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAppToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};
