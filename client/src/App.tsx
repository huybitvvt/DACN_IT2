import { AuthProvider } from '@/context/AuthContext';
import AppRouter from '@/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
