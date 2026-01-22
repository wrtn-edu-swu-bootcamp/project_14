/**
 * Notion 동기화 스크립트
 * 저장 큐에 있는 정책들을 Notion에 동기화합니다.
 * 
 * 실행 방법:
 * npx tsx scripts/sync-to-notion.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const QUEUE_FILE = join(process.cwd(), '.notion-queue', 'policies.json');

interface PolicyToSave {
  id: string;
  timestamp: string;
  정책명: string;
  카테고리: string;
  지원내용: string;
  지역: string;
  신청기간: string;
  신청링크?: string;
  운영기관: string;
  신청상태: string;
  저장일: string;
}

async function syncToNotion() {
  try {
    console.log('🔄 Notion 동기화 시작...\n');

    if (!existsSync(QUEUE_FILE)) {
      console.log('📭 저장 큐가 비어있습니다.');
      return;
    }

    const content = readFileSync(QUEUE_FILE, 'utf-8');
    const queue: PolicyToSave[] = JSON.parse(content);

    if (queue.length === 0) {
      console.log('📭 저장 큐가 비어있습니다.');
      return;
    }

    console.log(`📋 ${queue.length}개의 정책을 동기화합니다.\n`);

    // 각 정책을 출력 (수동으로 Notion MCP 명령어 실행)
    for (const policy of queue) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📝 정책: ${policy.정책명}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n다음 MCP 명령어를 실행하세요:\n');
      console.log('```');
      console.log(`mcp_Notion_notion-create-pages`);
      console.log(JSON.stringify({
        parent: { type: 'data_source_id', data_source_id: '0e1e9aee-276a-4db6-bdac-ef504695ce06' },
        pages: [{
          properties: {
            'date:저장일:start': policy.저장일,
            '정책명': policy.정책명,
            '카테고리': policy.카테고리,
            '지원내용': policy.지원내용,
            '신청상태': policy.신청상태,
            '지역': policy.지역,
            'date:저장일:is_datetime': 0,
            '신청링크': policy.신청링크 || '',
            '신청기간': policy.신청기간,
            '운영기관': policy.운영기관,
          }
        }]
      }, null, 2));
      console.log('```\n');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 동기화 정보 출력 완료!');
    console.log(`📊 총 ${queue.length}개 정책`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 큐를 비우려면 다음 명령어를 실행하세요:');
    console.log('   curl http://localhost:3002/api/clear-queue\n');

  } catch (error) {
    console.error('❌ 동기화 오류:', error);
  }
}

// 실행
syncToNotion();
