import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './store';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = Parameters<
  typeof listenerMiddleware.startListening
>[0] & {
  getState: () => RootState;
  dispatch: AppDispatch;
};

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();
