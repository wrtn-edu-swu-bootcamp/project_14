-- Gemini용 Vector DB 업데이트 스크립트
-- Gemini embedding-001은 768차원 벡터 사용

-- 1. 기존 테이블 삭제 (차원이 달라서)
DROP TABLE IF EXISTS policies CASCADE;

-- 2. 새로운 policies 테이블 생성 (768차원)
CREATE TABLE policies (
  id text PRIMARY KEY,
  title text NOT NULL,
  summary text,
  category text,
  region text,
  age_min integer,
  age_max integer,
  support_details text,
  requirements text,
  period text,
  application_url text,
  host_organization text,
  searchable_text text,
  embedding vector(768), -- Gemini embedding-001의 차원
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 벡터 유사도 검색을 위한 인덱스 생성
CREATE INDEX policies_embedding_idx 
  ON policies 
  USING hnsw (embedding vector_cosine_ops);

-- 4. 지역, 카테고리 필터링을 위한 인덱스
CREATE INDEX policies_region_idx ON policies(region);
CREATE INDEX policies_category_idx ON policies(category);

-- 5. 의미론적 검색 함수 (768차원용)
CREATE OR REPLACE FUNCTION match_policies (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id text,
  title text,
  summary text,
  category text,
  region text,
  age_min integer,
  age_max integer,
  support_details text,
  requirements text,
  period text,
  application_url text,
  host_organization text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    policies.id,
    policies.title,
    policies.summary,
    policies.category,
    policies.region,
    policies.age_min,
    policies.age_max,
    policies.support_details,
    policies.requirements,
    policies.period,
    policies.application_url,
    policies.host_organization,
    1 - (policies.embedding <=> query_embedding) as similarity
  FROM policies
  WHERE 1 - (policies.embedding <=> query_embedding) > match_threshold
  ORDER BY policies.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. RLS (Row Level Security) 설정
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "정책은 모두가 읽을 수 있습니다"
  ON policies FOR SELECT
  USING (true);

-- 완료!
-- 이제 Gemini로 RAG를 사용할 수 있습니다! 🚀
