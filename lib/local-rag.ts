/**
 * 로컬 RAG (Retrieval Augmented Generation) 시스템
 * Supabase 없이도 작동하는 간단한 정책 검색 시스템
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Policy {
  id: string;
  title: string;
  summary: string;
  category: string;
  region: string;
  ageMin?: number;
  ageMax?: number;
  supportDetails: string;
  requirements?: string;
  period?: string;
  applicationUrl?: string;
  hostOrganization?: string;
}

// 정책 데이터베이스 (실제로는 API나 DB에서 가져올 수 있음)
const POLICY_DATABASE: Policy[] = [
  {
    id: 'policy-001',
    title: '청년 월세 지원 사업',
    summary: '만 19세~34세 청년의 월세 부담을 덜어드립니다',
    category: '주거',
    region: '서울',
    ageMin: 19,
    ageMax: 34,
    supportDetails: '월 최대 20만원 지원 (최대 12개월)',
    requirements: '중위소득 150% 이하, 무주택 가구원, 임차보증금 5천만원 이하',
    period: '2026년 1월 ~ 12월',
    applicationUrl: 'https://www.youthcenter.go.kr',
    hostOrganization: '서울시청 주택정책과',
  },
  {
    id: 'policy-002',
    title: '청년 취업 성공 패키지',
    summary: '청년들의 취업을 종합적으로 지원합니다',
    category: '일자리',
    region: '전국',
    ageMin: 18,
    ageMax: 34,
    supportDetails: '진로상담, 직업훈련, 취업알선, 최대 300만원 훈련수당',
    requirements: '미취업 청년, 중위소득 100% 이하 우대',
    period: '연중 상시',
    applicationUrl: 'https://www.work.go.kr/youth',
    hostOrganization: '고용노동부',
  },
  {
    id: 'policy-003',
    title: '청년 창업 지원금',
    summary: '청년 창업자의 성공적인 사업 시작을 돕습니다',
    category: '창업',
    region: '전국',
    ageMin: 20,
    ageMax: 39,
    supportDetails: '사업화 자금 최대 1억원, 멘토링, 사무공간 제공',
    requirements: '예비창업자 또는 창업 3년 이내 기업',
    period: '2026년 2월 ~ 3월 (연 1회)',
    applicationUrl: 'https://www.k-startup.go.kr',
    hostOrganization: '중소벤처기업부',
  },
  {
    id: 'policy-004',
    title: '청년 내일저축계좌',
    summary: '일하는 청년의 자산형성을 지원합니다',
    category: '자산형성',
    region: '전국',
    ageMin: 19,
    ageMax: 34,
    supportDetails: '본인 저축액(월 10만원) + 정부지원금(월 30만원) = 3년 후 1,440만원',
    requirements: '근로소득이 있는 청년, 중위소득 100% 이하',
    period: '2026년 1월 ~ 2월 모집',
    applicationUrl: 'https://www.bokjiro.go.kr',
    hostOrganization: '보건복지부',
  },
  {
    id: 'policy-005',
    title: '서울시 청년수당',
    summary: '구직 중인 서울 청년에게 활동지원금을 지급합니다',
    category: '일자리',
    region: '서울',
    ageMin: 19,
    ageMax: 34,
    supportDetails: '월 50만원 (최대 6개월)',
    requirements: '서울 거주 미취업 청년, 중위소득 150% 이하',
    period: '2026년 분기별 모집',
    applicationUrl: 'https://youth.seoul.go.kr',
    hostOrganization: '서울시 청년정책담당관',
  },
  {
    id: 'policy-006',
    title: '청년 전세자금 대출',
    summary: '청년의 주거 안정을 위한 저금리 대출',
    category: '주거',
    region: '전국',
    ageMin: 19,
    ageMax: 34,
    supportDetails: '최대 3억원, 연 1.8%~2.4% 금리',
    requirements: '무주택 세대주, 부부합산 연소득 7천만원 이하',
    period: '연중 상시',
    applicationUrl: 'https://nhuf.molit.go.kr',
    hostOrganization: '주택도시기금',
  },
  {
    id: 'policy-007',
    title: 'K-디지털 트레이닝',
    summary: 'AI, 빅데이터 등 디지털 신기술 교육',
    category: '교육',
    region: '전국',
    ageMin: 18,
    ageMax: 34,
    supportDetails: '6개월 무료 교육 + 훈련장려금 월 최대 116만원',
    requirements: '미취업자 또는 재직자 (일부 과정)',
    period: '2026년 연중 수시 모집',
    applicationUrl: 'https://www.hrd.go.kr',
    hostOrganization: '고용노동부 HRD-Net',
  },
  {
    id: 'policy-008',
    title: '경기도 청년 노동자 통장',
    summary: '저임금 청년 노동자의 자산형성 지원',
    category: '자산형성',
    region: '경기',
    ageMin: 18,
    ageMax: 34,
    supportDetails: '본인 저축 월 10만원 + 경기도 지원 월 10만원 = 2년 후 480만원',
    requirements: '경기도 거주, 월평균 소득 230만원 이하',
    period: '2026년 3월 모집',
    applicationUrl: 'https://www.gg.go.kr',
    hostOrganization: '경기도청',
  },
  {
    id: 'policy-009',
    title: '부산 청년 어촌정착 지원',
    summary: '어촌 지역 정착을 희망하는 청년을 지원합니다',
    category: '일자리',
    region: '부산',
    ageMin: 18,
    ageMax: 39,
    supportDetails: '정착지원금 월 100만원 (최대 3년), 주거지원',
    requirements: '부산 어촌 지역 이주 및 정착 의향',
    period: '2026년 3월 ~ 4월',
    applicationUrl: 'https://www.busan.go.kr',
    hostOrganization: '부산시 해양수산국',
  },
  {
    id: 'policy-010',
    title: '청년 해외진출 지원 사업',
    summary: '해외 취업 및 창업을 준비하는 청년 지원',
    category: '일자리',
    region: '전국',
    ageMin: 18,
    ageMax: 34,
    supportDetails: '해외 인턴십, 어학연수, 현지 정착 지원금',
    requirements: '해외 진출 희망자',
    period: '2026년 4월 ~ 5월',
    applicationUrl: 'https://www.worldjob.or.kr',
    hostOrganization: '한국산업인력공단',
  },
  {
    id: 'policy-011',
    title: '청년 마음건강 지원',
    summary: '청년의 정신건강 상담 및 치료비를 지원합니다',
    category: '복지',
    region: '전국',
    ageMin: 19,
    ageMax: 34,
    supportDetails: '심리상담 최대 8회 무료, 치료비 연 50만원 지원',
    requirements: '만 19~34세 청년',
    period: '연중 상시',
    applicationUrl: 'https://www.mentalhealth.or.kr',
    hostOrganization: '보건복지부',
  },
  {
    id: 'policy-012',
    title: '청년 농업인 영농정착 지원',
    summary: '농업에 종사하는 청년에게 정착 지원금 제공',
    category: '일자리',
    region: '전국',
    ageMin: 18,
    ageMax: 40,
    supportDetails: '월 최대 100만원 (최대 3년)',
    requirements: '독립경영 1년 이상 청년 농업인',
    period: '2026년 1월 ~ 2월',
    applicationUrl: 'https://www.youngnong.or.kr',
    hostOrganization: '농림축산식품부',
  },
  {
    id: 'policy-013',
    title: '인천 청년 공간 지원',
    summary: '청년 창업·활동 공간을 무료로 제공합니다',
    category: '창업',
    region: '인천',
    ageMin: 19,
    ageMax: 39,
    supportDetails: '공유오피스, 회의실, 작업실 무료 이용',
    requirements: '인천 거주 또는 인천에서 활동하는 청년',
    period: '연중 상시',
    applicationUrl: 'https://www.incheon.go.kr',
    hostOrganization: '인천시 청년정책과',
  },
  {
    id: 'policy-014',
    title: '대전 청년 문화패스',
    summary: '대전 청년에게 문화생활 지원금 제공',
    category: '문화',
    region: '대전',
    ageMin: 19,
    ageMax: 34,
    supportDetails: '연 20만원 문화비 지원 (공연, 영화, 전시 등)',
    requirements: '대전 거주 청년',
    period: '2026년 상반기 모집',
    applicationUrl: 'https://www.daejeon.go.kr',
    hostOrganization: '대전시 문화체육관광국',
  },
  {
    id: 'policy-015',
    title: '광주 청년 교통비 지원',
    summary: '대중교통 이용 청년에게 교통비 지원',
    category: '복지',
    region: '광주',
    ageMin: 19,
    ageMax: 34,
    supportDetails: '월 최대 5만원 교통비 지원',
    requirements: '광주 거주 청년, 대중교통 이용자',
    period: '연중 상시',
    applicationUrl: 'https://www.gwangju.go.kr',
    hostOrganization: '광주시청',
  },
];

// 카테고리 키워드 매핑
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '주거': ['월세', '전세', '집', '주거', '임대', '보증금', '자취', '원룸', '아파트', '살', '사는'],
  '일자리': ['취업', '일자리', '직업', '직장', '구직', '채용', '알바', '정규직', '인턴', '취직', '직무'],
  '창업': ['창업', '사업', '스타트업', '자영업', '개업', '창작', '프리랜서'],
  '자산형성': ['저축', '자산', '통장', '적금', '목돈', '돈', '재테크', '금융'],
  '교육': ['교육', '학습', '훈련', '기술', '자격증', '학원', '강의', '공부', 'IT', '개발', '프로그래밍', '코딩'],
  '복지': ['복지', '지원금', '수당', '건강', '의료', '심리', '상담', '교통비', '생활'],
  '문화': ['문화', '예술', '공연', '영화', '전시', '취미', '여가'],
};

// 지역 키워드 매핑
const REGION_KEYWORDS: Record<string, string[]> = {
  '서울': ['서울', '강남', '강북', '송파', '마포', '영등포', '종로', '용산'],
  '경기': ['경기', '수원', '성남', '고양', '용인', '부천', '안양', '안산', '의정부', '화성', '광명', '평택', '시흥', '파주', '김포'],
  '부산': ['부산', '해운대', '서면', '동래'],
  '인천': ['인천', '송도', '부평', '계양'],
  '대전': ['대전', '유성', '서구'],
  '광주': ['광주', '동구', '서구', '남구', '북구', '광산구'],
  '대구': ['대구', '동구', '서구', '남구', '북구', '수성', '달서'],
  '울산': ['울산'],
  '세종': ['세종'],
  '강원': ['강원', '춘천', '원주', '강릉', '속초'],
  '충북': ['충북', '청주', '충주', '제천'],
  '충남': ['충남', '천안', '아산', '서산'],
  '전북': ['전북', '전주', '익산', '군산'],
  '전남': ['전남', '목포', '여수', '순천'],
  '경북': ['경북', '포항', '경주', '구미', '안동'],
  '경남': ['경남', '창원', '김해', '진주', '양산'],
  '제주': ['제주', '서귀포'],
  '전국': ['전국', '전체', '어디서나'],
};

/**
 * 사용자 질문에서 컨텍스트 추출
 */
