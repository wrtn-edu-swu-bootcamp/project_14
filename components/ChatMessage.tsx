'use client';

import { Bot, User } from 'lucide-react';
import { PolicyCard } from './PolicyCard';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: any[];
}

export function ChatMessage({ role, content, toolInvocations }: ChatMessageProps) {
  const isUser = role === 'user';

  // 도구 호출 결과 렌더링
  const renderToolResults = () => {
    if (!toolInvocations || toolInvocations.length === 0) return null;

    return toolInvocations.map((invocation, idx) => {
      if (invocation.toolName === 'search_youth_policies' && invocation.state === 'result') {
        const result = invocation.result;
        
        if (result.success && result.policies) {
          return (
            <div key={idx} className="space-y-4 mt-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50 shadow-sm">
                <span className="text-sm font-bold text-indigo-700">
                  🔍 {result.count}개의 정책을 찾았어!
                </span>
                {result.searchMethod === 'semantic_search' && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold">
                    RAG 🧠
                  </span>
                )}
              </div>
              {result.policies.map((policy: any) => (
                <PolicyCard key={policy.id} policy={policy} />
              ))}
            </div>
          );
        }
      }

      if (invocation.toolName === 'calculate_median_income' && invocation.state === 'result') {
        const result = invocation.result;
        
        return (
          <div key={idx} className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200/50 rounded-2xl p-5 mt-5 shadow-lg">
            <h4 className="font-bold text-emerald-900 mb-3 text-base flex items-center gap-2">
              💰 소득 진단 결과
            </h4>
            <p className="text-sm text-emerald-800 mb-4 font-medium leading-relaxed">{result.explanation}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-200/50">
                <span className="text-gray-600 font-medium">중위소득 50%:</span>
                <span className={`ml-2 font-bold text-sm ${result.eligibleFor.basic50 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {result.eligibleFor.basic50 ? '✓ 해당' : '✗ 해당 안됨'}
                </span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-200/50">
                <span className="text-gray-600 font-medium">중위소득 100%:</span>
                <span className={`ml-2 font-bold text-sm ${result.eligibleFor.basic100 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {result.eligibleFor.basic100 ? '✓ 해당' : '✗ 해당 안됨'}
                </span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-200/50">
                <span className="text-gray-600 font-medium">중위소득 150%:</span>
                <span className={`ml-2 font-bold text-sm ${result.eligibleFor.basic150 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {result.eligibleFor.basic150 ? '✓ 해당' : '✗ 해당 안됨'}
                </span>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-200/50">
                <span className="text-gray-600 font-medium">중위소득 200%:</span>
                <span className={`ml-2 font-bold text-sm ${result.eligibleFor.basic200 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {result.eligibleFor.basic200 ? '✓ 해당' : '✗ 해당 안됨'}
                </span>
              </div>
            </div>
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} message-animation`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 gradient-animate flex items-center justify-center shadow-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-5 py-3.5 shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
              : 'bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200/50'
          }`}
        >
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}</div>
          </div>
        </div>
        
        {!isUser && renderToolResults()}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}
