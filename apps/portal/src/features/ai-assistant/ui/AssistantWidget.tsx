import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useTranslation } from 'react-i18next';
import {
  NJButton,
  NJIcon,
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
  { icon: '📊', text: 'Analyse ma consommation électrique' },
  { icon: '📄', text: 'Explique ma dernière facture' },
  { icon: '⚡', text: 'Compare mes contrats' },
  { icon: '🔔', text: 'Quelles sont mes alertes ?' },
  { icon: '💡', text: 'Comment économiser ?' },
];

const chatTransport = new DefaultChatTransport({ api: '/api/chat' });

export function AssistantWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage({ text });
  };

  const handleSuggestedPrompt = async (text: string) => {
    setInput('');
    await sendMessage({ text });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`assistant-fab ${isOpen ? 'assistant-fab--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant IA'}
      >
        {isOpen ? (
          // @ts-expect-error Fluid DS v6 types mismatch
          <NJIcon name="close" size="24" />
        ) : (
          <span className="assistant-fab__icon">🤖</span>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`assistant-panel ${isOpen ? 'assistant-panel--open' : ''}`}>
        {/* Header */}
        <div className="assistant-panel__header">
          <div className="assistant-panel__header-info">
            <span className="assistant-panel__avatar">🤖</span>
            <div>
              <h3 className="assistant-panel__title">Assistant ENGIE</h3>
              <span className="assistant-panel__status">
                {isLoading ? '✍️ Réflexion...' : '🟢 En ligne'}
              </span>
            </div>
          </div>
          <NJButton
            // @ts-expect-error Fluid DS v6 types mismatch
            variant="subtle"
            size="sm"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer"
          >
            {/* @ts-expect-error Fluid DS v6 types mismatch */}
            <NJIcon name="close" size="20" />
          </NJButton>
        </div>

        {/* Messages */}
        <div className="assistant-panel__messages">
          {messages.length === 0 ? (
            <div className="assistant-panel__welcome">
              <h4>Bonjour Marie ! 👋</h4>
              <p>
                Je suis votre assistant énergie ENGIE. Posez-moi des questions sur vos contrats,
                factures ou consommation.
              </p>
              <div className="assistant-panel__suggestions">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    className="assistant-panel__suggestion"
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                  >
                    <span>{prompt.icon}</span>
                    <span>{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`assistant-message assistant-message--${message.role}`}
              >
                {message.role === 'assistant' && (
                  <span className="assistant-message__avatar">🤖</span>
                )}

                <div className="assistant-message__content">
                  {/* Iterate over message.parts for interleaved text + tool UI */}
                  {message.parts?.map((part, index) => {
                    if (part.type === 'text' && 'text' in part) {
                      return (
                        <div key={`${message.id}-${index}`} className="assistant-message__text">
                          {(part.text as string).split('\n').map((line, i) => (
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

          {/* Loading indicator */}
          {isLoading && messages.length > 0 && (
            <div className="assistant-message assistant-message--assistant">
              <span className="assistant-message__avatar">🤖</span>
              <div className="assistant-message__typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          id="assistant-form"
          className="assistant-panel__input"
          onSubmit={handleSubmit}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder={t('common.assistant_placeholder', 'Posez votre question...')}
            className="assistant-panel__text-input"
            disabled={isLoading}
          />
          <NJButton
            type="submit"
            // @ts-expect-error Fluid DS v6 types mismatch
            variant="brand"
            size="sm"
            disabled={isLoading || !input.trim()}
          >
            {/* @ts-expect-error Fluid DS v6 types mismatch */}
            <NJIcon name="send" size="20" />
          </NJButton>
        </form>
      </div>
    </>
  );
}