export function extractQueryContext(query: string): {
  age?: number;
  region?: string;
  categories: string[];
  keywords: string[];
} {
  const result: {
    age?: number;
    region?: string;
    categories: string[];
    keywords: string[];
  } = {
    categories: [],
    keywords: [],
  };

  // 나이 추출
  const ageMatch = query.match(/(\d{1,2})살|(\d{1,2})세|만\s*(\d{1,2})/);
  if (ageMatch) {
    result.age = parseInt(ageMatch[1] || ageMatch[2] || ageMatch[3]);
  }

  // 지역 추출
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(kw => query.includes(kw))) {
      result.region = region;
      break;
    }
  }

  // 카테고리 추출
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => query.includes(kw))) {
      result.categories.push(category);
    }
  }

  // 키워드 추출 (주요 단어들)
  const allKeywords = [
    ...Object.values(CATEGORY_KEYWORDS).flat(),
    ...Object.values(REGION_KEYWORDS).flat(),
  ];
  result.keywords = allKeywords.filter(kw => query.includes(kw));

  return result;
}

/**
 * 정책 검색 (키워드 기반)
 */
export function searchPolicies(
  query: string,
  options: {
    limit?: number;
    age?: number;
    region?: string;
  } = {}
): Policy[] {
  const { limit = 5, age, region } = options;
  const context = extractQueryContext(query);
  
  // 사용자가 제공한 나이/지역이 있으면 그것 사용
  const userAge = age || context.age;
  const userRegion = region || context.region;

  // 점수 기반 정책 검색
  const scoredPolicies = POLICY_DATABASE.map(policy => {
    let score = 0;

    // 나이 필터 (해당하면 +10점, 해당 안하면 제외)
    if (userAge) {
      const minAge = policy.ageMin || 0;
      const maxAge = policy.ageMax || 99;
      if (userAge >= minAge && userAge <= maxAge) {
        score += 10;
      } else {
        return { policy, score: -1 }; // 나이가 안 맞으면 제외
      }
    }

    // 지역 필터 (+5점)
    if (userRegion) {
      if (policy.region === userRegion || policy.region === '전국') {
        score += 5;
      } else {
        score -= 3; // 지역이 다르면 감점
      }
    }

    // 카테고리 매칭 (+3점 per category)
    for (const category of context.categories) {
      if (policy.category === category) {
        score += 3;
      }
    }

    // 키워드 매칭 (+1점 per keyword)
    const policyText = `${policy.title} ${policy.summary} ${policy.supportDetails} ${policy.requirements || ''}`.toLowerCase();
    for (const keyword of context.keywords) {
      if (policyText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    // 쿼리의 단어들이 정책 텍스트에 포함되는지 확인 (+0.5점 per word)
    const queryWords = query.split(/\s+/).filter(w => w.length > 1);
    for (const word of queryWords) {
      if (policyText.includes(word.toLowerCase())) {
        score += 0.5;
      }
    }

    return { policy, score };
  });

  // 점수순 정렬 및 필터링
  return scoredPolicies
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ policy }) => policy);
}

