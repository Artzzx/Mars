import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#1a1a1f',
          border: '1px solid #2a2a35',
          color: '#fff',
        },
      }}
    />
  );
}
