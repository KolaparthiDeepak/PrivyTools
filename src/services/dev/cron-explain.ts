import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export interface CronInfo {
  description: string;
  nextRuns: string[]; // 5 ISO strings, UTC
}

export function explainCron(input: string, from: Date): CronInfo {
  const expr = input.trim();
  let description: string;
  try {
    description = cronstrue.toString(expr, { throwExceptionOnParseError: true });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Invalid cron expression', { cause: e });
  }
  const it = CronExpressionParser.parse(expr, { currentDate: from, tz: 'UTC' });
  const nextRuns: string[] = [];
  for (let i = 0; i < 5; i++) nextRuns.push(it.next().toDate().toISOString());
  return { description, nextRuns };
}
