/**
 * 온라인청년센터 API 연동 모듈
 * 공공데이터포털의 청년정책 API를 호출하여 정책 정보를 가져옵니다.
 */

export interface PolicySearchParams {
  age?: number;
  region?: string;
  keyword?: string;
  category?: string;
  limit?: number;
}

export interface Policy {
  id: string;
  title: string;
  summary: string;
  category: string;
  region: string;
  ageMin?: number;
  ageMax?: number;
  supportDetails: string;
  period: string;
  applicationUrl?: string;
  hostOrganization: string;
  requirements?: string;
}

/**
 * 청년 정책 검색
 */
export async function searchYouthPolicies(
  params: PolicySearchParams
): Promise<Policy[]> {
  const apiKey = process.env.YOUTH_CENTER_API_KEY;
  
  // API 키가 없으면 목업 데이터 반환
  if (!apiKey || apiKey === 'your_youth_center_api_key_here') {
    console.warn('⚠️ 온라인청년센터 API 키가 설정되지 않았습니다. 목업 데이터를 사용합니다.');
    return getMockPolicies(params);
  }

  try {
    // 실제 API 호출 (공공데이터포털 API 엔드포인트)
    const baseUrl = 'https://www.youthcenter.go.kr/opi/openapi/youthPolicy.do';
    const url = new URL(baseUrl);
    
    url.searchParams.append('openApiVlak', apiKey);
    url.searchParams.append('display', String(params.limit || 10));
    
    if (params.keyword) {
      url.searchParams.append('query', params.keyword);
    }
    
    if (params.region) {
      url.searchParams.append('srchPolyBizSecd', getRegionCode(params.region));
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.statusText}`);
    }

    const data = await response.json();
    
    // API 응답을 Policy 형식으로 변환
    return parsePolicyResponse(data, params);
    
  } catch (error) {
    console.error('청년 정책 API 호출 중 오류:', error);
    // 오류 발생 시 목업 데이터 반환
    return getMockPolicies(params);
  }
}

/**
 * 지역명을 코드로 변환
 */
function getRegionCode(region: string): string {
  const regionMap: Record<string, string> = {
    '서울': '003002001',
    '부산': '003002002',
    '대구': '003002003',
    '인천': '003002004',
    '광주': '003002005',
    '대전': '003002006',
    '울산': '003002007',
    '세종': '003002008',
    '경기': '003002009',
    '강원': '003002010',
    '충북': '003002011',
    '충남': '003002012',
    '전북': '003002013',
    '전남': '003002014',
    '경북': '003002015',
    '경남': '003002016',
    '제주': '003002017',
  };
  
  return regionMap[region] || '003002001'; // 기본값: 서울
}

/**
 * API 응답을 Policy 형식으로 변환
 */
function parsePolicyResponse(data: any, params: PolicySearchParams): Policy[] {
  // 실제 API 응답 구조에 맞게 파싱
  // 이 부분은 실제 API 응답 구조를 확인한 후 수정 필요
  
  if (!data || !data.youthPolicyList) {
    return [];
  }

  return data.youthPolicyList
    .filter((item: any) => {
      // 나이 필터링
      if (params.age) {
        const age = params.age;
        const minAge = item.ageInfo?.match(/(\d+)세 이상/)?.[1];
        const maxAge = item.ageInfo?.match(/(\d+)세 이하/)?.[1];
        
        if (minAge && age < parseInt(minAge)) return false;
        if (maxAge && age > parseInt(maxAge)) return false;
      }
      
      return true;
    })
    .map((item: any) => ({
      id: item.bizId || item.polyBizSjnm,
      title: item.polyBizSjnm || '제목 없음',
      summary: item.polyItcnCn || '',
      category: item.polyRlmCd || '기타',
      region: item.polyBizSecd || '전국',
      supportDetails: item.sporCn || '',
      period: `${item.rqutPrdCn || '상시'}`,
      applicationUrl: item.rfcSiteUrla1 || item.rfcSiteUrla2 || '',
      hostOrganization: item.cnsgNmor || item.bizPrchDprtNm || '미지정',
      requirements: item.majrRqisCn || '',
    }));
}

/**
 * 목업 데이터 (API 키가 없거나 테스트용)
 */
function getMockPolicies(params: PolicySearchParams): Policy[] {
  const allMockPolicies: Policy[] = [
    {
      id: 'mock-001',
      title: '청년 월세 지원 사업',
      summary: '만 19세~34세 청년에게 월세 일부를 지원하는 정책입니다.',
      category: '주거',
      region: params.region || '서울',
      ageMin: 19,
      ageMax: 34,
      supportDetails: '월 최대 20만원 지원 (최대 12개월)',
      period: '2026년 1월 ~ 12월',
      applicationUrl: 'https://www.youthcenter.go.kr',
      hostOrganization: '서울시청',
      requirements: '중위소득 150% 이하, 무주택 가구',
    },
    {
      id: 'mock-002',
      title: '청년 취업 성공 패키지',
      summary: '미취업 청년에게 진로 설계와 취업 지원을 제공합니다.',
      category: '일자리',
      region: params.region || '전국',
      ageMin: 18,
      ageMax: 34,
      supportDetails: '진로상담, 직업훈련, 취업알선, 최대 300만원 지원',
      period: '연중 상시',
      applicationUrl: 'https://www.work.go.kr/ysp',
      hostOrganization: '고용노동부',
      requirements: '만 18-34세 미취업자',
    },
    {
      id: 'mock-003',
      title: '청년 창업 지원금',
      summary: '예비 창업자와 초기 창업자를 위한 사업화 자금을 지원합니다.',
      category: '창업',
      region: params.region || '전국',
      ageMin: 19,
      ageMax: 39,
      supportDetails: '사업화 자금 최대 1억원, 멘토링 지원',
      period: '2026년 2월 ~ 3월 신청',
      applicationUrl: 'https://www.k-startup.go.kr',
      hostOrganization: '중소벤처기업부',
      requirements: '만 39세 이하 예비창업자 또는 3년 이내 창업기업',
    },
    {
      id: 'mock-004',
      title: '청년 내일채움공제',
      summary: '중소·중견기업 재직 청년의 자산 형성을 지원합니다.',
      category: '자산형성',
      region: '전국',
      ageMin: 15,
      ageMax: 34,
      supportDetails: '2년형: 1,600만원, 3년형: 3,000만원 지급',
      period: '연중 상시 (기업 신청)',
      applicationUrl: 'https://www.sbcplan.or.kr',
      hostOrganization: '고용노동부',
      requirements: '정규직 채용 청년, 5인 이상 중소·중견기업',
    },
    {
      id: 'mock-005',
      title: '청년 교육비 지원',
      summary: '저소득 청년의 학자금 및 교육비를 지원합니다.',
      category: '교육',
      region: params.region || '서울',
      ageMin: 19,
      ageMax: 29,
      supportDetails: '학기당 최대 150만원 지원',
      period: '학기별 신청 (2월, 8월)',
      applicationUrl: 'https://www.kosaf.go.kr',
      hostOrganization: '한국장학재단',
      requirements: '중위소득 100% 이하, 재학생',
    },
  ];

  // 필터링
  return allMockPolicies.filter(policy => {
    if (params.age && policy.ageMin && policy.ageMax) {
      if (params.age < policy.ageMin || params.age > policy.ageMax) {
        return false;
      }
    }
    
    if (params.region && policy.region !== '전국' && policy.region !== params.region) {
      return false;
    }
    
    if (params.keyword) {
      const searchTerm = params.keyword.toLowerCase();
      return (
        policy.title.toLowerCase().includes(searchTerm) ||
        policy.summary.toLowerCase().includes(searchTerm) ||
        policy.category.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  }).slice(0, params.limit || 5);
}
