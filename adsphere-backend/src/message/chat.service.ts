import { Injectable, Logger } from '@nestjs/common';
import { ContactAdInput, CreateMessageInput } from './message.resolver';
import { Message } from './schema/message.schema';
import { Conversation } from './dto/conversation';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, PipelineStage } from 'mongoose';
import { Ad } from '../ad/schema/ad.schema';
import { GraphQLResolveInfo } from 'graphql/type';
import graphqlFields from 'graphql-fields';

import { Message as MessageDto, Offer as OfferDto } from './dto/message'

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Ad.name) private adModel: Model<Ad>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ){

  }
  async post(input: CreateMessageInput): Promise<boolean> {
    //check if ad exists
    const ad = await this.adModel.findOne({ _id: input.adId })
      .select("_id userId");
     if(!ad) {
        return false;
     }
     const sellerId = ad.userId; // Assuming the ad's userId is the seller
    // Check if the sender is the seller or buyer
    const senderObjectId = new mongoose.Types.ObjectId(input.senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(input.receiverId);

    const newMessage = new this.messageModel(input);
    newMessage.receiverId = receiverObjectId;
    newMessage.senderId = senderObjectId;

    await newMessage.save();
    return true;
  }

  async getMessagesByAd(adId: string, userId: string, sellerId: string, buyerId: string): Promise<MessageDto[]> {
    const adObjectId = new mongoose.Types.ObjectId(adId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const buyerObjectId = new mongoose.Types.ObjectId(buyerId);

    // Either seller or buyer must be the user
    if (!sellerObjectId.equals(userObjectId) && !buyerObjectId.equals(userObjectId)) {
      this.logger.error(`User ${userId} is neither the seller nor the buyer for ad ${adId}`);
      throw new Error(`User ${userId} is not authorized to view messages for ad ${adId}`);
    }

    const result = await this.messageModel
      .find({
        adId: adObjectId,
        $or: [
          { senderId: sellerObjectId, receiverId: buyerObjectId },
          { senderId: buyerObjectId, receiverId: sellerObjectId }
        ]
      })
      .sort({ createdAt: 1 })
      .exec();

    return result.map((doc) => {
      const dto = new MessageDto();
      dto._id = doc._id.toString();
      dto.adId = doc.adId.toString();
      dto.senderId = doc.senderId.toString();
      dto.receiverId = doc.receiverId.toString();
      dto.content = doc.content;
      dto.createdAt = doc.createdAt;

      if (doc.offer) {
        const offer = new OfferDto();
        offer.type = doc.offer.type;
        offer.amount = doc.offer.amount;
        offer.exchangeAdId = doc.offer.exchangeAdId?.toString();
        dto.offer = offer;
      }

      return dto;
    });
  }


  async getConversations(userId: string, info: GraphQLResolveInfo): Promise<Conversation[]> {
    const requestedFields = graphqlFields(info);

    const projectStage: Record<string, any> = {
      adId: 1,
      lastMessage: 1,
      lastMessageDate: -1,
    };

    if (requestedFields['adTitle']) {
      projectStage['adTitle'] = '$ad.title';
    }
    if (requestedFields['adImage']) {
      projectStage['adImage'] = { $arrayElemAt: ['$ad.images.url', 0] };
    }
    if (requestedFields['sellerId']) {
      projectStage['sellerId'] = '$seller._id';
    }
    if (requestedFields['sellerName']) {
      projectStage['sellerName'] = '$seller.name';
    }
    if (requestedFields['buyerId']) {
      projectStage['buyerId'] = 1;
    }
    if (requestedFields['buyerName']) {
      projectStage['buyerName'] = '$buyer.name';
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          $or: [
            { senderId: userObjectId },
            { receiverId: userObjectId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          participants: {
            $cond: {
              if: { $lt: ['$senderId', '$receiverId'] },
              then: ['$senderId', '$receiverId'],
              else: ['$receiverId', '$senderId']
            }
          }
        }
      },
      {
        $group: {
          _id: {
            adId: '$adId',
            participants: '$participants'
          },
          lastMessage: { $first: '$content' },
          lastMessageDate: { $first: '$createdAt' },
          adId: { $first: '$adId' },
          senderId: { $first: '$senderId' },
          receiverId: { $first: '$receiverId' }
        }
      },
      {
        $project: {
          adId: 1,
          buyerId: {
            $cond: {
              if: { $eq: ['$senderId', userObjectId] },
              then: '$senderId',
              else: '$receiverId'
            }
          },
          receiverId: 1,
          lastMessage: 1,
          lastMessageDate: 1
        }
      },
      {
        $lookup: {
          from: 'ads',
          localField: 'adId',
          foreignField: '_id',
          as: 'ad'
        }
      },
      { $unwind: '$ad' },
    ];

    if (requestedFields['sellerId'] || requestedFields['sellerName']) {
      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'ad.userId',
            foreignField: '_id',
            as: 'seller'
          }
        },
        { $unwind: '$seller' }
      );
    }

    if (requestedFields['buyerName']) {
      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'buyerId',
            foreignField: '_id',
            as: 'buyer'
          }
        },
        { $unwind: '$buyer' }
      );
    }

    pipeline.push({ $project: projectStage });

    return this.messageModel.aggregate(pipeline);
  }


  // This is used for contacting the seller of an ad
  // Also this initiates a conversation if it doesn't exist
  async contactSellerWithOffer(input: ContactAdInput): Promise<boolean> {
    this.logger.log("Received contact seller request with input:", input);
    // Check if ad exists
    const ad = await this.adModel.findOne({ _id: input.adId }).lean()
    if (!ad) {
      this.logger.error(`Ad with ID ${input.adId} not found.`);
      return false;
    }
    // Check if user already has an ongoing conversation with the seller
    const existingConversation = await this.messageModel.findOne({
      adId: input.adId,
      senderId: input.senderId,
      receiverId: ad.userId, // Assuming the ad's userId is the seller
    });
    if (existingConversation) {
      this.logger.log(`Existing conversation found for ad ${input.adId} between sender ${input.senderId} and receiver ${ad.userId}.`);
      // You can update the existing conversation or return early
      return false;
    }
    this.logger.log(`No existing conversation found for ad ${input.adId}. Creating a new message.`);
    // If no conversation exists, create a new message
    const message = new this.messageModel({
      adId: input.adId,
      senderId: input.senderId,
      receiverId: ad?.userId, // Assuming the ad's userId is the seller
      content: input.content,
      offer: input.offer,
    });
    await message.save();
    this.logger.log(`Message sent to seller with ID ${ad.userId} for ad ${input.adId}.`);
    return true;
  }
}
