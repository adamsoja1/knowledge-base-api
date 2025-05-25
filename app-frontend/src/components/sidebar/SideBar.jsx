// src/components/Sidebar.js
import React, { useState } from 'react';
import { PlusIcon, ChatBubbleLeftRightIcon, TrashIcon, HomeIcon, Cog6ToothIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid'; // Mniejsze ikony

const SideBar = ({ onNewChat, onSelectChat, onClearChats }) => {
  const [conversations, setConversations] = useState([
    { id: '1', title: 'Planowanie podróży do Japonii', date: '2024-05-20' },
    { id: '2', title: 'Implementacja React hooks', date: '2024-05-18' },
    { id: '3', title: 'Przepisy na wegańskie obiady', date: '2024-05-15' },
    { id: '4', title: 'Historia sztuki renesansu', date: '2024-05-12' },
    { id: '5', title: 'Optymalizacja zapytań SQL', date: '2024-05-10' },
    { id: '6', title: 'Pomysły na prezent urodzinowy', date: '2024-05-08' },
    { id: '7', title: 'Krótki wstęp do AI', date: '2024-05-05' },
    { id: '8', title: 'Porównanie frameworków CSS', date: '2024-05-03' },
    { id: '9', title: 'Jak dbać o rośliny domowe?', date: '2024-05-01' },
    { id: '10', title: 'Refaktoryzacja kodu JavaScript', date: '2024-04-28' },
  ]);

  const [isHovered, setIsHovered] = useState(false); // Do pokazywania/ukrywania paska
  const [collapsed, setCollapsed] = useState(false); // Do zwijania/rozwijania paska

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Funkcja do symulacji wyboru czatu - w prawdziwej aplikacji zmieniałaby stan `currentChatId`
  const handleSelect = (chatId) => {
    console.log(`Wybrano czat: ${chatId}`);
    if (onSelectChat) {
      onSelectChat(chatId);
    }
    // Tutaj można by ustawić aktywny czat w komponencie nadrzędnym
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out z-20
        ${collapsed ? 'w-16' : 'w-64'}
        ${isHovered && collapsed ? 'w-64 shadow-xl' : ''}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full p-3">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center justify-center w-full px-4 py-2 mb-4 bg-gray-800 text-gray-100 rounded-lg
            hover:bg-gray-700 transition duration-200 ease-in-out border border-gray-700 shadow-md group"
        >
          <PlusIcon className={`w-5 h-5 transition-transform duration-200 ${collapsed && !isHovered ? 'mr-0' : 'mr-2 group-hover:rotate-90'}`} />
          <span className={`${collapsed && !isHovered ? 'hidden' : 'block'}`}>Nowy czat</span>
        </button>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-thin pr-2 -mr-2"> {/* Dodatkowy padding i margines do scrollbara */}
          {conversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelect(chat.id)}
              className="flex items-center p-2 mb-2 rounded-lg bg-gray-850 hover:bg-gray-700 transition duration-200 cursor-pointer group"
            >
              <ChatBubbleLeftRightIcon className={`flex-shrink-0 w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsed && !isHovered ? 'mr-0' : 'mr-3'}`} />
              <span className={`text-gray-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis
                ${collapsed && !isHovered ? 'hidden' : 'block'}`}
              >
                {chat.title}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-4 border-t border-gray-800 pt-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-start w-full px-2 py-2 mb-2 text-gray-300 rounded-lg hover:bg-gray-800 transition duration-200 ease-in-out"
          >
            <ArrowLeftEndOnRectangleIcon className={`w-5 h-5 transition-transform duration-200 ${collapsed && !isHovered ? 'rotate-180 mr-0' : 'mr-3'}`} />
            <span className={`${collapsed && !isHovered ? 'hidden' : 'block'}`}>
              {collapsed ? 'Rozwiń' : 'Zwiń pasek'}
            </span>
          </button>
          <button
            onClick={() => console.log('Ustawienia')}
            className="flex items-center justify-start w-full px-2 py-2 mb-2 text-gray-300 rounded-lg hover:bg-gray-800 transition duration-200 ease-in-out"
          >
            <Cog6ToothIcon className={`w-5 h-5 transition-transform duration-200 ${collapsed && !isHovered ? 'mr-0' : 'mr-3'}`} />
            <span className={`${collapsed && !isHovered ? 'hidden' : 'block'}`}>
              Ustawienia
            </span>
          </button>
          <button
            onClick={onClearChats}
            className="flex items-center justify-start w-full px-2 py-2 mb-2 text-gray-300 rounded-lg hover:bg-gray-800 transition duration-200 ease-in-out"
          >
            <TrashIcon className={`w-5 h-5 transition-transform duration-200 ${collapsed && !isHovered ? 'mr-0' : 'mr-3'}`} />
            <span className={`${collapsed && !isHovered ? 'hidden' : 'block'}`}>
              Wyczyść rozmowy
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideBar;