import { Injectable, Res } from '@nestjs/common';

@Injectable()
export class ResponsesService {
  public _responseCodeStruct = {
    success: 200,
    created: 201,
    badRequest: 400,
    unauthorized: 401,
    notFound: 404,
    internalServerError: 500,
  };
  private _responseCode: number;
  private _message: string;

  code(status: keyof typeof this._responseCodeStruct): this {
    this._responseCode = this._responseCodeStruct[status];
    return this;
  }

  message(message: string): this {
    this._message = message;
    return this;
  }

  sendResponse(@Res() res: any, data: any = []): this {
    res
      .status(this._responseCode)
      .send({ statusCode: this._responseCode, message: this._message, data });
    return this;
  }
}
