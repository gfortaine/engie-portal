import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';
import { setupStore, type RootState } from '@/app/providers/store';

interface RenderWithProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
}

export function renderWithProvider(
  ui: ReactNode,
  { preloadedState, ...renderOptions }: RenderWithProviderOptions = {},
) {
  const store = setupStore(preloadedState);

  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
