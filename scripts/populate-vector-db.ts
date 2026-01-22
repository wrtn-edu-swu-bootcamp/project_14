/**
 * 정책 데이터를 벡터 DB에 초기 로딩하는 스크립트
 * 
 * 실행 방법:
 * npx tsx scripts/populate-vector-db.ts
 */

// .env.local 파일을 먼저 로딩 (import 전에!)
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

// 환경 변수 확인
console.log('🔍 환경 변수 확인:');
console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ 설정됨' : '❌ 없음');
console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음');
console.log('  SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음');
console.log('');

import { savePolicyToVectorDB } from '../lib/gemini-vector-db';

// 샘플 정책 데이터 (실제로는 온라인청년센터 API에서 가져와야 합니다)
const samplePolicies = [
  {
    id: 'R2024010100001',
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
    id: 'R2024010200002',
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
    id: 'R2024010300003',
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
    id: 'R2024010400004',
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
    id: 'R2024010500005',
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
    id: 'R2024010600006',
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
    id: 'R2024010700007',
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
    id: 'R2024010800008',
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
    id: 'R2024010900009',
    title: '청년 노동자 통장',
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
    id: 'R2024011000010',
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
];

async function main() {
  console.log('🚀 벡터 DB 초기 데이터 로딩 시작...\n');

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY가 설정되지 않았습니다!');
    console.log('💡 .env.local 파일에 GEMINI_API_KEY를 추가하세요.');
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Supabase 설정이 필요합니다!');
    console.log('💡 .env.local 파일에 다음을 추가하세요:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  // Rate Limit 방지: 딜레이 함수
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < samplePolicies.length; i++) {
    const policy = samplePolicies[i];
    let retries = 3; // 최대 3번 재시도
    let success = false;

    while (retries > 0 && !success) {
      try {
        console.log(`[${i + 1}/${samplePolicies.length}] 처리 중: ${policy.title}...`);
        await savePolicyToVectorDB(policy);
        console.log(`✅ 성공!`);
        successCount++;
        success = true;
        
        // Rate Limit 방지: 각 요청 사이에 3초 대기
        if (i < samplePolicies.length - 1) {
          console.log('⏳ 3초 대기 중...\n');
          await delay(3000);
        }
      } catch (error: any) {
        retries--;
        
        // Rate Limit 에러인 경우 더 길게 대기
        if (error?.status === 429) {
          const waitTime = 60; // 60초 대기
          console.log(`⚠️ Rate Limit 감지! ${waitTime}초 대기 후 재시도... (남은 시도: ${retries})`);
          await delay(waitTime * 1000);
        } else {
          console.error(`❌ 오류 발생 (남은 시도: ${retries}):`, error.message);
          if (retries > 0) {
            await delay(5000); // 일반 오류는 5초만 대기
          }
        }
        
        if (retries === 0) {
          console.error(`❌ 최종 실패: ${policy.title}\n`);
          failCount++;
        }
      }
    }
  }

  console.log('\n✅ 완료!');
  console.log(`  성공: ${successCount}개`);
  console.log(`  실패: ${failCount}개`);
  console.log('\n🎉 이제 폴리 AI가 의미론적 검색을 사용할 수 있습니다!');
}

main().catch(console.error);
