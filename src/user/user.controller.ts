import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { type Request } from 'express';
import { InviteDto } from './DTO/Inviter.Dto';
import { JwtAuthGuard } from 'src/common-auth/guards/jwt-auth.guard';
import { UserContactDto } from './DTO/UserContacts.Dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('all')
  async allUsers() {
    return this.userService.allUsers();
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async chatRequest(@Req() req) {
    const userId = req?.user?.userId;
    if (!userId) throw new UnauthorizedException();
    const res = await this.userService.getChatRequests(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Chat requests fetched successful.',
      res,
    };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchUsers(@Query('q') queryTerm: string, @Req() req) {
    const requestSenderid = req?.user?.userId;
    const res = await this.userService.searchUsersAndInvite(
      queryTerm,
      requestSenderid,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Searched user fetched successfully.',
      res: res,
    };
  }
  @Post('invite-send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async invite(@Req() req, @Body() body: InviteDto) {
    const senderID = req?.user?.userId;
    const receiverID = body?.receiverId;
    if (!senderID || !receiverID)
      throw new UnauthorizedException("Sender and Receiver ID's required");
    await this.userService.createInvite(senderID, receiverID);
    return {
      statusCode: HttpStatus.OK,
      message: 'Invite sent successfully',
    };
  }
  @Post('invite-accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async acceptInvite(@Body() body: any) {
    const requestid = body?.requestid;
    if (!requestid) throw new UnauthorizedException("Requestid ID's required");
    await this.userService.acceptInvite(requestid);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Invite Accepted',
      response: 'res',
    };
  }

  @Post('invite-reject')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async rejectInviteRequest(@Body() body: any) {
    const requestId: string = body?.requestid;
    if (!requestId) throw new BadRequestException('requestid required');
    const msg = await this.userService.rejectInvite(requestId);
    return {
      statusCode: HttpStatus.OK,
      message: msg,
    };
  }

  @Get('contacts')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getContacts(@Req() req) {
    const userid = req?.user?.userId;
    const res = await this.userService.getContacts(userid);
    return {
      statusCode: HttpStatus.OK,
      message: 'Ok contacts',
      res,
    };
  }

  @Get('contactsids')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getContactIds(@Req() req) {
    const userid = req?.user?.userId;
    const res = await this.userService.getContactsIds(userid);
    return {
      statusCode: HttpStatus.OK,
      message: 'Ok contacts',
      res,
    };
  }

  @Get('test')
  @UseGuards(JwtAuthGuard)
  test(@Req() req) {
    const userid = req?.user?.userId;
    return {
      statusCode: HttpStatus.OK,
      message: 'Ok contacts',
    };
  }
}
