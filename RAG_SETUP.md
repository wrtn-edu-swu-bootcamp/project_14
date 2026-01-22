# 🚀 RAG (벡터 검색) 설정 가이드

폴리 AI가 **의미론적 검색**을 사용하여 더 정확한 정책 추천을 할 수 있습니다!

## 🎯 RAG가 뭔가요?

**기존 검색:**
- 사용자: "알바하면서 받을 수 있는 월세 지원"
- AI: "알바", "월세", "지원" 키워드로 검색
- 결과: 정확하지 않을 수 있음

**RAG 검색 (의미론적 검색):**
- 사용자: "알바하면서 받을 수 있는 월세 지원"
- AI: 질문의 **의미**를 이해 → "근로소득이 있는 청년 대상 주거 정책" 검색
- 결과: 훨씬 정확! ✨

---

## ⏱️ 5분 설정 가이드

### Step 1: Supabase 무료 계정 만들기

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New Project" 클릭
5. 프로젝트 이름: `policy-ai-vector-db`
6. Database Password 설정 (꼭 메모!)
7. Region: `Northeast Asia (Seoul)` 선택
8. "Create new project" 클릭 (약 2분 소요)

### Step 2: Vector DB 설정

1. Supabase Dashboard에서 왼쪽 메뉴 → **SQL Editor** 클릭
2. "New Query" 클릭
3. `scripts/setup-vector-db.sql` 파일의 내용을 **전체 복사**
4. SQL Editor에 붙여넣기
5. **RUN** 버튼 클릭 (오른쪽 아래)
6. "Success" 메시지 확인! ✅

### Step 3: API Keys 복사

1. Supabase Dashboard 왼쪽 메뉴 → **Project Settings** (톱니바퀴 아이콘)
2. **API** 메뉴 클릭
3. 다음 2개를 복사:
   - `Project URL` (예: https://xxxxx.supabase.co)
   - `anon` `public` key (긴 문자열)

### Step 4: .env.local 설정

프로젝트 루트에 `.env.local` 파일을 열고 추가:

```bash
# 기존 OpenAI 키
OPENAI_API_KEY=sk-proj-...

# Supabase 설정 추가
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: 정책 데이터 로딩

터미널에서 실행:

```bash
# tsx 설치 (TypeScript 실행기)
npm install -D tsx

# 벡터 DB에 샘플 정책 데이터 로딩
npx tsx scripts/populate-vector-db.ts
```

성공 메시지 확인:
```
✅ 완료!
  성공: 10개
  실패: 0개

🎉 이제 폴리 AI가 의미론적 검색을 사용할 수 있습니다!
```

### Step 6: 서버 재시작

```bash
npm run dev
```

---

## 🎉 완료! 이제 테스트해보세요

### 기존 검색 vs RAG 검색 비교

**테스트 질문:**
1. "알바하면서 받을 수 있는 주거 지원 있어?"
2. "취업 준비 중인데 생활비 지원받을 수 있어?"
3. "창업하고 싶은데 멘토링도 받을 수 있는 정책 있어?"

**RAG의 장점:**
- ✅ 질문의 **의미**를 이해
- ✅ 여러 조건을 동시에 고려 (알바 + 주거)
- ✅ 유사한 정책도 추천 (유사도 점수 표시)
- ✅ 3,000개 이상의 정책에서 **가장 관련있는** 것만 선별

---

## 📊 데이터 관리

### 실제 정책 데이터 추가하기

`scripts/populate-vector-db.ts`를 수정하여:
1. 온라인청년센터 API에서 실시간으로 데이터 가져오기
2. 정기적으로 업데이트 (Vercel Cron)

### 정책 업데이트 자동화

```typescript
// Vercel Cron으로 매일 자동 업데이트
// vercel.json
{
  "crons": [{
    "path": "/api/update-policies",
    "schedule": "0 2 * * *"  // 매일 새벽 2시
  }]
}
```

---

## 🔍 작동 원리

```
사용자 질문: "알바하면서 받을 수 있는 월세 지원"
              ↓
    [OpenAI Embeddings로 벡터 변환]
              ↓
   [1536차원 벡터: [0.123, -0.456, ...]]
              ↓
    [Supabase Vector DB에서 유사도 검색]
              ↓
  [코사인 유사도가 높은 정책 5개 선택]
              ↓
           AI가 설명
```

---

## 💰 비용

- **Supabase**: 무료 (500MB DB, 2GB 대역폭/월)
- **OpenAI Embeddings**: 
  - `text-embedding-3-small`: $0.02 / 1M 토큰
  - 1개 정책 임베딩: 약 200 토큰
  - 1,000개 정책 = $0.004 (약 5원!)

---

## 🆘 문제 해결

### "Supabase가 설정되지 않았습니다"
- `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 확인
- 서버 재시작 (`npm run dev`)

### "relation 'policies' does not exist"
- `scripts/setup-vector-db.sql`을 Supabase SQL Editor에서 실행했는지 확인

### "Embedding 생성 실패"
- `OPENAI_API_KEY`가 올바른지 확인
- API 크레딧이 있는지 확인

---

## 🚀 다음 단계

RAG가 작동하면:
1. **실시간 정책 크롤링** 추가
2. **사용자 프로필 메모리** 추가
3. **Multi-Agent 시스템** 구축

더 궁금한 게 있으면 물어보세요! 😊
