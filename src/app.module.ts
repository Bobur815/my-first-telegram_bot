import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './core/bot/bot.module';
import { PrismaModule } from './common/database/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true
    }),
    BotModule, PrismaModule],
})
export class AppModule {}
