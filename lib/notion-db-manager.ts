import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

let cachedDatabaseId: string | null = null;

interface PolicyToSave {
  policyName: string;
  category: string;
  supportDetails: string;
  region: string;
  period: string;
  applicationUrl?: string;
  hostOrganization: string;
  requirements?: string;
}

/**
 * 새로운 정책 데이터베이스 생성
 */
async function createPolicyDatabase(): Promise<string> {
  const parentPageId = process.env.NOTION_PAGE_ID;
  
  if (!parentPageId) {
    throw new Error('NOTION_PAGE_ID_REQUIRED');
  }

  console.log('🏗️ 새 Notion 데이터베이스 생성 중...');
  
  try {
    const response = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: parentPageId,
      },
      title: [
        {
          type: 'text',
          text: {
            content: '폴리AI청년정책북마크',
          },
        },
      ],
      properties: {
        '정책명': {
          title: {},
        },
        '카테고리': {
          select: {
            options: [
              { name: '주거', color: 'blue' },
              { name: '일자리', color: 'green' },
              { name: '창업', color: 'purple' },
              { name: '교육', color: 'orange' },
              { name: '자산형성', color: 'pink' },
              { name: '기타', color: 'gray' },
            ],
          },
        },
        '지역': {
          select: {
            options: [
              { name: '전국', color: 'default' },
              { name: '서울', color: 'blue' },
              { name: '경기', color: 'green' },
              { name: '인천', color: 'purple' },
              { name: '부산', color: 'orange' },
              { name: '대구', color: 'red' },
              { name: '광주', color: 'pink' },
              { name: '대전', color: 'yellow' },
            ],
          },
        },
        '지원내용': {
          rich_text: {},
        },
        '신청기간': {
          rich_text: {},
        },
        '신청링크': {
          url: {},
        },
        '운영기관': {
          rich_text: {},
        },
        '신청상태': {
          select: {
            options: [
              { name: '관심있음', color: 'blue' },
              { name: '신청예정', color: 'yellow' },
              { name: '신청완료', color: 'green' },
              { name: '서류준비중', color: 'orange' },
            ],
          },
        },
        '저장일': {
          date: {},
        },
        '메모': {
          rich_text: {},
        },
      },
    });

    console.log('✅ 데이터베이스 생성 완료:', response.id);
    cachedDatabaseId = response.id;
    return response.id;
  } catch (error: any) {
    console.error('❌ 데이터베이스 생성 실패:', error.message);
    throw error;
  }
}

/**
 * 기존 데이터베이스 찾기 또는 새로 생성하기
 */
export async function getOrCreatePolicyDatabase(): Promise<string> {
  // 캐시된 ID가 있으면 사용
  if (cachedDatabaseId) {
    try {
      await notion.databases.retrieve({ database_id: cachedDatabaseId });
      console.log('✅ 캐시된 데이터베이스 사용:', cachedDatabaseId);
      return cachedDatabaseId;
    } catch {
      console.log('⚠️ 캐시된 ID가 유효하지 않음, 새로 검색');
      cachedDatabaseId = null;
    }
  }

  try {
    // 1. 기존 데이터베이스 검색
    console.log('🔍 기존 데이터베이스 검색 중...');
    const response = await notion.search({
      query: '폴리AI청년정책북마크',
      filter: {
        property: 'object',
        value: 'database',
      },
      page_size: 10,
    });

    // '정책명' 속성이 있는 데이터베이스 찾기
    for (const item of response.results) {
      if (item.object !== 'database') continue;
      
      const db = item as any;
      const properties = db.properties;
      
      if (properties && properties['정책명']) {
        cachedDatabaseId = db.id;
        console.log('✅ 기존 데이터베이스 찾음:', db.id);
        return db.id;
      }
    }

    // 2. 없으면 자동 생성
    console.log('📝 데이터베이스가 없습니다. 새로 생성합니다...');
    return await createPolicyDatabase();

  } catch (error: any) {
    console.error('❌ 데이터베이스 처리 실패:', error.message);
    
    if (error.message === 'NOTION_PAGE_ID_REQUIRED') {
      throw new Error(`📚 Notion 데이터베이스 자동 생성을 위해 설정이 필요해요!

🎯 **2분 설정:**

1️⃣ Notion에서 빈 페이지 생성
2️⃣ 페이지 링크 복사 (우측 상단 ⋯ → Copy link)
3️⃣ .env.local 파일에 추가:

NOTION_PAGE_ID=여기에_페이지_ID_붙여넣기

4️⃣ 서버 재시작!

**또는 수동으로 데이터베이스 만들기:**
- 상세 가이드: NOTION_SETUP.md 파일 참고
- 템플릿: https://www.notion.so/200bbea52c2a4b908c3a9a219f3f2a81

설정 후 "저장해줘"라고 하면 자동으로 저장돼요! 🚀`);
    }
    
    throw new Error('Notion 데이터베이스가 없어요! "데이터베이스 만들어줘"라고 말하면 제가 만들어드릴게요!');
  }
}

/**
 * 정책을 Notion 데이터베이스에 저장
 */
export async function savePolicyToNotion(policyData: PolicyToSave): Promise<string> {
  try {
    const databaseId = await getOrCreatePolicyDatabase();
    
    const properties: any = {
      '정책명': { title: [{ text: { content: policyData.policyName } }] },
      '카테고리': { select: { name: policyData.category || '기타' } },
      '지원내용': { rich_text: [{ text: { content: policyData.supportDetails || '' } }] },
      '지역': { select: { name: policyData.region || '전국' } },
      '신청기간': { rich_text: [{ text: { content: policyData.period || '' } }] },
      '신청링크': { url: policyData.applicationUrl || null },
      '운영기관': { rich_text: [{ text: { content: policyData.hostOrganization || '' } }] },
      '신청상태': { select: { name: '관심있음' } },
      '저장일': { date: { start: new Date().toISOString().split('T')[0] } },
      '메모': { rich_text: [{ text: { content: policyData.requirements || '' } }] },
    };

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties,
    });

    console.log('✅ Notion 저장 성공:', response.url);
    return response.url;
  } catch (error: any) {
    console.error('❌ Notion 저장 실패:', error.message);
    throw error;
  }
}
