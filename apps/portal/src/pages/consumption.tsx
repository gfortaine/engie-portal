import { createFileRoute } from '@tanstack/react-router';
import { ConsumptionPage } from './consumption/-ConsumptionPage';

export const Route = createFileRoute('/consumption')({
  component: ConsumptionPage,
});
