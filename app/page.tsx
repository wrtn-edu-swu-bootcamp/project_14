'use client';

import { useChat } from 'ai/react';
import { Send, Loader2, Sparkles, BookMarked } from 'lucide-react';
import { ChatMessage } from '@/components/ChatMessage';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const { messages, append, isLoading, error } = useChat({
    api: '/api/chat',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNotionGuide, setShowNotionGuide] = useState(false);
  const [input, setInput] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exampleQuestions = [
    '서울에 사는 25살인데 받을 수 있는 정책 알려줘',
    '월세 지원 받을 수 있는 정책 찾아줘',
    '알바 중인데 신청 가능한 일자리 정책은?',
    '창업 지원금 받고 싶어',
  ];

  const handleExampleClick = async (question: string) => {
    setInput(question);
    await append({ role: 'user', content: question });
    setInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await append({ role: 'user', content: message });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* 헤더 */}
      <header className="glass-effect border-b border-white/20 px-4 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 gradient-animate flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                폴리(Policy) AI
              </h1>
              <p className="text-xs text-gray-600 font-medium">청년 정책 AI 어드바이저</p>
            </div>
          </div>
          <button
            onClick={() => setShowNotionGuide(!showNotionGuide)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 rounded-xl transition-all"
            title="Notion 북마크 설정"
          >
            <BookMarked className="w-4 h-4" />
            <span className="hidden sm:inline">Notion 설정</span>
          </button>
        </div>
      </header>

      {/* Notion 설정 안내 */}
      {showNotionGuide && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <BookMarked className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">📚 Notion 북마크 기능 설정하기</h3>
                <p className="text-sm text-blue-800 mb-3">
                  관심있는 정책을 Notion에 저장하려면 <strong>5분 설정</strong>이 필요해요!
                </p>
                <button
                  onClick={() => setShowNotionGuide(false)}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16 px-4 fade-in">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 gradient-animate flex items-center justify-center mx-auto shadow-2xl">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-50 animate-pulse"></div>
              </div>
              
              <h2 className="text-4xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  안녕! 나는 폴리 AI야 👋
                </span>
              </h2>
              
              <p className="text-lg text-gray-600 mb-4 max-w-lg mx-auto font-medium">
                너에게 딱 맞는 청년 정책을 찾아줄게
              </p>
              
              <p className="text-sm text-gray-500 mb-12 max-w-md mx-auto">
                나이, 지역, 관심사를 말해주면 <span className="text-purple-600 font-semibold">AI가 의미를 이해</span>해서<br />
                가장 관련있는 정책을 추천해줄게!
              </p>
              
              {/* 예시 질문 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {exampleQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(question)}
                    className="group relative text-left p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 hover:border-purple-300 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="relative text-sm text-gray-700 font-medium leading-relaxed">{question}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                toolInvocations={message.toolInvocations}
              />
            ))
          )}

          {isLoading && (
            <div className="flex gap-3 items-start message-animation">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 gradient-animate flex items-center justify-center shadow-lg">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="bg-white/60 backdrop-blur-sm shadow-sm rounded-2xl px-5 py-3 border border-gray-200/50">
                <div className="typing-indicator flex gap-1.5">
                  <span className="w-2.5 h-2.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></span>
                  <span className="w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></span>
                  <span className="w-2.5 h-2.5 bg-gradient-to-r from-pink-400 to-indigo-400 rounded-full"></span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200/50 rounded-2xl p-5 text-center shadow-lg message-animation">
              <p className="text-red-800 font-bold mb-2 text-lg">⚠️ 오류가 발생했습니다</p>
              <p className="text-sm text-red-600 font-medium">{error.message}</p>
              <p className="text-xs text-red-500 mt-3">
                서버 로그를 확인하거나 페이지를 새로고침해주세요.
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 입력 영역 */}
      <footer className="glass-effect border-t border-white/20 px-4 py-5 shadow-lg">
        <form 
          onSubmit={handleSubmit} 
          className="max-w-4xl mx-auto"
        >
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요... 💬"
              disabled={isLoading}
              className="flex-1 px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm transition-all text-[15px]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-2xl p-4 transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 disabled:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3 font-medium">
            🤖 AI가 생성한 정보는 참고용입니다. 신청 전 공식 웹사이트에서 확인하세요.
          </p>
        </form>
      </footer>
    </div>
  );
}
