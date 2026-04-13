import { useState, useRef, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useTranslation } from 'react-i18next';
import { useLocation } from '@tanstack/react-router';
import {
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

export function AssistantWidget() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic transport with session ID in body
  const transportRef = useRef(
    new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        ...(sessionId ? { sessionId } : {}),
        userId: 'demo-user',
      }),
    }),
  );

  // Update transport body when sessionId changes
  useEffect(() => {
    transportRef.current = new DefaultChatTransport({
      api: '/api/chat',
      body: { ...(sessionId ? { sessionId } : {}), userId: 'demo-user' },
    });
  }, [sessionId]);

  const {
    messages,
    sendMessage,
    addToolApprovalResponse,
    status,
    setMessages,
  } = useChat({
    transport: transportRef.current,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

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
                }}
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
              >
                +
              </button>
            )}
            <button
              className="genie-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="genie-panel__messages">
          {messages.length === 0 ? (
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
                    <span className="genie-suggestion__arrow">→</span>
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
                                onClick={() => addToolApprovalResponse({ id: toolPart.toolCallId, approved: true })}
                              >
                                ✓ Confirmer
                              </button>
                              <button
                                className="genie-approval__btn genie-approval__btn--reject"
                                onClick={() => addToolApprovalResponse({ id: toolPart.toolCallId, approved: false })}
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
              ➤
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
