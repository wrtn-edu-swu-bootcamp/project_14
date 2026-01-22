'use client';

import { ExternalLink, Calendar, MapPin, Building2, CheckCircle2 } from 'lucide-react';

interface PolicyCardProps {
  policy: {
    id: string;
    title: string;
    summary: string;
    category: string;
    region: string;
    ageRange?: string;
    supportDetails: string;
    period: string;
    applicationUrl?: string;
    hostOrganization: string;
    requirements?: string;
    similarity?: string;
  };
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const categoryColors: Record<string, string> = {
    '주거': 'bg-blue-100 text-blue-800',
    '일자리': 'bg-green-100 text-green-800',
    '창업': 'bg-purple-100 text-purple-800',
    '교육': 'bg-yellow-100 text-yellow-800',
    '자산형성': 'bg-pink-100 text-pink-800',
    '기타': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200/50 hover:border-purple-300/50 message-animation hover:scale-[1.01]">
      {/* 배경 그라데이션 효과 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* 헤더 */}
      <div className="relative flex items-start justify-between mb-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm ${categoryColors[policy.category] || categoryColors['기타']}`}>
              {policy.category}
            </span>
            {policy.ageRange && (
              <span className="text-xs text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-xl font-medium">
                {policy.ageRange}
              </span>
            )}
            {policy.similarity && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 shadow-sm border border-green-200/50">
                🎯 관련도 {policy.similarity}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
            {policy.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {policy.summary}
          </p>
        </div>
      </div>

      {/* 지원 내용 */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-5 mb-5 border border-indigo-100/50">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold text-indigo-900 text-sm mb-2">💎 지원 혜택</h4>
            <p className="text-sm text-indigo-800 leading-relaxed font-medium">{policy.supportDetails}</p>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-gray-600">신청 기간:</span>
            <span className="text-gray-900 ml-2 font-medium">{policy.period}</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2 text-sm">
          <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-gray-600">운영 기관:</span>
            <span className="text-gray-900 ml-2 font-medium">{policy.hostOrganization}</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-gray-600">지역:</span>
            <span className="text-gray-900 ml-2 font-medium">{policy.region}</span>
          </div>
        </div>
      </div>

      {/* 신청 자격 */}
      {policy.requirements && (
        <div className="border-t pt-4 mb-4">
          <h4 className="font-semibold text-gray-700 text-sm mb-2">신청 자격</h4>
          <p className="text-sm text-gray-600">{policy.requirements}</p>
        </div>
      )}

      {/* 신청 버튼 */}
      {policy.applicationUrl && (
        <a
          href={policy.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] overflow-hidden group"
        >
          <span className="relative z-10">신청하러 가기</span>
          <ExternalLink className="relative z-10 w-5 h-5" />
          <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100"></div>
        </a>
      )}
    </div>
  );
}
