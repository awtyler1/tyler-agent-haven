/**
 * PDF Assistant - Apple-Inspired Design
 *
 * A conversational AI assistant for creating professional PDFs.
 * Design principles: Clean, intuitive, delightful.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Download,
  Send,
  Loader2,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowDown,
} from 'lucide-react';

import {
  renderDocument,
  toDataUrl,
  downloadPdf,
  type ContentBlock,
} from '@/lib/pdfGenerator';

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  document?: DocumentStructure | null;
  suggestions?: string[];
  timestamp: Date;
}

interface DocumentStructure {
  config: {
    title: string;
    subtitle?: string;
  };
  blocks: ContentBlock[];
}

// =============================================================================
// HELPERS
// =============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// =============================================================================
// MESSAGE COMPONENT
// =============================================================================

interface ChatMessageProps {
  message: Message;
  onSuggestionClick: (suggestion: string) => void;
  isLatest: boolean;
}

function ChatMessage({ message, onSuggestionClick, isLatest }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      {/* Message bubble */}
      <div
        className={`
          relative max-w-[80%] px-4 py-3 rounded-2xl
          ${
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-br-md shadow-lg shadow-primary/20'
              : 'bg-white border border-gray-100 rounded-bl-md shadow-sm'
          }
        `}
      >
        {/* Assistant avatar integrated */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-400">PDF Assistant</span>
          </div>
        )}

        <p
          className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-700'}`}
        >
          {message.content}
        </p>

        {/* Document created indicator */}
        {!isUser && message.document && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <FileText className="h-2.5 w-2.5" />
              </div>
              Document ready
            </div>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span
        className={`text-[10px] text-gray-300 mt-1.5 px-1 ${isUser ? 'text-right' : 'text-left'}`}
      >
        {formatTime(message.timestamp)}
      </span>

      {/* Suggestions - only show on latest assistant message */}
      {!isUser && message.suggestions && message.suggestions.length > 0 && isLatest && (
        <div className="flex flex-wrap gap-2 mt-3 max-w-[80%]">
          {message.suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="
                group px-4 py-2 text-sm font-medium rounded-full
                bg-white border border-gray-200 text-gray-600
                hover:border-primary hover:text-primary hover:bg-primary/5
                active:scale-95 transition-all duration-200
                shadow-sm hover:shadow-md
              "
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// TYPING INDICATOR
// =============================================================================

function TypingIndicator() {
  return (
    <div className="flex items-start animate-in fade-in duration-300">
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (s: string) => void }) {
  const suggestions = [
    { label: 'Agent Report', prompt: 'Create an agent performance report' },
    { label: 'Onboarding Checklist', prompt: 'Create an onboarding checklist for new agents' },
    { label: 'Compliance Summary', prompt: 'Create a compliance summary document' },
    { label: 'Carrier Overview', prompt: 'Create a carrier overview document' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      {/* Icon */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
        <Sparkles className="h-10 w-10 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">PDF Assistant</h2>
      <p className="text-gray-500 text-center max-w-md mb-8">
        Create professional documents through conversation. Just describe what you need.
      </p>

      {/* Quick starts */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {suggestions.map((item) => (
          <button
            key={item.label}
            onClick={() => onSuggestionClick(item.prompt)}
            className="
              group p-4 rounded-2xl border border-gray-200 bg-white
              hover:border-primary/30 hover:bg-primary/5
              active:scale-[0.98] transition-all duration-200
              text-left shadow-sm hover:shadow-md
            "
          >
            <div className="text-sm font-medium text-gray-700 group-hover:text-primary">
              {item.label}
            </div>
            <div className="text-xs text-gray-400 mt-1">Click to start</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PREVIEW PANEL
// =============================================================================

interface PreviewPanelProps {
  document: DocumentStructure | null;
  pdfDataUrl: string | null;
  onDownload: () => void;
  onClose: () => void;
}

function PreviewPanel({ document, pdfDataUrl, onDownload, onClose }: PreviewPanelProps) {
  if (!document) return null;

  return (
    <div className="w-[480px] flex flex-col bg-gray-50 border-l border-gray-200 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <FileText className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">
              {document.config.title}
            </h3>
            {document.config.subtitle && (
              <p className="text-xs text-gray-400">{document.config.subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onDownload}
            size="sm"
            className="rounded-full px-4 bg-gray-900 hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <EyeOff className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 p-4">
        <div className="h-full rounded-xl overflow-hidden bg-white shadow-lg ring-1 ring-gray-200">
          {pdfDataUrl ? (
            <iframe src={pdfDataUrl} className="w-full h-full border-0" title="PDF Preview" />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PdfBuilderPage() {
  const navigate = useNavigate();

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<DocumentStructure | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle scroll position for "scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages.length > 2);
  };

  // Generate PDF preview
  useEffect(() => {
    async function generatePreview() {
      if (!currentDocument || !currentDocument.blocks?.length) {
        setPdfDataUrl(null);
        return;
      }

      try {
        const bytes = await renderDocument(
          {
            title: currentDocument.config.title,
            subtitle: currentDocument.config.subtitle,
            showDate: true,
            showPageNumbers: true,
          },
          currentDocument.blocks
        );
        setPdfDataUrl(toDataUrl(bytes));
      } catch (error) {
        console.error('PDF preview failed:', error);
      }
    }

    generatePreview();
  }, [currentDocument]);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Auto-show preview when we start chatting
    if (messages.length === 0) {
      setShowPreview(true);
    }

    try {
      const conversationHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf-structure`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: conversationHistory,
            currentDocument,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Request failed');
      }

      const { message, document, suggestions } = result.data;

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: message,
        document,
        suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (document) {
        const blocksWithIds = document.blocks.map((block: ContentBlock) => ({
          ...block,
          id: (block as ContentBlock & { id?: string }).id || generateId(),
        }));
        setCurrentDocument({
          ...document,
          blocks: blocksWithIds,
        });
      }
    } catch (error) {
      console.error('Chat failed:', error);

      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: "I ran into an issue. Let's try that again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handlers
  const handleSuggestionClick = (suggestion: string) => sendMessage(suggestion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleDownload = async () => {
    if (!currentDocument) return;
    try {
      const bytes = await renderDocument(
        {
          title: currentDocument.config.title,
          subtitle: currentDocument.config.subtitle,
          showDate: true,
          showPageNumbers: true,
        },
        currentDocument.blocks
      );
      const filename = `${currentDocument.config.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      downloadPdf(bytes, filename);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentDocument(null);
    setPdfDataUrl(null);
  };

  const hasMessages = messages.length > 0;

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-140px)] flex bg-gray-50 -m-6 -mb-8">
        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-800">PDF Assistant</h1>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {currentDocument && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`
                    p-2.5 rounded-xl transition-all duration-200
                    ${showPreview ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 text-gray-400'}
                  `}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              {hasMessages && (
                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages or empty state */}
          {!hasMessages ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-6 py-6"
            >
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSuggestionClick={handleSuggestionClick}
                    isLatest={index === messages.length - 1 && !isLoading}
                  />
                ))}

                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={() => scrollToBottom()}
                  className="
                    fixed bottom-32 left-1/2 -translate-x-1/2
                    p-3 rounded-full bg-white shadow-lg border border-gray-200
                    hover:bg-gray-50 active:scale-95 transition-all duration-200
                    animate-in fade-in slide-in-from-bottom-4
                  "
                >
                  <ArrowDown className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          )}

          {/* Input area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe the document you want to create..."
                  className="
                    w-full min-h-[52px] max-h-40 pr-14 py-3.5 px-4
                    resize-none rounded-2xl border-gray-200
                    focus:border-primary focus:ring-2 focus:ring-primary/20
                    placeholder:text-gray-400 text-[15px]
                    transition-all duration-200
                  "
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="
                    absolute right-2 bottom-2
                    p-2.5 rounded-xl
                    bg-primary text-white
                    hover:bg-primary/90 active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">
                Press Enter to send · Shift+Enter for new line
              </p>
            </form>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && currentDocument && (
          <PreviewPanel
            document={currentDocument}
            pdfDataUrl={pdfDataUrl}
            onDownload={handleDownload}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
