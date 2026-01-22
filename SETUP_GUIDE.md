# 🚀 폴리 AI 설정 가이드

## 현재 상황
서버는 실행되고 있지만, **OpenAI API 키가 설정되지 않아** 챗봇이 작동하지 않습니다.

## 🔑 OpenAI API 키 설정 (필수!)

### 1단계: OpenAI API 키 발급받기

1. **OpenAI 웹사이트 접속**
   - https://platform.openai.com/ 방문
   - 계정이 없다면 회원가입 (구글 계정으로 간편 가입 가능)

2. **API 키 생성**
   - 왼쪽 메뉴에서 "API keys" 클릭
   - 오른쪽 상단 "Create new secret key" 버튼 클릭
   - 이름을 입력하고 "Create secret key" 클릭
   - **중요**: 생성된 키를 복사해두세요 (다시 볼 수 없습니다!)
   - 키는 `sk-proj-`로 시작합니다

3. **비용 설정 (중요!)**
   - Settings > Billing 메뉴로 이동
   - 결제 수단 등록 (신용카드/체크카드)
   - 테스트용으로 $5 정도 충전 권장
   - Usage limits 설정으로 예산 초과 방지

### 2단계: .env.local 파일 생성

프로젝트 폴더(`C:\Users\PC\Desktop\project`)에서:

1. **메모장 또는 VS Code로 새 파일 생성**
2. **파일명을 정확히 `.env.local`로 저장**
   - Windows 탐색기에서: 파일 이름에 `.env.local` 입력
   - 확장자 없이 저장해야 합니다!

3. **아래 내용을 복사하여 붙여넣기:**

```env
# OpenAI API Key
OPENAI_API_KEY=여기에_발급받은_API_키를_붙여넣으세요

# 온라인청년센터 API Key (선택사항 - 없어도 목업 데이터로 작동)
YOUTH_CENTER_API_KEY=your_youth_center_api_key_here
```

4. **예시:**
```env
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl...
YOUTH_CENTER_API_KEY=your_youth_center_api_key_here
```

### 3단계: 서버 재시작

PowerShell 터미널에서:

```powershell
# 1. 현재 실행 중인 서버 중지
# Ctrl + C 키를 누르세요

# 2. 서버 다시 시작
npm run dev
```

### 4단계: 테스트

브라우저에서 http://localhost:3000 접속 후:
- "서울에 사는 25살인데 받을 수 있는 정책 알려줘" 입력
- 폴리 AI가 응답하면 성공! 🎉

---

## ⚠️ 문제 해결

### Q1: ".env.local 파일이 어디 있나요?"
**A**: 프로젝트 루트 폴더에 있어야 합니다.
```
C:\Users\PC\Desktop\project\
├── .env.local          ← 여기!
├── package.json
├── app/
└── components/
```

### Q2: "파일을 만들었는데도 작동하지 않아요"
**A**: 다음을 확인하세요:
1. 파일명이 정확히 `.env.local`인지 (공백 없이)
2. API 키를 올바르게 붙여넣었는지
3. 서버를 재시작했는지 (Ctrl+C 후 npm run dev)

### Q3: "API 키가 잘못되었다고 나와요"
**A**: 
- OpenAI 대시보드에서 키가 활성화되어 있는지 확인
- 결제 수단이 등록되어 있는지 확인
- 키를 다시 생성해보세요

### Q4: "비용이 너무 많이 나올까 걱정돼요"
**A**: 
- GPT-4는 비용이 높습니다 (1000 토큰당 약 $0.03)
- 테스트용으로는 GPT-3.5 사용 권장
- `app/api/chat/route.ts` 파일에서 모델 변경:
  ```typescript
  // 변경 전
  model: openai('gpt-4-turbo', { apiKey }),
  
  // 변경 후 (저렴함)
  model: openai('gpt-3.5-turbo', { apiKey }),
  ```

### Q5: "계속 목업 데이터만 나와요"
**A**: 
- 이는 정상입니다! 온라인청년센터 API 키가 없으면 목업 데이터 사용
- AI 챗봇 기능은 OpenAI 키만 있으면 작동합니다
- 실제 정책 데이터가 필요하면 공공데이터포털에서 키 발급

---

## 💰 비용 안내

### GPT-4 Turbo (현재 설정)
- 입력: $0.01 / 1K 토큰
- 출력: $0.03 / 1K 토큰
- 대화 1회당 약 $0.05-0.10

### GPT-3.5 Turbo (저렴한 옵션)
- 입력: $0.0005 / 1K 토큰
- 출력: $0.0015 / 1K 토큰
- 대화 1회당 약 $0.003-0.01

**권장**: 테스트 시에는 GPT-3.5 사용, 성능이 필요하면 GPT-4 사용

---

## 📞 도움이 필요하면

1. `.env.local` 파일 내용 확인 (API 키는 가리고)
2. 터미널 오류 메시지 복사
3. 질문하기

설정이 완료되면 폴리 AI와 대화를 시작할 수 있습니다! 🚀
