import { Module } from '@nestjs/common';
import { RegistrationUpdate } from './rehistration.update';

@Module({
    providers:[RegistrationUpdate]
})
export class RegistrationModule {}
