import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

export const runtime = 'nodejs';

// Notion 데이터베이스 생성 API
export async function POST(req: Request) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'NOTION_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.' 
      }, { status: 400 });
    }
    
    const notion = new Client({ auth: apiKey });
    
    console.log('📝 청년정책북마크 데이터베이스 생성 중...');
    
    // 먼저 부모 페이지 생성
    const parentPage = await notion.pages.create({
      parent: { type: 'workspace', workspace: true },
      icon: { type: 'emoji', emoji: '📚' },
      properties: {
        title: {
          title: [{ text: { content: '폴리 AI - 청년정책 관리' } }],
        },
      },
    });
    
    console.log('✅ 부모 페이지 생성 완료:', parentPage.id);
    
    // 그 아래에 데이터베이스 생성
    const database = await notion.databases.create({
      parent: { type: 'page_id', page_id: parentPage.id },
      icon: { type: 'emoji', emoji: '📋' },
      title: [{ type: 'text', text: { content: '청년정책북마크' } }],
      properties: {
        '정책명': { title: {} },
        '카테고리': {
          select: {
            options: [
              { name: '주거', color: 'blue' },
              { name: '일자리', color: 'green' },
              { name: '창업', color: 'orange' },
              { name: '교육', color: 'purple' },
              { name: '자산형성', color: 'yellow' },
              { name: '복지', color: 'pink' },
              { name: '문화', color: 'red' },
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
              { name: '부산', color: 'orange' },
              { name: '인천', color: 'purple' },
              { name: '대전', color: 'yellow' },
              { name: '광주', color: 'pink' },
              { name: '대구', color: 'red' },
            ],
          },
        },
        '지원내용': { rich_text: {} },
        '신청요건': { rich_text: {} },
        '신청기간': { rich_text: {} },
        '신청링크': { url: {} },
        '운영기관': { rich_text: {} },
        '대상연령': { rich_text: {} },
        '저장일': { date: {} },
        '상태': {
          select: {
            options: [
              { name: '관심있음', color: 'gray' },
              { name: '신청예정', color: 'yellow' },
              { name: '신청완료', color: 'blue' },
              { name: '승인완료', color: 'green' },
            ],
          },
        },
      },
    });
    
    console.log('✅ 데이터베이스 생성 완료!');
    console.log('📋 Database ID:', database.id);
    
    const databaseUrl = `https://notion.so/${database.id.replace(/-/g, '')}`;
    
    return NextResponse.json({ 
      success: true, 
      databaseId: database.id,
      databaseUrl: databaseUrl,
      parentPageId: parentPage.id,
      message: '데이터베이스가 성공적으로 생성되었습니다! .env.local에 NOTION_DATABASE_ID를 추가해주세요.',
    });
    
  } catch (error: any) {
    console.error('❌ 데이터베이스 생성 실패:', error);
    
    let errorMessage = error.message;
    if (error.code === 'unauthorized') {
      errorMessage = 'Notion API 키가 유효하지 않습니다. 키를 확인해주세요.';
    } else if (error.code === 'restricted_resource') {
      errorMessage = 'Integration에 워크스페이스 권한이 없습니다. Notion에서 Integration 설정을 확인해주세요.';
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: error.body || error.message,
    }, { status: 500 });
  }
}

// 현재 설정 상태 확인
export async function GET() {
  const hasApiKey = !!process.env.NOTION_API_KEY;
  const hasDatabaseId = !!process.env.NOTION_DATABASE_ID;
  
  return NextResponse.json({
    configured: hasApiKey && hasDatabaseId,
    hasApiKey,
    hasDatabaseId,
    message: hasApiKey 
      ? (hasDatabaseId ? 'Notion이 완전히 설정되어 있습니다!' : 'API 키는 있지만 Database ID가 없습니다.')
      : 'NOTION_API_KEY가 설정되지 않았습니다.',
  });
}
