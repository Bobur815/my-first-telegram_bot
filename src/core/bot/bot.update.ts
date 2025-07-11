import { Action, Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';
import { PrismaService } from 'src/common/database/prisma.service';
import { SessionContext } from 'src/common/types/bot.context';
import { userState } from 'src/common/types/userstate';
import { Context } from 'telegraf';
import { finishTest, sendNextQuestion, startTest } from './bot.start.test';
import { checkUserSubscription, subscriptionKeyboards } from './subscription/user_subscription';

@Update()
export class BotUpdate {
    constructor(private readonly prisma:PrismaService){}

    @Start()
    async start(@Ctx() ctx: SessionContext){

        if(!await checkUserSubscription(ctx)){
            await subscriptionKeyboards(ctx)
        } else {
            userState.set(ctx.from!.id, {step:'firstname',data:{}})
            ctx.reply(`Botimizga xush kelibsiz! 😊\nIsmingizni kiriting:`)
        }

        let existingUser = await this.prisma.user.findUnique({
            where: {telegramId:ctx.from?.id}
        })

        if(existingUser){
            if(existingUser.state === 'menu'){
                await ctx.answerCbQuery()
                ctx.reply('Menu:', {
                    reply_markup:{
                    keyboard: [
                            [
                                {text:"Info"},
                                {text:'Help'}
                            ],
                            [
                                {text:'Testni boshlash'}
                            ],
                            [
                                {text:'sertificate'}
                            ]
                        ],
                        resize_keyboard:true,
                        one_time_keyboard:true
                    }
                })
                return
            }
            
        }
        
    }

    @Action('check_subscription')
    async checkUser(@Ctx() ctx:Context){
        try {
            await ctx.answerCbQuery()

            const userId = ctx.from?.id
            if(!userId) return

            const isSubscribed = await checkUserSubscription(ctx)
            if(isSubscribed){
                userState.set(userId,{step:'firstname',data:{}})
                await ctx.reply('Botimizga xush kelibsiz! 😊\nIltimos, ismingizni kiriting:')
            } else {
                await ctx.replyWithAnimation(
                    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTByZW5zODI4YWFoYnRnODQwcDI1b29zNW4yMnRnZzJtM3RiN2IzdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bTF4iiCmxK5qkH6rKF/giphy.gif',
                    { caption: "Kanalga a'zo bo'ling, so‘ng “✅ Tasdiqlash” tugmasini bosing!" }
                );
            }

        } catch (error) {
            console.error('check_subscription xatosi:', error);
        }
    }

    @Hears('Info')
    async info(@Ctx() ctx: SessionContext){
        let user = await this.prisma.user.findUnique({
            where:{
                telegramId:ctx.from?.id
            }
        })

        const html = `<pre>
    😌 Ism      │ ${user?.firstname || ''}
    😍 Familiya │ ${user?.lastname  || ''}
    🥶 Yosh     │ ${user?.age       || ''}
    ✅ Kontakt  │ ${user?.contact   || ''}
        </pre>`;

        await ctx.reply(html, { parse_mode: 'HTML' });
    }

    @Hears('Testni boshlash')
    async testStart(@Ctx() ctx: SessionContext){
        await startTest(ctx)
    }

    @On('text')
    async onText(@Ctx() ctx:SessionContext){

        const state = userState.get(ctx.from!.id)
        if(!state){
            ctx.reply("Boshlash uchun /start bosing")
            return
        }

        if('text' in ctx.message!){
            const text = ctx.message.text

            switch(state?.step){
                case 'firstname':
                    state.data.firstname = text
                    state.step = 'lastname'
                    ctx.reply("Familiyangizni kiriting:")
                    break
                case 'lastname':
                    state.data.lastname = text
                    state.step = 'age'
                    ctx.reply("Yoshingizni kiriting:")
                    break
                case 'age' :
                    const age = parseInt(text)
                    if(isNaN(age) || age < 14 || age > 100) {
                        ctx.reply("Yoshingizni to'g'ri kiriting:")
                        return
                    }
                    state.data.age = age
                    state.step = 'contact'

                    ctx.reply("Kontaktingizni yuboring:",{
                        reply_markup: {
                            keyboard: [
                                [
                                    {
                                        text: "Raqam yuborish:",
                                        request_contact:true
                                    }
                                ]
                            ],
                            resize_keyboard:true,
                            one_time_keyboard:true
                        }
                    })
            }
        }
    }

    @Action(/answer_(\d+)_(a|b|c|d)/)
    async onAnswer(@Ctx() context: Context) {
            const ctx = context as SessionContext;

            if (!('data' in ctx.callbackQuery!)) return; 

            const match = ctx.callbackQuery!.data.match(/answer_(\d+)_(a|b|c|d)/);
            if (!match) return;
            
            const [, indexStr, chosen] = match;
            const index = parseInt(indexStr, 10);

            const question = ctx.session.questions?.[index];
            const correct = question?.correct_answer;
            if (!question || !correct) return;

            if (ctx.session.answers?.[index]) return;

            ctx.session.answers![index] = chosen;

            if (chosen === correct) {
                await ctx.reply(`✅ To‘g‘ri javob`);
            } else {
                await ctx.reply(`❌ Noto‘g‘ri. To‘g‘ri javob: ${correct.toUpperCase()}`);
            }

            ctx.session.currentIndex! += 1;

            if (ctx.session.currentIndex! < ctx.session.questions!.length) {
                await sendNextQuestion(ctx);
            } else {
                await finishTest(ctx);
            }
    }

    @On('contact')
    async onContact(@Ctx() ctx:SessionContext){
        let state = userState.get(ctx.from!.id)
        if(ctx.message && 'contact' in ctx.message){
            let contact = ctx.message.contact.phone_number
            let { firstname, lastname, age } = state!.data
            
            let newUser = await this.prisma.user.create({
                data:{
                    firstname:firstname!,
                    lastname:lastname!,
                    age:age!,
                    contact:contact!,
                    telegramId:ctx.from!.id,
                    state:'menu'
                }
            })
            console.log(newUser);
            
            ctx.reply("✅ Ma'lumot saqlandi",{
                reply_markup:{
                    keyboard: [
                        [
                            {text:"Info"},
                            {text:'Help'}
                        ],
                        [
                                {text:'Testni boshlash'}
                        ],
                        [
                            {text:'sertificate'}
                        ]
                    ]
                }
            })
        }
    }
}
