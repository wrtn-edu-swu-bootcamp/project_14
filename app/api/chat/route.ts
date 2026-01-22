import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';
import { performRAGSearch, policiesToContext, extractQueryContext, searchPolicies, Policy } from '@/lib/local-rag';
import { savePolicyToNotion, isNotionEnabled } from '@/lib/notion-client';

export const runtime = 'nodejs'; // RAG를 위해 nodejs 런타임 사용

// 최근 검색된 정책 저장 (세션별로 관리하기 위함)
let lastSearchedPolicies: Policy[] = [];

// 기본 시스템 프롬프트
const BASE_SYSTEM_PROMPT = `당신은 "폴리 AI"입니다. 청년들을 위한 정책 상담 AI 어시스턴트입니다.

주요 역할:
- 청년 정책(월세 지원, 취업 지원, 창업 지원 등)에 대해 친절하게 안내
- 사용자의 나이, 지역, 상황에 맞는 정책을 추천
- 복잡한 정책 내용을 쉽게 설명
- 사용자가 원하면 정책을 Notion에 저장해주기

대화 스타일:
- 친근하고 따뜻한 말투 사용
- 이모지를 적절히 활용 (📋, 💼, 🏠, 💰, 📚 등)
- 정보는 명확하게 구조화해서 전달

중요 규칙:
- 아래 [검색된 정책 데이터]에 있는 정책만 추천하세요
- 데이터에 없는 정책을 만들어내지 마세요
- 정책 정보는 정확하게 전달하세요
- 신청 URL이 있다면 함께 안내하세요
- 사용자가 "저장해줘", "노션에 저장", "북마크" 등을 요청하면 saveToNotion 함수를 호출하세요
- 저장할 정책명을 정확하게 파악해서 함수에 전달하세요

항상 다음 형식으로 정책 정보를 제공하세요:
📋 **정책명**
- 지원 대상: (연령, 조건 등)
- 지원 내용: (금액, 혜택 등)
- 신청 요건: (자격 조건)
- 신청 기간: (기간)
- 운영 기관: (담당 기관)
- 신청 방법: (URL 또는 방문처)`;

// Gemini Function Declarations
const functionDeclarations = [
  {
    name: 'saveToNotion',
    description: '사용자가 관심있는 정책을 Notion에 저장합니다. 사용자가 "저장해줘", "노션에 저장", "북마크해줘" 등을 요청할 때 호출합니다.',
    parameters: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        policyTitle: {
          type: FunctionDeclarationSchemaType.STRING,
          description: '저장할 정책의 정확한 이름 (예: "청년 월세 지원 사업")',
        },
      },
      required: ['policyTitle'],
    },
  },
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    console.log('📨 받은 메시지:', lastMessage);
    
    // GEMINI_API_KEY 또는 GOOGLE_GENERATIVE_AI_API_KEY 둘 다 지원
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    // API 키가 없으면 목업 모드
    if (!apiKey) {
      console.log('⚠️ Gemini API 키가 없습니다. 목업 모드로 작동');
      return handleMockMode(messages);
    }
    
    // 🔍 RAG: 관련 정책 검색
    const queryInfo = extractQueryContext(lastMessage);
    const relevantPolicies = searchPolicies(lastMessage, {
      age: queryInfo.age,
      region: queryInfo.region,
      limit: 5,
    });
    
    // 검색된 정책 저장 (Notion 저장 시 사용)
    lastSearchedPolicies = relevantPolicies;
    
    const policyContext = policiesToContext(relevantPolicies);
    
    console.log('🔍 RAG 검색 결과:', {
      추출된정보: queryInfo,
      검색된정책수: relevantPolicies.length,
      정책목록: relevantPolicies.map(p => p.title),
    });
    
    // Notion 활성화 상태 확인
    const notionEnabled = isNotionEnabled();
    const notionStatus = notionEnabled 
      ? '[Notion 연동] 활성화됨 - 사용자가 정책 저장을 요청하면 saveToNotion 함수를 호출하세요.'
      : '[Notion 연동] 비활성화됨 - 사용자가 저장을 요청하면 "Notion 설정이 필요합니다"라고 안내하세요.';
    
    // 시스템 프롬프트에 검색된 정책 컨텍스트 추가
    const systemPromptWithContext = `${BASE_SYSTEM_PROMPT}

[검색된 정책 데이터]
${policyContext}

[사용자 정보 분석]
- 추정 나이: ${queryInfo.age ? queryInfo.age + '세' : '알 수 없음'}
- 추정 지역: ${queryInfo.region || '알 수 없음'}
- 관심 분야: ${queryInfo.categories.length > 0 ? queryInfo.categories.join(', ') : '일반'}

${notionStatus}

위 정책 데이터를 기반으로 사용자에게 맞춤형 정책을 추천해주세요.
정책 데이터가 없거나 적합한 정책이 없다면, 사용자에게 더 구체적인 정보(나이, 지역, 관심분야)를 물어보세요.`;
    
    // Google Generative AI 직접 사용
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Function Calling이 활성화된 모델 설정
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPromptWithContext,
      tools: notionEnabled ? [{ functionDeclarations }] : undefined,
    });
    
    // 메시지 히스토리 구성
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
    
    // 채팅 시작
    const chat = model.startChat({ history });
    
    // 먼저 Function Call 체크를 위해 non-streaming으로 호출
    const initialResult = await chat.sendMessage(lastMessage);
    const response = initialResult.response;
    const functionCall = response.functionCalls()?.[0];
    
    // Function Call이 있는 경우 처리
    if (functionCall && functionCall.name === 'saveToNotion') {
      console.log('📚 Notion 저장 함수 호출됨:', functionCall.args);
      
      const policyTitle = (functionCall.args as any).policyTitle;
      
      // 검색된 정책 중에서 해당 정책 찾기
      const policyToSave = lastSearchedPolicies.find(p => 
        p.title.includes(policyTitle) || policyTitle.includes(p.title)
      );
      
      let functionResponse: string;
      
      if (policyToSave) {
        // Notion에 저장
        const saveResult = await savePolicyToNotion({
          title: policyToSave.title,
          category: policyToSave.category,
          region: policyToSave.region,
          ageRange: policyToSave.ageMin && policyToSave.ageMax 
            ? `${policyToSave.ageMin}세 ~ ${policyToSave.ageMax}세` 
            : '제한 없음',
          supportDetails: policyToSave.supportDetails,
          requirements: policyToSave.requirements,
          period: policyToSave.period,
          applicationUrl: policyToSave.applicationUrl,
          hostOrganization: policyToSave.hostOrganization,
        });
        
        if (saveResult.success) {
          functionResponse = JSON.stringify({
            success: true,
            message: `"${policyToSave.title}" 정책이 Notion에 저장되었습니다!`,
            pageUrl: saveResult.pageUrl,
          });
          console.log('✅ Notion 저장 성공:', saveResult.pageUrl);
        } else {
          functionResponse = JSON.stringify({
            success: false,
            error: saveResult.error,
          });
          console.log('❌ Notion 저장 실패:', saveResult.error);
        }
      } else {
        functionResponse = JSON.stringify({
          success: false,
          error: `"${policyTitle}" 정책을 찾을 수 없습니다. 정확한 정책명을 확인해주세요.`,
        });
      }
      
      // Function 결과를 AI에게 전달하고 최종 응답 받기
      const finalResult = await chat.sendMessageStream([
        {
          functionResponse: {
            name: 'saveToNotion',
            response: { result: functionResponse },
          },
        },
      ]);
      
      // 스트리밍 응답 반환
      return createStreamResponse(finalResult);
    }
    
    // Function Call이 없는 경우 일반 응답
    const textResponse = response.text();
    
    // 이미 받은 응답을 스트리밍 형식으로 반환
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const formattedChunk = `0:${JSON.stringify(textResponse)}\n`;
        controller.enqueue(encoder.encode(formattedChunk));
        controller.close();
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
    
  } catch (error) {
    console.error('Chat API 오류:', error);
    return new Response(
      JSON.stringify({ 
        error: 'AI 응답 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 스트리밍 응답 생성 헬퍼
function createStreamResponse(result: any) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            const formattedChunk = `0:${JSON.stringify(text)}\n`;
            controller.enqueue(encoder.encode(formattedChunk));
          }
        }
        controller.close();
      } catch (error) {
        console.error('스트리밍 오류:', error);
        controller.error(error);
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
    },
  });
}

