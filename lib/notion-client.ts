/**
 * Notion API 클라이언트
 * 정책을 Notion 데이터베이스에 직접 저장합니다
 */

import { Client } from '@notionhq/client';

// Notion 클라이언트 (lazy initialization)
let notion: Client | null = null;

function getNotionClient(): Client | null {
  if (!notion) {
    const apiKey = process.env.NOTION_API_KEY;
    if (apiKey) {
      notion = new Client({ auth: apiKey });
      console.log('✅ Notion 클라이언트 초기화 완료');
    } else {
      console.warn('⚠️ NOTION_API_KEY가 설정되지 않았습니다');
    }
  }
  return notion;
}

export interface PolicyToSave {
  title: string;
  category: string;
  region: string;
  ageRange?: string;
  supportDetails: string;
  requirements?: string;
  period?: string;
  applicationUrl?: string;
  hostOrganization?: string;
}

/**
 * Notion 데이터베이스에 정책 저장
 */
export async function savePolicyToNotion(policy: PolicyToSave): Promise<{
  success: boolean;
  pageUrl?: string;
  error?: string;
}> {
  const client = getNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!client) {
    return {
      success: false,
      error: 'Notion API 키가 설정되지 않았습니다. .env.local 파일에 NOTION_API_KEY를 추가해주세요.',
    };
  }

  if (!databaseId) {
    return {
      success: false,
      error: 'Notion 데이터베이스 ID가 설정되지 않았습니다. .env.local 파일에 NOTION_DATABASE_ID를 추가해주세요.',
    };
  }

  try {
    // 카테고리 이모지 매핑
    const categoryEmoji: Record<string, string> = {
      '주거': '🏠',
      '일자리': '💼',
      '창업': '🚀',
      '교육': '📚',
      '자산형성': '💰',
      '복지': '🩺',
      '문화': '🎨',
      '기타': '📋',
    };

    const emoji = categoryEmoji[policy.category] || '📋';

    // Notion 페이지 생성
    const response = await client.pages.create({
      parent: { database_id: databaseId },
      icon: { type: 'emoji', emoji: emoji as any },
      properties: {
        // 제목 (Title)
        '정책명': {
          title: [{ text: { content: policy.title } }],
        },
        // 카테고리 (Select)
        '카테고리': {
          select: { name: policy.category || '기타' },
        },
        // 지역 (Select)
        '지역': {
          select: { name: policy.region || '전국' },
        },
        // 지원 내용 (Rich Text)
        '지원내용': {
          rich_text: [{ text: { content: policy.supportDetails || '' } }],
        },
        // 신청 요건 (Rich Text)
        '신청요건': {
          rich_text: [{ text: { content: policy.requirements || '별도 요건 없음' } }],
        },
        // 신청 기간 (Rich Text)
        '신청기간': {
          rich_text: [{ text: { content: policy.period || '상시' } }],
        },
        // 운영 기관 (Rich Text)
        '운영기관': {
          rich_text: [{ text: { content: policy.hostOrganization || '' } }],
        },
        // 신청 URL (URL)
        '신청링크': {
          url: policy.applicationUrl || null,
        },
        // 대상 연령 (Rich Text)
        '대상연령': {
          rich_text: [{ text: { content: policy.ageRange || '제한 없음' } }],
        },
        // 저장일 (Date)
        '저장일': {
          date: { start: new Date().toISOString().split('T')[0] },
        },
        // 상태 (Select)
        '상태': {
          select: { name: '관심있음' },
        },
      },
    });

    // 페이지 URL 생성
    const pageUrl = `https://notion.so/${(response as any).id.replace(/-/g, '')}`;

    console.log('✅ Notion에 정책 저장 완료:', policy.title);
    console.log('🔗 페이지 URL:', pageUrl);

    return {
      success: true,
      pageUrl,
    };
  } catch (error: any) {
    console.error('❌ Notion 저장 실패:', error);
    
    // 에러 메시지 친절하게 변환
    let errorMessage = error.message || '알 수 없는 오류';
    
    if (error.code === 'object_not_found') {
      errorMessage = '데이터베이스를 찾을 수 없습니다. NOTION_DATABASE_ID가 올바른지, Integration이 데이터베이스에 연결되었는지 확인해주세요.';
    } else if (error.code === 'unauthorized') {
      errorMessage = 'Notion API 인증에 실패했습니다. NOTION_API_KEY가 올바른지 확인해주세요.';
    } else if (error.code === 'validation_error') {
      errorMessage = '데이터베이스 스키마가 맞지 않습니다. Notion 데이터베이스에 필요한 속성들이 있는지 확인해주세요.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Notion 연결 상태 확인
 */
export function isNotionEnabled(): boolean {
  return !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID);
}

/**
 * Notion 설정 상태 가져오기
 */
export function getNotionStatus(): {
  enabled: boolean;
  hasApiKey: boolean;
  hasDatabaseId: boolean;
} {
  return {
    enabled: isNotionEnabled(),
    hasApiKey: !!process.env.NOTION_API_KEY,
    hasDatabaseId: !!process.env.NOTION_DATABASE_ID,
  };
}
