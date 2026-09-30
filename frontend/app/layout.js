import './globals.css';
import { AppProvider } from '../context/AppContext';
import ToastNotification from '../components/ToastNotification';

export const metadata = {
  title: 'Smart Task Manager | Immverse AI',
  description: 'In-memory real-time state driven task manager with dependency validation, user assignment, and interactive views.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
          <ToastNotification />
        </AppProvider>
      </body>
    </html>
  );
}
