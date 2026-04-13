import { configureStore, combineSlices } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { rtkApi } from '@/shared/api/rtkApi';
import { authSlice } from '@/features/auth/model/authSlice';
import { listenerMiddleware } from './listenerMiddleware';

const rootReducer = combineSlices(authSlice, rtkApi);

export type LazyState = object;
declare module '@reduxjs/toolkit' {
  interface LazyLoadedSlicesState extends LazyState {}
}

export const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .prepend(listenerMiddleware.middleware)
        .concat(rtkApi.middleware),
    preloadedState,
    devTools: import.meta.env.DEV,
  });

export const store = setupStore();

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
