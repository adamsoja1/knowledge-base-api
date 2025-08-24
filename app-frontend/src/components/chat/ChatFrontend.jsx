// src/ChatFrontend.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PaperAirplaneIcon, PlusIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Sidebar from '../sidebar/SideBar';
import './ChatFrontend.css';

const ChatFrontend = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
    setCurrentChatId(null);
    console.log("Rozpoczęto nowy czat!");
  };

  const handleSelectChat = (id) => {
    setCurrentChatId(id);
    console.log(`Ładowanie czatu: ${id}`);
    setMessages([
      { role: 'assistant', content: `Wczytano czat o ID: ${id}. To jest symulowana rozmowa.`, timestamp: new Date() },
      { role: 'user', content: 'Cześć! Co u Ciebie?', timestamp: new Date() },
      { role: 'assistant', content: 'U mnie dobrze! Jak mogę pomóc?', timestamp: new Date() },
    ]);
  };

  const handleClearAllChats = () => {
    if (window.confirm("Czy na pewno chcesz usunąć wszystkie rozmowy? Tej operacji nie można cofnąć.")) {
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
      setCurrentChatId(null);
      console.log("Wszystkie czaty zostały wyczyszczone (symulacja).");
    }
  };

  const handleResponse = async (prompt) => {
    try {
      const response = await fetch('http://backend:8000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          stream: true,
          conversation_id: currentChatId || "new"
        })
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const assistantMessage = { role: 'assistant', content: '', timestamp: new Date() };
  
      // Dodaj pustą wiadomość asystenta (będzie aktualizowana strumieniowo)
      setMessages(prev => [...prev, assistantMessage]);
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
  
        for (const line of lines) {
          const cleaned = line.startsWith('data:') ? line.slice(5).trim() : line.trim();
  
          if (cleaned === '[DONE]') {
            return;
          }
  
          try {
            const data = JSON.parse(cleaned);
  
            if (data.text_token) {
              assistantMessage.content += data.text_token;
  
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
              });
            }
  
            if (data.conversation_id && !currentChatId) {
              setCurrentChatId(data.conversation_id);
            }
  
          } catch (e) {
            console.warn('Could not parse JSON chunk:', cleaned, e);
          }
        }
      }
  
    } catch (error) {
      console.error('Streaming error:', error);
  
      setMessages(prev => {
        const newMessages = [...prev];
        if (
          newMessages.length > 0 &&
          newMessages[newMessages.length - 1].role === 'assistant' &&
          newMessages[newMessages.length - 1].content === ''
        ) {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: `Błąd: ${error.message}. Spróbuj ponownie.`,
            isError: true
          };
        } else {
          newMessages.push({
            role: 'assistant',
            content: `Błąd: ${error.message}. Spróbuj ponownie.`,
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
      await handleResponse(userMessage.content);
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

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="chat-header">
          <div className="header-left">
            <div className="header-title">
              <ChatBubbleLeftRightIcon className="title-icon" />
              <h1>ChatAI</h1>
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={handleNewChat}
              className="action-btn new-chat-btn"
              title="Nowy czat"
            >
              <PlusIcon className="btn-icon" />
            </button>
            <button className="action-btn menu-btn">
              <EllipsisVerticalIcon className="btn-icon" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <main className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <ChatBubbleLeftRightIcon />
              </div>
              <h2>Jak mogę Ci dzisiaj pomóc?</h2>
              <p>Rozpocznij rozmowę, zadając pytanie lub opisując problem</p>
            </div>
          ) : (
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-content">
                    <div className="message-avatar">
                      {msg.role === 'user' ? (
                        <span className="user-avatar">U</span>
                      ) : (
                        <span className="ai-avatar">AI</span>
                      )}
                    </div>
                    <div className="message-body">
                      <div className="message-header">
                        <span className="message-author">
                          {msg.role === 'user' ? 'Ty' : 'ChatAI'}
                        </span>
                        <span className="message-time">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div className={`message-text ${msg.isError ? 'error' : ''}`}>
                        {msg.role === 'assistant' ? (
                          <div className="markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="plain-text">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message assistant loading">
                  <div className="message-content">
                    <div className="message-avatar">
                      <span className="ai-avatar">AI</span>
                    </div>
                    <div className="message-body">
                      <div className="message-header">
                        <span className="message-author">ChatAI</span>
                      </div>
                      <div className="typing-indicator">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}></div>
            </div>
          )}
        </main>

        {/* Input Area */}
        <footer className="input-area">
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Napisz wiadomość..."
                disabled={isLoading}
                rows={1}
                className="message-input"
              />
              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isLoading}
                className="send-button"
                aria-label="Wyślij wiadomość"
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <PaperAirplaneIcon className="send-icon" />
                )}
              </button>
            </div>
            <div className="input-footer">
              ChatAI może popełniać błędy. Sprawdź ważne informacje.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatFrontend;