import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotUpdate } from './bot.update';
import { PrismaModule } from 'src/common/database/prisma.module';
import { session } from 'telegraf';
import { trackAll } from 'src/common/middleware/track.middleware';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('BOT_TOKEN') as string,
        middlewares: [ 
          session(),
          trackAll
         ],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [BotUpdate]
})
export class BotModule {}
