import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface ChatSystemProps {
  channelId: string;
  isEmergency?: boolean;
  onClose?: () => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  channelId,
  isEmergency = false,
  onClose
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Simulate connection to chat service
    setIsConnected(true);
    
    // Add initial system message for emergency chats
    if (isEmergency) {
      const systemMessage: Message = {
        id: 'system-1',
        senderId: 'system',
        senderName: 'Sistema',
        content: 'Has activado el sistema de emergencia. Un SERENO se conectará contigo pronto.',
        timestamp: new Date(),
        type: 'system'
      };
      setMessages([systemMessage]);
    }

    return () => {
      setIsConnected(false);
    };
  }, [channelId, isEmergency]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      senderName: 'Tú',
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate SERENO response in emergency mode
    if (isEmergency) {
      setTimeout(() => {
        const response: Message = {
          id: `sereno-${Date.now()}`,
          senderId: 'sereno-1',
          senderName: 'SERENO María',
          content: 'Hola, soy María, un SERENO voluntario. Estoy aquí para ayudarte. ¿Puedes contarme cómo te sientes?',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className={`p-4 border-b ${isEmergency ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isEmergency && (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {isEmergency ? 'Chat de Emergencia' : 'Chat de Apoyo'}
              </h3>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'system'
                  ? 'bg-yellow-100 text-yellow-800 text-center text-sm'
                  : message.senderId === 'current-user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.type === 'text' && message.senderId !== 'current-user' && (
                <p className="text-xs font-semibold mb-1 opacity-75">
                  {message.senderName}
                </p>
              )}
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'system' 
                  ? 'text-yellow-600'
                  : message.senderId === 'current-user' 
                  ? 'text-blue-100' 
                  : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};