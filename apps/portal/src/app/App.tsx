import { Provider as ReduxProvider } from 'react-redux';
import { RouterProvider } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '@/features/auth';
import { store } from './providers/store';
import { router } from './router/router';
import { i18n } from './providers/i18n';

export function App() {
  return (
    <ReduxProvider store={store}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </I18nextProvider>
    </ReduxProvider>
  );
}