// 목업 모드 (API 키가 없을 때) - RAG 기반 응답
function handleMockMode(messages: any[]) {
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // RAG 검색 수행
  const queryInfo = extractQueryContext(lastMessage);
  const policies = searchPolicies(lastMessage, {
    age: queryInfo.age,
    region: queryInfo.region,
    limit: 3,
  });
  
  let mockResponse = '';
  
  if (policies.length > 0) {
    mockResponse = `안녕! 너에게 맞는 정책을 찾아봤어 😊\n\n`;
    
    policies.forEach((policy, index) => {
      const emoji = ['📋', '💼', '🏠', '💰', '📚'][index % 5];
      mockResponse += `${emoji} **${policy.title}**\n`;
      mockResponse += `- 지원 대상: 만 ${policy.ageMin || '제한없음'}세~${policy.ageMax || '제한없음'}세 (${policy.region})\n`;
      mockResponse += `- 지원 내용: ${policy.supportDetails}\n`;
      mockResponse += `- 신청 요건: ${policy.requirements || '별도 요건 없음'}\n`;
      mockResponse += `- 신청 기간: ${policy.period || '상시'}\n`;
      mockResponse += `- 운영 기관: ${policy.hostOrganization || '미지정'}\n`;
      if (policy.applicationUrl) {
        mockResponse += `- 신청: ${policy.applicationUrl}\n`;
      }
      mockResponse += '\n';
    });
    
    mockResponse += `더 궁금한 점이 있으면 물어봐! 🙋‍♂️`;
  } else {
    mockResponse = `안녕! 나는 폴리 AI야 👋\n\n` +
      `너에게 맞는 청년 정책을 찾아줄 수 있어.\n\n` +
      `이런 걸 물어봐:\n` +
      `- "서울에 사는 25살인데 받을 수 있는 정책 알려줘"\n` +
      `- "월세 지원 받을 수 있는 정책 찾아줘"\n` +
      `- "취업 준비 중인데 도움받을 수 있는 정책 있어?"\n` +
      `- "창업하고 싶은데 지원금 받을 수 있을까?"`;
  }
  
  // AI SDK 형식에 맞는 응답 생성
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // AI SDK v3 data stream 형식: 0:"텍스트"\n
      const formattedChunk = `0:${JSON.stringify(mockResponse)}\n`;
      controller.enqueue(encoder.encode(formattedChunk));
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
    },
  });
}
