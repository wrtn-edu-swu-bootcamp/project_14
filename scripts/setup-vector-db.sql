-- Supabase Vector DB 설정 스크립트
-- Supabase Dashboard에서 SQL Editor로 실행하세요!

-- 1. pgvector 확장 활성화
create extension if not exists vector;

-- 2. policies 테이블 생성
create table if not exists policies (
  id text primary key,
  title text not null,
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
  embedding vector(1536), -- OpenAI text-embedding-3-small의 차원
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 벡터 유사도 검색을 위한 인덱스 생성 (HNSW - 빠른 검색)
create index if not exists policies_embedding_idx 
  on policies 
  using hnsw (embedding vector_cosine_ops);

-- 4. 지역, 카테고리 필터링을 위한 인덱스
create index if not exists policies_region_idx on policies(region);
create index if not exists policies_category_idx on policies(category);

-- 5. 의미론적 검색 함수 (코사인 유사도)
create or replace function match_policies (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
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
language plpgsql
as $$
begin
  return query
  select
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
  from policies
  where 1 - (policies.embedding <=> query_embedding) > match_threshold
  order by policies.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 6. RLS (Row Level Security) 설정 - 모든 사용자가 읽을 수 있도록
alter table policies enable row level security;

create policy "정책은 모두가 읽을 수 있습니다"
  on policies for select
  using (true);

-- 완료!
-- 이제 폴리 AI가 의미론적 검색을 사용할 수 있습니다! 🚀
