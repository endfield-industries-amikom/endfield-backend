import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponsesService } from './utils/responses/responses.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly responsesService: ResponsesService<null>,
  ) {}

  @Get()
  getHello(@Res() res: any): void {
    this.responsesService
      .code('success')
      .message(this.appService.getHello())
      .sendResponse(res, null);
  }
}
