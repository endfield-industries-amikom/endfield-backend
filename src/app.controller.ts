import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponsesService } from './utils/responses/responses.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly responsesService: ResponsesService<null>,
  ) {}

  @Get('/healthz')
  getHealthz(@Res() res: any): void {
    this.responsesService
      .code('success')
      .message(this.appService.getHealthz())
      .sendResponse(res, null);
  }
}
