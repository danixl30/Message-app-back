import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModuleModule } from './db-module/db-module.module';

@Module({
  imports: [
    DbModuleModule,
    MongooseModule.forRoot('mongodb://localhost/MessageAppDB'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
