/**
 * Notion 정책 저장 유틸리티
 * 정책 정보를 파일 시스템에 저장하고, 백그라운드 프로세스가 이를 Notion에 동기화
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const SAVE_QUEUE_PATH = join(process.cwd(), '.notion-queue');
const QUEUE_FILE = join(SAVE_QUEUE_PATH, 'policies.json');

export interface PolicyToSave {
  id: string;
  timestamp: string;
  정책명: string;
  카테고리: '주거' | '일자리' | '창업' | '교육' | '자산형성' | '기타';
  지원내용: string;
  지역: string;
  신청기간: string;
  신청링크?: string;
  운영기관: string;
  신청상태: '관심있음' | '서류준비중' | '신청완료' | '승인완료';
  저장일: string;
}

/**
 * 정책을 저장 큐에 추가
 */
export function addToSaveQueue(policy: Omit<PolicyToSave, 'id' | 'timestamp' | '저장일' | '신청상태'>) {
  try {
    // 디렉토리 생성
    if (!existsSync(SAVE_QUEUE_PATH)) {
      mkdirSync(SAVE_QUEUE_PATH, { recursive: true });
    }

    // 기존 큐 읽기
    let queue: PolicyToSave[] = [];
    if (existsSync(QUEUE_FILE)) {
      const content = readFileSync(QUEUE_FILE, 'utf-8');
      queue = JSON.parse(content);
    }

    // 새 정책 추가
    const newPolicy: PolicyToSave = {
      id: `policy-${Date.now()}`,
      timestamp: new Date().toISOString(),
      저장일: new Date().toISOString().split('T')[0],
      신청상태: '관심있음',
      ...policy,
    };

    queue.push(newPolicy);

    // 파일에 저장
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');

    console.log('✅ 정책이 저장 큐에 추가되었습니다:', newPolicy.정책명);
    return { success: true, policy: newPolicy };
  } catch (error) {
    console.error('❌ 저장 큐 추가 실패:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 저장 큐 읽기
 */
export function readSaveQueue(): PolicyToSave[] {
  try {
    if (!existsSync(QUEUE_FILE)) {
      return [];
    }
    const content = readFileSync(QUEUE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ 저장 큐 읽기 실패:', error);
    return [];
  }
}

/**
 * 저장 큐 비우기
 */
export function clearSaveQueue() {
  try {
    writeFileSync(QUEUE_FILE, JSON.stringify([], null, 2), 'utf-8');
    console.log('✅ 저장 큐가 비워졌습니다.');
    return { success: true };
  } catch (error) {
    console.error('❌ 저장 큐 비우기 실패:', error);
    return { success: false, error: String(error) };
  }
}
