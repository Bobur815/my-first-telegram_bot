import { Middleware } from 'telegraf';
import { Context } from 'telegraf';

export const trackAll: Middleware<Context> = async (ctx, next) => {
  ctx.session ||= {};
  ctx.session.messageIds ||= [];

  if (ctx.message?.message_id) {
    ctx.session.messageIds.push(ctx.message.message_id);
  }
  if (ctx.callbackQuery?.message?.message_id) {
    ctx.session.messageIds.push(ctx.callbackQuery.message.message_id);
  }

  const origReply = ctx.reply.bind(ctx);
  ctx.reply = async (...args) => {
    const sent = await origReply(...args);
    if (sent && 'message_id' in sent) {
      ctx.session.messageIds.push(sent.message_id);
    }
    return sent;
  };

  await next();
};
