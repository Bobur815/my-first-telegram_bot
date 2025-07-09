import { Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';
import { contactReply } from 'src/common/contact.send';
import { PrismaService } from 'src/common/database/prisma.service';
import { userState } from 'src/common/userstate';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
    constructor(private readonly prisma:PrismaService){}

    @Start()
    async start(@Ctx() ctx: Context){
        let existingUser = await this.prisma.user.findUnique({
            where: {telegramId:ctx.from?.id}
        })
        if(existingUser){
            if(existingUser.state === 'menu'){
                ctx.reply('Menu:', {
                    reply_markup:{
                    keyboard: [
                            [
                                {text:"Info"},
                                {text:'Help'}
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
        userState.set(ctx.from!.id, {step:'firstname',data:{}})
        ctx.reply(`Botimizga xush kelibsiz! 😊\nIsmingizni kiriting:`)
        
    }

    @Hears('Info')
    async info(@Ctx() ctx: Context){
        let user = await this.prisma.user.findUnique({
            where:{
                telegramId:ctx.from?.id
            }
        })

        ctx.reply(`Ism:\t${user?.firstname}\nFamiliya:\t${user?.lastname}\nYosh:${user?.age}\nKontakt:${user?.contact}`)

    }

    @On('text')
    async onText(@Ctx() ctx:Context){
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

    @On('contact')
    async onContact(@Ctx() ctx:Context){
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
                            {text:'sertificate'}
                        ]
                    ]
                }
            })
        }
    }



}
