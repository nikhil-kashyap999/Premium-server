import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './DTO/CreateUser.Dto';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { ChatRequest, ChatRequestDocument } from './schemas/chatRequest.schema';
import { ContactDocument, Contacts } from './schemas/contacts.schema';
import OTPGenerator from '../utils/OTP-generator.util';
import {
  Conversation,
  ConversationDocument,
} from 'src/websocket/schema/conversations.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(ChatRequest.name)
    private chatRequestModel: Model<ChatRequestDocument>,
    @InjectModel(Contacts.name) private contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name)
    private convoModel: Model<ConversationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ------------------------------------------ Register new user ---------------------------------
  async createUser(data: CreateUserDto) {
    const email = data.email.toLowerCase();
    const username = data.username.toLowerCase();

    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser?.isVerified) {
      throw new ConflictException('User already exists');
    }

    const OTP = OTPGenerator();
    const [hashedPassword, hashedOTP] = await Promise.all([
      this.hashValue(data.password),
      this.hashValue(OTP),
    ]);
    const otpExpiresAt = new Date();

    if (existingUser) {
      existingUser.set({
        email,
        username,
        password: hashedPassword,
        verificationToken: hashedOTP,
        unverifiedExpiresAt: otpExpiresAt,
      });
      await existingUser.save();
      return { user: existingUser, OTP };
    }

    const user = await this.userModel.create({
      ...data,
      email,
      username,
      password: hashedPassword,
      verificationToken: hashedOTP,
      unverifiedExpiresAt: otpExpiresAt,
    });
    return { user, OTP };
  }

  // ------------------------------------------ Get user by username ---------------------------------

  async findByUsername(username: string) {
    const user = await this.userModel
      .findOne({ username })
      .select('+password -media -contacts -otpAttempts');
    return user;
  }

  async markIsActive(userObj: UserDocument) {
    userObj.isActive = true;
    const user = (await userObj.save()).toObject();
    return user;
  }
  // ------------------------------------------ Get all users ---------------------------------
  async allUsers() {
    try {
      const allUsers = await this.userModel.find();
      return allUsers;
    } catch (error) {
      throw new Error(' while fetching all user');
    }
  }

  // ------------------------------------------ Get user by userid ---------------------------------
  async findById(userid: string) {
    const user = await this.userModel.findById(userid);
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  // ------------------------------------------Get authenticated user by accessToken---------------------------------
  async me(userid: string) {
    const user = await this.userModel.findById(userid);
    if (!user) throw new NotFoundException('user not found');
    if (!user.isVerified)
      throw new UnauthorizedException('please verify yourself first.');
    user.isActive = true;
    await user.save();
    return user;
  }
  // ------------------------------------------Get user ChatReuests---------------------------------
  async getChatRequests(receiverId: string) {
    const chatRequests = await this.chatRequestModel
      .find({ receiverId, status: 'PENDING' })
      .populate('senderId', 'username avatarUrl email')
      .lean();
    if (!chatRequests) throw new NotFoundException('chat request not found');
    const formattedResponse = chatRequests.map((req) => ({
      requestId: req._id,
      staus: req.status,
      sender: req.senderId,
    }));
    return formattedResponse;
  }
  // ------------------------------------------ Search users (for invite feature) ---------------------------------
  async searchUsersAndInvite(query: string, requestSenderid: string) {
    const requestSenderContacts = await this.contactModel.distinct(
      'contactUserId',
      {
        userId: requestSenderid,
      },
    );
    const requestSenderRequestsIds = await this.chatRequestModel.distinct(
      'senderId',
      { receiverId: requestSenderid },
    );
    const excludeIds = [
      requestSenderid,
      ...requestSenderContacts,
      ...requestSenderRequestsIds,
    ];
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await this.userModel
      .find({
        username: { $regex: `^${escapeRegex(query)}`, $options: 'i' },
        role: { $ne: UserRole.ADMIN },
        _id: { $nin: excludeIds },
      })
      .select('_id username avatarUrl role isVerified isActive')
      .limit(20)
      .lean();
    if (!users.length)
      throw new NotFoundException(`Username ${query} not found`);
    return users;
  }
  // ------------------------------------------Create Invite---------------------------------
  async createInvite(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot invite yourself');
    }

    const existing = await this.chatRequestModel
      .findOne({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      })
      .select('status')
      .lean();

    if (existing?.status === 'PENDING') {
      throw new ConflictException('Invite already pending.');
    }
    if (existing?.status === 'ACCEPTED') {
      throw new ConflictException('You are already contacts.');
    }

    let inviteId: string;

    try {
      if (existing) {
        await this.chatRequestModel.updateOne(
          { _id: existing._id },
          { $set: { status: 'PENDING', senderId, receiverId } },
        );
        inviteId = existing._id.toString();
      } else {
        const created = await this.chatRequestModel.create({
          senderId,
          receiverId,
          status: 'PENDING',
        });
        inviteId = created._id.toString();
      }

      const sender = await this.userModel
        .findById(senderId)
        .select('username avatarUrl')
        .lean();

      this.eventEmitter.emit('invite.sent', {
        receiverId,
        event: 'invite:notification',
        payload: {
          inviteId,
          senderId,
          username: sender?.username,
          avatarUrl: sender?.avatarUrl,
        },
      });

      return { inviteId, message: 'Invite sent.' };
    } catch (error) {
      Logger.error('createInvite failed', error);
      throw new InternalServerErrorException('Could not send invite.');
    }
  }
  async acceptInvite(requestId: string) {
    const request = await this.chatRequestModel.findOneAndUpdate(
      { _id: requestId, status: 'PENDING' },
      { $set: { status: 'ACCEPTED' } },
      { returnDocument: 'after' },
    );

    if (!request) {
      throw new NotFoundException('Invite not found or already handled.');
    }

    const senderId = request.senderId.toString();
    const receiverId = request.receiverId.toString();
    const directKey = [senderId, receiverId].sort().join(':');

    try {
      await Promise.all([
        this.contactModel.create({
          userId: senderId,
          contactUserId: receiverId,
        }),
        this.contactModel.create({
          userId: receiverId,
          contactUserId: senderId,
        }),
        this.convoModel.updateOne(
          { directKey },
          { $setOnInsert: { participants: [senderId, receiverId] } },
          { upsert: true },
        ),
      ]);
      return 'Invite accepted.';
    } catch (error) {
      Logger.error('acceptInvite failed', error);
      throw new InternalServerErrorException('Invite acceptance failed.');
    }
  }
  async rejectInvite(requestId: string) {
    try {
      await this.chatRequestModel.findOneAndUpdate({
        _id: requestId,
        status: 'REJECTED',
      });
      return 'Request Rejected successfully';
    } catch (error) {
      throw new ConflictException(
        'Error while performing operation, Please try again later',
      );
    }
  }
  // ------------------------------------------ Logout ---------------------------------
  async logout(userid: string) {
    const user = await this.userModel.findOneAndUpdate(
      { _id: userid },
      { isActive: false },
    );
    if (!user) throw new NotFoundException('User not found, Error on logout');
    return true;
  }
  // ------------------------------------------ Get user contacts ---------------------------------
  async getContacts(userId: string) {
    const contacts = await this.contactModel
      .find({ userId })
      .select('contactUserId')
      .populate('contactUserId', 'username email avatarUrl isActive');
    return contacts.map((c) => c.contactUserId);
  }
  async getContactsIds(userId: string): Promise<string[] | null> {
    try {
      const contactsids = await this.contactModel
        .find({ userId })
        .select('contactUserId -_id')
        .lean();
      return contactsids.map((c) => String(c['contactUserId']));
    } catch (error) {
      console.error('Error : ', error);
      return null;
    }
  }
  // -----------------------------------------------------------------------------
  // -------------------------helper services-----------------------------------
  private async hashValue(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
  }
}
