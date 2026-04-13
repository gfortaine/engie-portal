import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppLayout } from '@/widgets/layout/AppLayout';
import { AssistantWidget } from '@/features/ai-assistant';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppLayout>
      <Outlet />
      <AssistantWidget />
    </AppLayout>
  );
}
