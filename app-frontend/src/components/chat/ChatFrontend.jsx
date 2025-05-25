// src/ChatFrontend.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, XMarkIcon, SparklesIcon, WifiIcon } from '@heroicons/react/24/solid';

// Importuj biblioteki do Markdowna
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Importuj nowy komponent Sidebar
import Sidebar from '..sidebar/Sidebar'; // Dostosuj ścieżkę, jeśli jest inna

const ChatFrontend = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null); // Nowy stan do zarządzania aktywnym czatem

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  // Symulacja rozpoczęcia nowego czatu
  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
    setCurrentChatId(null); // Resetuj ID bieżącego czatu
    console.log("Rozpoczęto nowy czat!");
    // W prawdziwej aplikacji tutaj nastąpiłoby utworzenie nowego ID czatu w backendzie
  };

  // Symulacja wybrania istniejącego czatu
  const handleSelectChat = (id) => {
    setCurrentChatId(id);
    // W prawdziwej aplikacji tutaj pobrałbyś historię wiadomości dla tego ID z backendu
    console.log(`Ładowanie czatu: ${id}`);
    setMessages([
      { role: 'assistant', content: `Wczytano czat o ID: ${id}. To jest symulowana rozmowa.`, timestamp: new Date() },
      { role: 'user', content: 'Cześć! Co u Ciebie?', timestamp: new Date() },
      { role: 'assistant', content: 'U mnie dobrze! Jak mogę pomóc?', timestamp: new Date() },
    ]);
  };

  // Symulacja czyszczenia wszystkich czatów (na razie tylko front-end)
  const handleClearAllChats = () => {
    if (window.confirm("Czy na pewno chcesz usunąć wszystkie rozmowy? Tej operacji nie można cofnąć.")) {
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
      setCurrentChatId(null);
      // W prawdziwej aplikacji wysłałbyś zapytanie do backendu o usunięcie
      console.log("Wszystkie czaty zostały wyczyszczone (symulacja).");
    }
  };


  const handleStreamingResponse = async (prompt) => {
    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          stream: true,
          max_tokens: 1000,
          conversation_id: currentChatId || "new" // Użyj ID czatu lub "new"
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '', timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.text_token) {
              assistantMessage.content += data.text_token;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
              });
            }
            // Jeśli API zwraca conversation_id, ustaw je
            if (data.conversation_id && !currentChatId) {
                setCurrentChatId(data.conversation_id);
            }
          } catch (e) {
            console.warn('Could not parse JSON chunk (might be incomplete):', e);
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant' && newMessages[newMessages.length - 1].content === '') {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: `Error: ${error.message}. Please try again.`,
            isError: true
          };
        } else {
          newMessages.push({
            role: 'assistant',
            content: `Error: ${error.message}. Please try again.`,
            timestamp: new Date(),
            isError: true
          });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNonStreamingResponse = async (prompt) => {
    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          stream: false,
          max_tokens: 1000,
          conversation_id: currentChatId || "new"
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);

      if (data.conversation_id && !currentChatId) {
          setCurrentChatId(data.conversation_id);
      }

    } catch (error) {
      console.error('Request error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (isStreaming) {
        await handleStreamingResponse(userMessage.content);
      } else {
        await handleNonStreamingResponse(userMessage.content);
      }
    } catch (error) {
      console.error("Submission failed:", error);
      setIsLoading(false);
    } finally {
      adjustTextareaHeight();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    // Zmieniono: Dodano kontener flex dla paska bocznego i głównej zawartości
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans antialiased">
      {/* Background Gradient Effect - NIE ZMIENIAJ */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="w-96 h-96 bg-gradient-to-br from-indigo-800 to-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 left-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="w-96 h-96 bg-gradient-to-br from-blue-700 to-cyan-800 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-full left-0 -translate-x-1/2 -translate-y-1/2 animation-delay-2000"></div>
        <div className="w-96 h-96 bg-gradient-to-br from-red-700 to-orange-800 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animation-delay-4000"></div>
      </div>

      {/* Sidebar - dodany komponent */}
      <Sidebar
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onClearChats={handleClearAllChats}
      />

      {/* Main Content Wrapper - dostosowany margines */}
      {/* Zmieniono: ml-16 (dla collapsed sidebar) lub ml-64 (dla expanded) */}
      <div className="relative z-10 flex flex-col h-full flex-1 ml-16 sm:ml-64 transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-indigo-700/30 p-4 bg-gray-900/80 backdrop-blur-md shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <SparklesIcon className="w-6 h-6 text-white" />
                <span className="text-white font-extrabold text-xl leading-none">AI</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Aurora AI</h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <label className="flex items-center gap-2 text-indigo-300 cursor-pointer transition-colors duration-200 hover:text-indigo-200">
                <input
                  type="checkbox"
                  checked={isStreaming}
                  onChange={(e) => setIsStreaming(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-indigo-500 bg-gray-800 border-indigo-600 rounded focus:ring-indigo-500 transition duration-150 ease-in-out cursor-pointer"
                />
                <span className="select-none">Streaming</span>
              </label>
              <button
                onClick={clearChat}
                className="px-4 py-2 rounded-lg bg-red-700/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 font-medium transition duration-200 ease-in-out shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1"
                aria-label="Clear Chat"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear Current Chat
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar-thin flex flex-col min-h-0">
          <div className="max-w-4xl mx-auto w-full space-y-6 flex-grow flex flex-col justify-end">
            {messages.length === 0 ? (
              <Transition
                as="div"
                show={true}
                appear={true}
                enter="transition-all duration-700 ease-out"
                enterFrom="opacity-0 scale-95 translate-y-10"
                enterTo="opacity-100 scale-100 translate-y-0"
                className="text-center mt-20 p-8 bg-gray-800/40 rounded-3xl shadow-2xl border border-indigo-700/30 backdrop-blur-sm"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse-slow">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 text-white" />
                  <span className="text-white font-extrabold text-4xl">AI</span>
                </div>
                <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">Welcome to Aurora AI Chat</h2>
                <p className="text-indigo-200 text-lg max-w-prose mx-auto">
                  Your intelligent assistant is ready. Ask me anything, get creative, or simply explore!
                </p>
                <p className="text-indigo-300 text-md mt-6">
                  Tip: Press <kbd className="bg-gray-700/50 px-2 py-1 rounded-md text-white font-semibold text-sm shadow-inner">Enter</kbd> to send, <kbd className="bg-gray-700/50 px-2 py-1 rounded-md text-white font-semibold text-sm shadow-inner">Shift + Enter</kbd> for a new line.
                </p>
              </Transition>
            ) : (
              messages.map((msg, idx) => (
                <Transition
                  key={idx}
                  as="div"
                  show={true}
                  appear={true}
                  enter="transition-all duration-500 ease-out"
                  enterFrom="opacity-0 translate-y-4"
                  enterTo="opacity-100 translate-y-0"
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] px-6 py-4 rounded-3xl shadow-xl transition-all duration-300 ease-in-out relative
                    ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-700 to-purple-700 text-white transform hover:scale-[1.01] hover:shadow-2xl'
                      : msg.isError
                        ? 'bg-red-800/50 border border-red-600 text-red-100 transform hover:scale-[1.01] hover:shadow-2xl'
                        : 'bg-gray-800 border border-indigo-700/30 text-gray-50 transform hover:scale-[1.01] hover:shadow-2xl'
                    }`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner overflow-hidden
                        ${msg.role === 'user' ? 'bg-white/20 text-white' : 'bg-indigo-600/40 text-indigo-100'}`}>
                        {msg.role === 'user' ? (
                          <span className="text-xl">👤</span>
                        ) : (
                          <SparklesIcon className="w-5 h-5 text-indigo-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Poprawka: Dodano 'text-left' do kontenera prose */}
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-invert max-w-none text-base leading-relaxed py-1 text-left
                                prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                                prose-a:text-indigo-400 hover:prose-a:text-indigo-300
                                prose-strong:font-bold prose-code:bg-gray-700 prose-code:px-1 prose-code:rounded
                                prose-pre:bg-gray-700 prose-pre:text-gray-200 prose-pre:rounded-lg prose-pre:p-3
                                prose-headings:text-indigo-200">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                              >
                                {msg.content}
                              </ReactMarkdown>
                          </div>
                        ) : (
                          // Poprawka: Dodano 'text-left' dla wiadomości użytkownika
                          <pre className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed py-1 text-left">
                            {msg.content}
                          </pre>
                        )}
                      </div>
                    </div>
                    <div className="text-xs mt-2 text-gray-400 opacity-80 text-right">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </Transition>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-gray-800 border border-indigo-700/30 px-6 py-4 rounded-3xl shadow-xl flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-600/40 rounded-full flex items-center justify-center font-bold text-sm text-indigo-100">
                    <SparklesIcon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>
        </main>

        {/* Input Area */}
        <footer className="flex-shrink-0 border-t border-indigo-700/30 p-4 bg-gray-900/80 backdrop-blur-md shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-end gap-4">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "Generating response..." : "Type your message..."}
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none px-5 py-3 pr-12 rounded-2xl bg-gray-800/60 border border-indigo-600/50 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-100 text-base shadow-inner transition-all duration-200 min-h-[52px] max-h-[160px] custom-scrollbar"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99, 102, 241, 0.5) transparent' }}
              ></textarea>
              {isLoading && (
                <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center space-x-1 text-indigo-400">
                  <WifiIcon className="w-5 h-5 animate-pulse" />
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 px-6 py-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold shadow-lg transition-all duration-300 ease-in-out disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed disabled:shadow-none disabled:text-gray-400 active:scale-98 flex items-center justify-center gap-2"
              aria-label="Send message"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5 -rotate-45 transform" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatFrontend;