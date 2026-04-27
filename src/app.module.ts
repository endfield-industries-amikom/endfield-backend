import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponsesModule } from './responses/responses.module';

@Module({
  imports: [ResponsesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
