
import { JSQuestion, jsQuestions } from "src/common/types/js.questions";
import { SessionContext } from "src/common/types/bot.context";
import { Context } from "telegraf";


export async function startTest(ctx: SessionContext) {
  ctx.session.messageIds = [];
  ctx.session.questions = [...jsQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  ctx.session.answers = [];
  ctx.session.currentIndex = 0;

  await ctx.reply("🧹 Eski xabarlar tozalandi");
  await ctx.reply("🧪 Test boshlanmoqda. Har bir savol uchun 10 sekund vaqt bor!");
  await delay(3000)
  sendNextQuestion(ctx);
}

export async function sendNextQuestion(ctx: SessionContext) {
  const index = ctx.session.currentIndex!;
  const q = ctx.session.questions![index];
  await ctx.reply(
    `📘 ${index + 1}-savol:\n\n📖 ${q.savol}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: `🅰️ ${q.a}`, callback_data: `answer_${index}_a` }],
          [{ text: `🅱️ ${q.b}`, callback_data: `answer_${index}_b` }],
          [{ text: `🇨 ${q.c}`, callback_data: `answer_${index}_c` }],
          [{ text: `🇩 ${q.d}`, callback_data: `answer_${index}_d` }],
        ],
      },
    }
  );
  await countdown(ctx)
  // 10 soniyadan keyin avtomatik o'tish
  setTimeout(async () => {
    if (!ctx.session.answers![index]) {
      ctx.session.answers![index] = 'timeout';
      await ctx.reply('⏱ Vaqt tugadi. Keyingi savol...');
      ctx.session.currentIndex! += 1;
      if (ctx.session.currentIndex! < ctx.session.questions!.length) {
        sendNextQuestion(ctx);
      } else {
        finishTest(ctx);
      }
    }
  }, 10_000);
}

export async function finishTest(ctx: SessionContext) {
  const questions = ctx.session.questions!;
  const answers = ctx.session.answers!;

  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i].correct_answer) {
      correct++;
    }
  }

  await ctx.reply(`🏁 Test tugadi!\n✅ To‘g‘ri javoblar soni: ${correct} / ${questions.length}`);
}

export async function countdown(ctx: Context) {
   const countdownMessage = await ctx.reply('10');

  for (let i = 9; i > 0; i--) {
    await delay(1000);
    try {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        countdownMessage.message_id,
        undefined,
        `${i}`
      );
    } catch (e) {
    }
  }

  await delay(1000);
  await ctx.telegram.editMessageText(
    ctx.chat!.id,
    countdownMessage.message_id,
    undefined,
    '❗️ Vaqt tugadi\n⏭ Keyingi savol!'
  );
    await ctx.deleteMessage(countdownMessage.message_id);

}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}