import { NextRequest, NextResponse } from 'next/server';
import { savePolicyToNotion, getNotionStatus } from '@/lib/notion-client';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    console.log('📝 Notion에 정책 저장 요청:', data);
    
    // Notion에 직접 저장
    const result = await savePolicyToNotion({
      title: data.title || data.정책명 || data.policyName,
      category: data.category || data.카테고리 || '기타',
      region: data.region || data.지역 || '전국',
      ageRange: data.ageRange || data.대상연령,
      supportDetails: data.supportDetails || data.지원내용 || '',
      requirements: data.requirements || data.신청요건,
      period: data.period || data.신청기간 || '상시',
      applicationUrl: data.applicationUrl || data.신청링크,
      hostOrganization: data.hostOrganization || data.운영기관 || '미지정',
    });

    if (result.success) {
      console.log('🎉 Notion에 정책 저장 완료!');
      
      return NextResponse.json({
        success: true,
        message: 'Notion에 저장되었습니다!',
        pageUrl: result.pageUrl,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// Notion 연결 상태 조회
export async function GET() {
  try {
    const status = getNotionStatus();
    
    return NextResponse.json({
      success: true,
      notion: status,
      message: status.enabled 
        ? 'Notion이 연결되어 있습니다.' 
        : 'Notion 설정이 필요합니다.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
