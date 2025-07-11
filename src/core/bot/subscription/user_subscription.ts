import { userState } from "src/common/types/userstate";
import { Context } from "telegraf";

export async function subscriptionKeyboards(ctx:Context){
    userState.set(ctx.from!.id,{step:'subscription',data:{}})
    await ctx.reply("Botdan foydalanish uchun kanalga a'zo bo'ling",{
        reply_markup:{
            inline_keyboard:[
                [
                    {
                        text:'Admin kanal',
                        url:'https://t.me/bobursdasturinfo'
                    }
                ],
                [
                    {
                        text:'✅ Tasdiqlash',
                        callback_data:"check_subscription"
                    }
                ]
            ]
        }
    })
}

export async function checkUserSubscription(ctx: Context): Promise<boolean> {
    let userId = ctx.from!.id;

    try {
        const member = await ctx.telegram.getChatMember('@bobursdasturinfo', userId);

        return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (err) {
        console.error("Kanalga a'zo ekanligini tekshirishda xatolik:", err);
        return false;
    }
}
