import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useTranslation } from 'react-i18next';
import {
  NJButton,
  NJIcon,
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

const SUGGESTED_PROMPTS = [
  { icon: '📊', text: 'Analyse ma consommation électrique', category: 'consumption' },
  { icon: '📄', text: 'Explique ma dernière facture', category: 'billing' },
  { icon: '⚡', text: 'Compare mes contrats', category: 'contracts' },
  { icon: '🔔', text: 'Quelles sont mes alertes ?', category: 'alerts' },
  { icon: '💡', text: 'Comment économiser ?', category: 'savings' },
];

const chatTransport = new DefaultChatTransport({ api: '/api/chat' });

// ENGIenie branded SVG icon
function EngienieIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
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
        <linearGradient id="engieniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00AAFF" />
          <stop offset="50%" stopColor="#23D2B5" />
          <stop offset="100%" stopColor="#00AAFF" />
        </linearGradient>
      </defs>
      {/* Outer glow ring */}
      <circle cx="16" cy="16" r="15" stroke="url(#engieniGrad)" strokeWidth="1.5" fill="none" opacity="0.3" />
      {/* Main circle */}
      <circle cx="16" cy="16" r="12" fill="url(#engieniGrad)" />
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
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    transport: chatTransport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

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
        className={`engianie-tab ${isOpen ? 'engianie-tab--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fermer ENGIenie' : 'Ouvrir ENGIenie'}
        title="ENGIenie — votre assistant énergie"
      >
        <EngienieIcon size={20} />
        <span className="engianie-tab__label">ENGIenie</span>
        {!isOpen && messages.length > 0 && (
          <NJBadge
            className="engianie-tab__badge"
          >
            {messages.filter(m => m.role === 'assistant').length}
          </NJBadge>
        )}
      </button>

      {/* Slide-out Sidebar Panel */}
      <aside
        className={`engianie-panel ${isOpen ? 'engianie-panel--open' : ''}`}
        aria-label="ENGIenie assistant"
        role="complementary"
      >
        {/* Header */}
        <div className="engianie-panel__header">
          <div className="engianie-panel__header-brand">
            <EngienieIcon size={28} />
            <div className="engianie-panel__header-text">
              <h2 className="engianie-panel__title">ENGIenie</h2>
              <span className="engianie-panel__subtitle">
                {isLoading ? (
                  <span className="engianie-status engianie-status--active">
                    <span className="engianie-status__dot" />
                    Réflexion en cours…
                  </span>
                ) : (
                  <span className="engianie-status">
                    <span className="engianie-status__dot engianie-status__dot--online" />
                    Assistant énergie IA
                  </span>
                )}
              </span>
            </div>
          </div>
          <NJButton
            // @ts-expect-error Fluid DS v6 types
            variant="subtle"
            size="sm"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer"
          >
            {/* @ts-expect-error Fluid DS v6 types */}
            <NJIcon name="close" size="20" />
          </NJButton>
        </div>

        {/* Messages */}
        <div className="engianie-panel__messages">
          {messages.length === 0 ? (
            <div className="engianie-panel__welcome">
              <div className="engianie-panel__welcome-icon">
                <EngienieIcon size={48} />
              </div>
              <h3>Bonjour Marie ! 👋</h3>
              <p>
                Je suis <strong>ENGIenie</strong>, votre assistant énergie intelligent.
                Posez-moi des questions sur vos contrats, factures ou consommation.
              </p>
              <div className="engianie-panel__suggestions">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    className="engianie-suggestion"
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                  >
                    <span className="engianie-suggestion__icon">{prompt.icon}</span>
                    <span className="engianie-suggestion__text">{prompt.text}</span>
                    {/* @ts-expect-error Fluid DS v6 types */}
                    <NJIcon name="arrow_forward" size="16" className="engianie-suggestion__arrow" />
                  </button>
                ))}
              </div>
              <p className="engianie-panel__powered">
                Propulsé par Gemini · Données sécurisées
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`engianie-message engianie-message--${message.role}`}
              >
                {message.role === 'assistant' && (
                  <div className="engianie-message__avatar">
                    <EngienieIcon size={20} />
                  </div>
                )}

                <div className="engianie-message__content">
                  {message.parts?.map((part, index) => {
                    if (part.type === 'text' && 'text' in part) {
                      const text = part.text as string;
                      if (!text.trim()) return null;
                      return (
                        <div key={`${message.id}-${index}`} className="engianie-message__text">
                          {text.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      );
                    }

                    if (part.type.startsWith('tool-')) {
                      const toolPart = part as { type: string; toolCallId: string; toolName: string; state: string; args?: unknown; result?: unknown };
                      const Component = toolComponentMap[toolPart.toolName];

                      if (toolPart.state === 'call' || toolPart.state === 'partial-call') {
                        return <ToolSkeleton key={toolPart.toolCallId} toolName={toolPart.toolName} />;
                      }

                      if (toolPart.state === 'result' && Component) {
                        return <Component key={toolPart.toolCallId} data={toolPart.result} />;
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
            <div className="engianie-message engianie-message--assistant">
              <div className="engianie-message__avatar">
                <EngienieIcon size={20} />
              </div>
              <div className="engianie-message__typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          id="engianie-form"
          className="engianie-panel__input"
          onSubmit={handleSubmit}
        >
          <div className="engianie-panel__input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('common.assistant_placeholder', 'Posez votre question...')}
              className="engianie-panel__textarea"
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              className="engianie-panel__send"
              disabled={isLoading || !input.trim()}
              aria-label="Envoyer"
            >
              {/* @ts-expect-error Fluid DS v6 types */}
              <NJIcon name="send" size="18" />
            </button>
          </div>
          <p className="engianie-panel__disclaimer">
            ENGIenie peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </form>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="engianie-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
