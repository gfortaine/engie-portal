import { useState, useRef, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useTranslation } from 'react-i18next';
import { useLocation } from '@tanstack/react-router';
import {
  NJIcon,
  NJIconButton,
  NJBadge,
} from '@engie-group/fluid-design-system-react';
import {
  BillBreakdownCard,
  ConsumptionInsightChart,
  ContractComparisonTable,
  ContractResultList,
  AlertsPanel,
  SavingsRecommendation,
  ToolSkeleton,
} from './genui';
import './genui/genui.css';
import './AssistantWidget.css';

// Maps tool names to their generative UI components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toolComponentMap: Record<string, React.ComponentType<{ data: any }>> = {
  explainBill: BillBreakdownCard,
  analyzeConsumption: ConsumptionInsightChart,
  compareContracts: ContractComparisonTable,
  findContract: ContractResultList,
  getAlerts: AlertsPanel,
  suggestSavings: SavingsRecommendation,
};

// ── Context-aware suggestions per route ────────────────────────────
type SuggestionItem = { icon: string; text: string };

const ROUTE_SUGGESTIONS: Record<string, SuggestionItem[]> = {
  '/': [
    { icon: '📊', text: 'Résume mon tableau de bord' },
    { icon: '🔔', text: 'Quelles sont mes alertes ?' },
    { icon: '💡', text: 'Comment économiser ?' },
  ],
  '/contracts': [
    { icon: '⚡', text: 'Compare mes contrats' },
    { icon: '🔍', text: 'Trouve mon contrat électricité' },
    { icon: '📋', text: 'Détaille mon contrat gaz' },
  ],
  '/invoices': [
    { icon: '📄', text: 'Explique ma dernière facture' },
    { icon: '💰', text: 'Pourquoi ma facture a augmenté ?' },
    { icon: '📊', text: 'Historique de mes factures' },
  ],
  '/consumption': [
    { icon: '📊', text: 'Analyse ma consommation électrique' },
    { icon: '📉', text: 'Tendance de consommation ce mois' },
    { icon: '💡', text: 'Conseils pour réduire ma conso' },
  ],
};

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { icon: '📊', text: 'Analyse ma consommation électrique' },
  { icon: '📄', text: 'Explique ma dernière facture' },
  { icon: '⚡', text: 'Compare mes contrats' },
  { icon: '🔔', text: 'Quelles sont mes alertes ?' },
  { icon: '💡', text: 'Comment économiser ?' },
];

// Génie branded SVG icon
function GenieIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="genieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00AAFF" />
          <stop offset="50%" stopColor="#23D2B5" />
          <stop offset="100%" stopColor="#00AAFF" />
        </linearGradient>
      </defs>
      {/* Outer glow ring */}
      <circle cx="16" cy="16" r="15" stroke="url(#genieGrad)" strokeWidth="1.5" fill="none" opacity="0.3" />
      {/* Main circle */}
      <circle cx="16" cy="16" r="12" fill="url(#genieGrad)" />
      {/* Lightning bolt — energy + AI */}
      <path d="M18 8L12 17h4l-2 7 6-9h-4l2-7z" fill="white" fillOpacity="0.95" />
      {/* Sparkle dots */}
      <circle cx="9" cy="10" r="1" fill="white" fillOpacity="0.6" />
      <circle cx="23" cy="22" r="1" fill="white" fillOpacity="0.6" />
      <circle cx="7" cy="20" r="0.7" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

const SESSION_STORAGE_KEY = 'genie-session-id';
const SESSION_HISTORY_KEY = 'genie-sessions';
const SESSION_TITLES_KEY = 'genie-session-titles';

/** Cached session titles (sessionId → short title) */
function getTitleCache(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_TITLES_KEY) ?? '{}');
  } catch { return {}; }
}

function setTitleCache(sessionId: string, title: string) {
  const cache = getTitleCache();
  cache[sessionId] = title;
  sessionStorage.setItem(SESSION_TITLES_KEY, JSON.stringify(cache));
}

/** Convert Vertex AI session events to AI SDK UIMessage format */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eventsToMessages(events: Array<{ author: string; content: { parts: Array<{ text: string }> } }>): Array<{ id: string; role: 'user' | 'assistant'; parts: Array<any> }> {
  return events.map((evt, i) => {
    const rawText = evt.content.parts.map(p => p.text).join('\n');
    const role = evt.author === 'user' ? 'user' as const : 'assistant' as const;

    // Detect JSON-encoded events (rich messages with tool results)
    if (rawText.startsWith('__json:')) {
      try {
        const parsed = JSON.parse(rawText.slice(7));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [];
        // Add text part if present
        if (parsed.text) {
          parts.push({ type: 'text', text: parsed.text });
        }
        // Restore tool call parts for genui rendering
        for (const tr of parsed.toolResults ?? []) {
          parts.push({
            type: `tool-${tr.toolName}`,
            toolCallId: `restored-tc-${i}-${tr.toolName}`,
            toolName: tr.toolName,
            state: 'output-available',
            output: tr.result,
          });
        }
        return { id: `restored-${i}`, role, parts: parts.length ? parts : [{ type: 'text', text: '' }] };
      } catch {
        // Fallback to plain text if JSON parsing fails
      }
    }

    return {
      id: `restored-${i}`,
      role,
      parts: evt.content.parts.map(p => ({ type: 'text' as const, text: p.text })),
    };
  });
}

