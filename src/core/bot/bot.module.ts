import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotUpdate } from './bot.update';
import { PrismaService } from 'src/common/database/prisma.service';
import { PrismaModule } from 'src/common/database/prisma.module';
import { RegistrationModule } from './registration/registration.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('BOT_TOKEN') as string,
      }),
      inject: [ConfigService],
    }),
    RegistrationModule,
  ],
  providers: [BotUpdate]
})
export class BotModule {}
