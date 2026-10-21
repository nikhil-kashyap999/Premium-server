import { Model } from 'mongoose';
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Conversation, ConversationDocument } from "./schema/conversations.schema";

@Injectable()
export class ConversationService{
    constructor(@InjectModel(Conversation.name) private convoModel:Model<ConversationDocument>){}

    async getUSerConversationIDs(){}
}