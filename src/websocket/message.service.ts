import { Injectable } from '@nestjs/common';

type PayloadType = {
  messageid?: string;
  message: string;
  receiverid: string;
};

@Injectable()
export class MessageService {
  async send(
    senderid: string,
    payload: PayloadType,
  ): Promise<{ senderid: string; receiverid: string; message: string }> {
    const message = {
      senderid,
      receiverid: payload.receiverid,
      message: payload.message,
      messageid: payload.messageid,
    };
    return message;
  }
}