export function AssistantWidget() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_STORAGE_KEY),
  );
  const [isRestoring, setIsRestoring] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionList, setSessionList] = useState<Array<{ id: string; createTime: string; preview: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist sessionId to sessionStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [sessionId]);

  // Custom fetch wrapper to capture X-Session-Id from responses
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const wrappedFetch = useCallback(async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await fetch(url, init);
    const newSessionId = response.headers.get('X-Session-Id');
    if (newSessionId && newSessionId !== sessionIdRef.current) {
      setSessionId(newSessionId);
    }
    return response;
  }, []);

  // Single transport using ref-based body — always reads latest sessionId
  const transport = useRef(
    new DefaultChatTransport({
      api: '/api/chat',
      fetch: wrappedFetch,
      body: () => ({
        ...(sessionIdRef.current ? { sessionId: sessionIdRef.current } : {}),
        userId: 'demo-user',
      }),
    }),
  ).current;

  const {
    messages,
    sendMessage,
    addToolApprovalResponse,
    status,
    setMessages,
  } = useChat({
    transport,
    // Auto-send after tool approval response (HITL flow)
    sendAutomaticallyWhen: ({ messages: msgs }) => {
      if (!msgs?.length) return false;
      const lastMsg = msgs[msgs.length - 1];
      if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.parts) return false;
      // Send when all tool parts have been responded to (no pending approvals)
      return lastMsg.parts.some(
        (p) => 'state' in p && p.state === 'approval-responded',
      );
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // ── Session resume: restore conversation from Vertex AI on mount ──
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!storedSessionId) return;

    setIsRestoring(true);
    fetch(`/api/sessions?sessionId=${encodeURIComponent(storedSessionId)}`)
      .then(res => {
        if (!res.ok) throw new Error(`Session ${storedSessionId} not found`);
        return res.json();
      })
      .then(data => {
        if (data.events?.length) {
          setMessages(eventsToMessages(data.events));
        }
      })
      .catch(() => {
        // Session expired or deleted — start fresh
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionId(null);
      })
      .finally(() => setIsRestoring(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // ── Generate session title after first exchange ──
  const titleGeneratedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      status === 'ready' &&
      sessionId &&
      messages.length === 2 &&
      !isRestoring &&
      titleGeneratedRef.current !== sessionId
    ) {
      // First exchange complete — generate AI title
      const firstUserText = messages[0]?.parts
        ?.filter((p: { type: string }) => p.type === 'text')
        ?.map((p: { type: string; text?: string }) => ('text' in p ? p.text : ''))
        ?.join(' ') ?? '';

      if (firstUserText) {
        titleGeneratedRef.current = sessionId;
        fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: firstUserText }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.title) {
              setTitleCache(sessionId, data.title);
            }
          })
          .catch(() => { /* ignore title generation failure */ });
      }
    }
  }, [status, sessionId, messages, isRestoring]);

  // ── Load session list for history drawer ──
  const loadSessionList = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions?userId=demo-user');
      if (!res.ok) return;
      const data = await res.json();
      const titleCache = getTitleCache();
      const sessions = await Promise.all(
        (data.sessions ?? []).map(async (s: { name: string; createTime: string }) => {
          const parts = s.name.split('/');
          const id = parts[parts.length - 1] ?? s.name;

          // 1. Check title cache first
          if (titleCache[id]) {
            return { id, createTime: s.createTime, preview: titleCache[id] };
          }

          // 2. Fetch first user event for preview
          let preview = '';
          try {
            const evtRes = await fetch(`/api/sessions?sessionId=${encodeURIComponent(id)}`);
            if (evtRes.ok) {
              const evtData = await evtRes.json();
              const firstUserEvent = evtData.events?.find(
                (e: { author: string }) => e.author === 'user',
              );
              if (firstUserEvent) {
                const text = firstUserEvent.content?.parts?.[0]?.text ?? '';
                // Generate AI title in background
                fetch('/api/sessions', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userMessage: text }),
                })
                  .then(r => r.json())
                  .then(d => { if (d.title) setTitleCache(id, d.title); })
                  .catch(() => {});
                preview = text.length > 40 ? text.slice(0, 37) + '…' : text;
              }
            }
          } catch { /* ignore */ }
          return { id, createTime: s.createTime, preview };
        }),
      );
      setSessionList(sessions);
    } catch {
      // silently ignore
    }
  }, []);

  // Load session history on first drawer open
  useEffect(() => {
    if (showHistory) loadSessionList();
  }, [showHistory, loadSessionList]);

  // Switch to a different session from history
  const switchToSession = useCallback(async (targetSessionId: string) => {
    setIsRestoring(true);
    setShowHistory(false);
    try {
      const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(targetSessionId)}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      setSessionId(targetSessionId);
      setMessages(data.events?.length ? eventsToMessages(data.events) : []);
    } catch {
      // Session gone — ignore
    } finally {
      setIsRestoring(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete a session from history
  const deleteSessionFromHistory = useCallback(async (targetSessionId: string) => {
    try {
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: targetSessionId }),
      });
      setSessionList(prev => prev.filter(s => s.id !== targetSessionId));
      // If we deleted the active session, reset
      if (targetSessionId === sessionId) {
        setSessionId(null);
        setMessages([]);
      }
    } catch {
      // silently ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Context-aware suggestions based on current route
  const currentSuggestions = ROUTE_SUGGESTIONS[location.pathname] ?? DEFAULT_SUGGESTIONS;

  // Cmd+K / Ctrl+K shortcut to toggle sidebar
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleOpen();
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    await sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestedPrompt = async (text: string) => {
    setInput('');
    await sendMessage({ text });
  };

  return (
    <>
      {/* Sidebar Tab Toggle — always visible on right edge */}
      <button
        className={`genie-tab ${isOpen ? 'genie-tab--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fermer Génie' : 'Ouvrir Génie'}
        title="Génie by ENGIE — votre assistant énergie (⌘K)"
      >
        <GenieIcon size={20} />
        <span className="genie-tab__label">Génie</span>
        {!isOpen && messages.length > 0 && (
          <NJBadge
            className="genie-tab__badge"
          >
            {messages.filter(m => m.role === 'assistant').length}
          </NJBadge>
        )}
      </button>

      {/* Slide-out Sidebar Panel */}
      <aside
        className={`genie-panel ${isOpen ? 'genie-panel--open' : ''}`}
        aria-label="Génie assistant"
        role="complementary"
      >
        {/* Header */}
        <div className="genie-panel__header">
          <div className="genie-panel__header-brand">
            <GenieIcon size={28} />
            <div className="genie-panel__header-text">
              <h2 className="genie-panel__title">Génie <span className="genie-panel__title-brand">by ENGIE</span></h2>
              <span className="genie-panel__subtitle">
                {isLoading ? (
                  <span className="genie-status genie-status--active">
                    <span className="genie-status__dot" />
                    Réflexion en cours…
                  </span>
                ) : (
                  <span className="genie-status">
                    <span className="genie-status__dot genie-status__dot--online" />
                    Assistant énergie IA
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="genie-panel__header-actions">
            {messages.length > 0 && (
              <button
                className="genie-new-chat"
                onClick={() => {
                  setMessages([]);
                  setSessionId(null);
                  setShowHistory(false);
                }}
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                +
              </button>
            )}
            <NJIconButton icon="history" variant="inverse" scale="sm" onClick={() => setShowHistory(prev => !prev)} aria-label="Historique" title="Historique des conversations" />
            <NJIconButton icon="close" variant="inverse" scale="sm" onClick={() => setIsOpen(false)} aria-label="Fermer" title="Fermer" />
          </div>
        </div>

        {/* Session History Drawer */}
        {showHistory && (
          <div className="genie-history">
            <div className="genie-history__header">
              <h3 className="genie-history__title">Conversations récentes</h3>
              <button className="genie-history__close" onClick={() => setShowHistory(false)} aria-label="Fermer l'historique">✕</button>
            </div>
            <div className="genie-history__list">
              {sessionList.length === 0 ? (
                <p className="genie-history__empty">Aucune conversation enregistrée</p>
              ) : (
                sessionList.map(s => (
                  <div
                    key={s.id}
                    className={`genie-history__item ${s.id === sessionId ? 'genie-history__item--active' : ''}`}
                  >
                    <button
                      className="genie-history__item-btn"
                      onClick={() => switchToSession(s.id)}
                    >
                      <span className="genie-history__item-date">
                        {new Date(s.createTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="genie-history__item-preview">{s.preview || 'Conversation sans titre'}</span>
                    </button>
                    <button
                      className="genie-history__item-delete"
                      onClick={() => deleteSessionFromHistory(s.id)}
                      aria-label="Supprimer"
                      title="Supprimer cette conversation"
                    >
                      {/* @ts-expect-error Fluid DS v6 types */}
                      <NJIcon name="delete" size="16" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="genie-panel__messages">
          {isRestoring ? (
            <div className="genie-panel__welcome">
              <div className="genie-panel__welcome-icon">
                <GenieIcon size={48} />
              </div>
              <p>Restauration de la conversation…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="genie-panel__welcome">
              <div className="genie-panel__welcome-icon">
                <GenieIcon size={48} />
              </div>
              <h3>Bonjour Marie ! 👋</h3>
              <p>
                Je suis <strong>Génie</strong>, votre assistant énergie intelligent.
                Posez-moi des questions sur vos contrats, factures ou consommation.
              </p>
              <div className="genie-panel__suggestions">
                {currentSuggestions.map((prompt) => (
                  <button
                    key={prompt.text}
                    className="genie-suggestion"
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                  >
                    <span className="genie-suggestion__icon">{prompt.icon}</span>
                    <span className="genie-suggestion__text">{prompt.text}</span>
                    {/* @ts-expect-error Fluid DS v6 types */}
                    <NJIcon name="arrow_forward" size="16" className="genie-suggestion__arrow" />
                  </button>
                ))}
              </div>
              <p className="genie-panel__powered">
                Propulsé par Gemini · Données sécurisées
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`genie-message genie-message--${message.role}`}
              >
                {message.role === 'assistant' && (
                  <div className="genie-message__avatar">
                    <GenieIcon size={20} />
                  </div>
                )}

                <div className="genie-message__content">
                  {message.parts?.map((part, index) => {
                    if (part.type === 'text' && 'text' in part) {
                      const text = part.text as string;
                      if (!text.trim()) return null;
                      return (
                        <div key={`${message.id}-${index}`} className="genie-message__text">
                          {text.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      );
                    }

                    if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                      const toolPart = part as {
                        type: string;
                        toolCallId: string;
                        toolName?: string;
                        state: string;
                        input?: unknown;
                        output?: unknown;
                        approval?: { id: string; approved?: boolean; reason?: string };
                      };
                      // Extract tool name from type (e.g. "tool-getAlerts" → "getAlerts")
                      const toolName = toolPart.toolName ?? toolPart.type.replace('tool-', '');
                      const Component = toolComponentMap[toolName];

                      if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
                        return <ToolSkeleton key={toolPart.toolCallId} toolName={toolName} />;
                      }

                      // Human-in-the-loop: approval requested
                      if (toolPart.state === 'approval-requested') {
                        return (
                          <div key={toolPart.toolCallId} className="genie-approval">
                            <div className="genie-approval__header">
                              <span className="genie-approval__icon">🔐</span>
                              <span>Action nécessitant votre approbation</span>
                            </div>
                            <div className="genie-approval__tool">
                              <strong>{toolName === 'suggestSavings' ? 'Optimisation contrat' : toolName}</strong>
                              {toolPart.input != null && (
                                <pre className="genie-approval__args">
                                  {JSON.stringify(toolPart.input as Record<string, unknown>, null, 2)}
                                </pre>
                              )}
                            </div>
                            <div className="genie-approval__actions">
                              <button
                                className="genie-approval__btn genie-approval__btn--confirm"
                                onClick={() => addToolApprovalResponse({ id: toolPart.approval?.id ?? toolPart.toolCallId, approved: true })}
                              >
                                ✓ Confirmer
                              </button>
                              <button
                                className="genie-approval__btn genie-approval__btn--reject"
                                onClick={() => addToolApprovalResponse({ id: toolPart.approval?.id ?? toolPart.toolCallId, approved: false, reason: 'Refusé par l\'utilisateur' })}
                              >
                                ✕ Annuler
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (toolPart.state === 'output-available' && Component) {
                        return <Component key={toolPart.toolCallId} data={toolPart.output} />;
                      }
                    }

                    return null;
                  })}
                </div>
              </div>
            ))
          )}

          {/* Streaming indicator */}
          {isLoading && messages.length > 0 && (
            <div className="genie-message genie-message--assistant">
              <div className="genie-message__avatar">
                <GenieIcon size={20} />
              </div>
              <div className="genie-message__typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          id="genie-form"
          className="genie-panel__input"
          onSubmit={handleSubmit}
        >
          <div className="genie-panel__input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('common.assistant_placeholder', 'Posez votre question...')}
              className="genie-panel__textarea"
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              className="genie-panel__send"
              disabled={isLoading || !input.trim()}
              aria-label="Envoyer"
            >
              {/* @ts-expect-error Fluid DS v6 types */}
              <NJIcon name="send" size="18" />
            </button>
          </div>
          <p className="genie-panel__disclaimer">
            Génie peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </form>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="genie-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