/**
 * 정책을 프롬프트 컨텍스트로 변환
 */
export function policiesToContext(policies: Policy[]): string {
  if (policies.length === 0) {
    return '관련 정책을 찾지 못했습니다.';
  }

  return policies.map((policy, index) => `
[정책 ${index + 1}] ${policy.title}
- 카테고리: ${policy.category}
- 지역: ${policy.region}
- 대상 연령: ${policy.ageMin || '제한없음'}세 ~ ${policy.ageMax || '제한없음'}세
- 지원 내용: ${policy.supportDetails}
- 신청 요건: ${policy.requirements || '별도 요건 없음'}
- 신청 기간: ${policy.period || '상시'}
- 운영 기관: ${policy.hostOrganization || '미지정'}
- 신청 URL: ${policy.applicationUrl || '확인 필요'}
`).join('\n');
}

/**
 * RAG 검색 수행 (메인 함수)
 */
export async function performRAGSearch(
  query: string,
  apiKey?: string
): Promise<{
  policies: Policy[];
  context: string;
  queryInfo: ReturnType<typeof extractQueryContext>;
}> {
  const queryInfo = extractQueryContext(query);
  
  // 키워드 기반 검색
  const policies = searchPolicies(query, {
    age: queryInfo.age,
    region: queryInfo.region,
    limit: 5,
  });

  const context = policiesToContext(policies);

  return {
    policies,
    context,
    queryInfo,
  };
}

/**
 * 모든 정책 가져오기 (관리용)
 */
export function getAllPolicies(): Policy[] {
  return [...POLICY_DATABASE];
}

/**
 * 정책 데이터베이스에 정책 추가 (확장용)
 */
export function addPolicy(policy: Policy): void {
  POLICY_DATABASE.push(policy);
}
