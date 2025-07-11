// src/common/types/bot.context.ts
import { Context, Context as TelegrafContext } from 'telegraf';
import { JSQuestion } from './js.questions';


export interface SessionData {
  messageIds: number[];
  questions: JSQuestion[];
  answers: (string | 'timeout')[];
  currentIndex: number;
}

export type SessionContext = Context & {
  session: Partial<SessionData>;
}
