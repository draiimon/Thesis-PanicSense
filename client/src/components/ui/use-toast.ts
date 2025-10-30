// Simple toast hook to make maintenance component work
import { useState } from "react";

type ToastProps = {
  title: string;
  description: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  const toast = (props: ToastProps) => {
    setToasts((prevToasts) => [...prevToasts, props]);
    console.log(`Toast: ${props.title} - ${props.description}`);
    
    // For now, we'll use the built-in toast from the main application
    // This is just a placeholder to make the component compile
    if (typeof window !== 'undefined') {
      try {
        // Access any global toast function if available
        const globalToast = (window as any).toast;
        if (typeof globalToast === 'function') {
          globalToast(props);
        }
      } catch (e) {
        console.error('Error showing toast:', e);
      }
    }
  };
  
  return { toast, toasts };
}