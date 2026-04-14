/**
 * A2UIDashboard — Renders A2UI v0.9 messages using the ENGIE Fluid DS catalog.
 *
 * Used as a GenUI component for the `renderDashboard` tool.
 * Receives A2UI messages from Gemini, processes them through
 * MessageProcessor, and renders via A2uiSurface with Fluid DS components.
 */
import { useState, useEffect, useMemo } from 'react';
import { A2uiSurface } from '@a2ui/react/v0_9';
import { MessageProcessor } from '@a2ui/web_core/v0_9';
import type { SurfaceModel } from '@a2ui/web_core/v0_9';
import type { ReactComponentImplementation } from '@a2ui/react/v0_9';
import { engieCatalog } from './engie-catalog';
import './a2ui-dashboard.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type A2UIMessage = Record<string, any>;

interface A2UIDashboardProps {
  data: {
    messages: A2UIMessage[];
  } | A2UIMessage[];
}

export function A2UIDashboard({ data }: A2UIDashboardProps) {
  const messages = Array.isArray(data) ? data : data?.messages ?? [];
  const [surface, setSurface] = useState<SurfaceModel<ReactComponentImplementation> | null>(null);

  const processor = useMemo(() => {
    return new MessageProcessor<ReactComponentImplementation>([engieCatalog]);
  }, []);

  useEffect(() => {
    if (!messages.length) return;

    const sub = processor.onSurfaceCreated(
      (s: SurfaceModel<ReactComponentImplementation>) => {
        setSurface(s);
      },
    );

    try {
      // Cast messages since the internal type is complex
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processor.processMessages(messages as any);
    } catch (err) {
      console.error('[A2UI] Error processing messages:', err);
    }

    // Check if surface was already created
    const first = processor.model.surfacesMap.values().next().value;
    if (first && !surface) {
      setSurface(first as SurfaceModel<ReactComponentImplementation>);
    }

    return () => sub.unsubscribe();
  }, [messages, processor, surface]);

  if (!surface) {
    return (
      <div className="a2ui-dashboard a2ui-dashboard--loading">
        <div className="a2ui-dashboard__placeholder">
          Chargement du tableau de bord...
        </div>
      </div>
    );
  }

  return (
    <div className="a2ui-dashboard">
      <A2uiSurface surface={surface} />
    </div>
  );
}
