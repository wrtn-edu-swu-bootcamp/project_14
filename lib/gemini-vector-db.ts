import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Supabase 클라이언트 (lazy initialization)
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase 클라이언트 초기화 완료');
    } else {
      console.warn('⚠️ Supabase 설정이 없습니다');
    }
  }
  return supabase;
}

// Gemini 클라이언트 (lazy initialization)
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini 클라이언트 초기화 완료');
    } else {
      console.warn('⚠️ Gemini API key가 설정되지 않았습니다');
    }
  }
  return genAI;
}

/**
 * 텍스트를 벡터로 변환 (Gemini Embeddings)
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini client not initialized');
  }
  
  try {
    const model = client.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    
    return result.embedding.values;
  } catch (error) {
    console.error('임베딩 생성 실패:', error);
    throw error;
  }
}

/**
 * 정책 데이터를 벡터 DB에 저장
 */
export async function savePolicyToVectorDB(policy: {
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
}) {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('⚠️ Supabase가 설정되지 않았습니다. 벡터 DB 사용 불가.');
    return null;
  }

  try {
    // 정책 정보를 하나의 텍스트로 결합 (검색용)
    const searchableText = `
      정책명: ${policy.title}
      카테고리: ${policy.category}
      지역: ${policy.region}
      연령: ${policy.ageMin || '제한없음'}세 ~ ${policy.ageMax || '제한없음'}세
      지원내용: ${policy.supportDetails}
      신청요건: ${policy.requirements || '없음'}
      운영기관: ${policy.hostOrganization || ''}
      요약: ${policy.summary}
    `.trim();

    // 벡터 임베딩 생성 (Gemini)
    const embedding = await createEmbedding(searchableText);

    // Supabase에 저장
    const { data, error } = await client
      .from('policies')
      .upsert({
        id: policy.id,
        title: policy.title,
        summary: policy.summary,
        category: policy.category,
        region: policy.region,
        age_min: policy.ageMin,
        age_max: policy.ageMax,
        support_details: policy.supportDetails,
        requirements: policy.requirements,
        period: policy.period,
        application_url: policy.applicationUrl,
        host_organization: policy.hostOrganization,
        embedding: embedding,
        searchable_text: searchableText,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('정책 저장 실패:', error);
      return null;
    }

    console.log('✅ 정책 벡터 DB 저장 완료:', policy.title);
    return data;
  } catch (error) {
    console.error('벡터 DB 저장 중 오류:', error);
    return null;
  }
}

/**
 * 의미론적 검색 (Semantic Search)
 * 사용자의 질문과 가장 유사한 정책을 찾습니다
 */
export async function searchPoliciesBySemantics(
  query: string,
  options: {
    limit?: number;
    minSimilarity?: number;
    region?: string;
    category?: string;
    ageMin?: number;
    ageMax?: number;
  } = {}
) {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('⚠️ Supabase가 설정되지 않았습니다. 기본 검색으로 대체합니다.');
    return null;
  }

  try {
    const {
      limit = 5,
      minSimilarity = 0.7,
      region,
      category,
      ageMin,
      ageMax,
    } = options;

    // 질문을 벡터로 변환 (Gemini)
    const queryEmbedding = await createEmbedding(query);

    // Supabase의 pgvector를 사용한 유사도 검색
    let rpcQuery = client.rpc('match_policies', {
      query_embedding: queryEmbedding,
      match_threshold: minSimilarity,
      match_count: limit,
    });

    // 필터 추가
    if (region) {
      rpcQuery = rpcQuery.eq('region', region);
    }
    if (category) {
      rpcQuery = rpcQuery.eq('category', category);
    }

    const { data, error } = await rpcQuery;

    if (error) {
      console.error('의미론적 검색 실패:', error);
      return null;
    }

    // 연령 필터링 (클라이언트 사이드)
    let results = data || [];
    
    if (ageMin !== undefined || ageMax !== undefined) {
      results = results.filter((policy: any) => {
        const userAge = ageMin || ageMax || 0;
        const policyAgeMin = policy.age_min || 0;
        const policyAgeMax = policy.age_max || 999;
        
        return userAge >= policyAgeMin && userAge <= policyAgeMax;
      });
    }

    console.log(`✅ 의미론적 검색 완료: ${results.length}개 정책 발견`);
    
    return results.map((policy: any) => ({
      id: policy.id,
      title: policy.title,
      summary: policy.summary,
      category: policy.category,
      region: policy.region,
      ageMin: policy.age_min,
      ageMax: policy.age_max,
      supportDetails: policy.support_details,
      requirements: policy.requirements,
      period: policy.period,
      applicationUrl: policy.application_url,
      hostOrganization: policy.host_organization,
      similarity: policy.similarity,
    }));
  } catch (error) {
    console.error('의미론적 검색 중 오류:', error);
    return null;
  }
}

/**
 * Supabase 연결 상태 확인
 */
export function isVectorDBEnabled(): boolean {
  const client = getSupabaseClient();
  return client !== null;
}
