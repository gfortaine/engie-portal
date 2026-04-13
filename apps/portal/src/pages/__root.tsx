import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppLayout } from '@/widgets/layout/AppLayout';
import { AssistantWidget } from '@/features/ai-assistant';
import { LoginPage, useAppAuth } from '@/features/auth';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated } = useAppAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Outlet />
      <AssistantWidget />
    </AppLayout>
  );
}
