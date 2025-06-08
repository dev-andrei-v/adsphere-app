import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { AuthStore } from '../stores/auth.store';
import { map, Observable, tap } from 'rxjs';

export interface CreateOfferInput {
  type: string;
  amount?: number;
  exchangeAdId?: string;
}

export interface ContactAdInput {
  adId: string;
  senderId: string;
  content?: string;
  offer?: CreateOfferInput;
}

export interface Conversation {
  adId: string;
  adTitle: string;
  adImage?: string;
  lastMessage: string;
  lastMessageDate: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
}

export const CONTACT_SELLER_MUTATION = gql`
  mutation ContactSellerForAd($input: ContactAdInput!) {
    contactSellerForAd(input: $input)
  }
`;

export const GET_CONVERSATIONS_QUERY = gql`
  query Conversations($userId: ID!) {
    conversations(userId: $userId) {
      adId
      adTitle
      adImage
      lastMessage
      lastMessageDate
      buyerId
      buyerName
      sellerId
      sellerName
    }
  }
`

export const GET_MESSAGES_BY_AD_QUERY = gql`
  query MessagesByAd($adId: ID!, $userId: ID!, $sellerId: ID!, $buyerId: ID!) {
    messages(adId: $adId, userId: $userId, sellerId: $sellerId, buyerId: $buyerId) {
      _id
      adId
      content
      createdAt
      receiverId
      senderId
      offer {
        amount
        exchangeAdId
        type
      }
    }
  }
`;

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($input: CreateMessageInput!) {
    sendMessage(input: $input)
}
`

export const MESSAGE_SENT_SUBSCRIPTION = gql`
  subscription MessageSent($adId: ID!) {
    messageSent(adId: $adId) {
      _id
      adId
      content
      createdAt
      receiverId
      senderId
      offer {
        amount
        exchangeAdId
        type
      }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(
    readonly apollo: Apollo,
    readonly authStore: AuthStore,
  ) {}

  getConversationsForLoggedInUser(): Observable<Conversation[]> {
    const userId = this.authStore.user()?.id;
    return this.apollo.query<{ conversations: Conversation[] }>({
      query: GET_CONVERSATIONS_QUERY,
      variables: { userId },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.conversations)
    );
  }

  getMessagesByAd(adId: string, sellerId: string, buyerId: string): Observable<any[]> {
    const userId = this.authStore.user()?.id;
    return this.apollo.query<{ messages: any[] }>({
      query: GET_MESSAGES_BY_AD_QUERY,
      variables: { adId, userId, sellerId, buyerId },
      fetchPolicy: 'network-only'
    }).pipe(
      tap(result => console.log("Messages fetched:", result)),
      map(result => result.data.messages)
    );
  }

  sendMessage(adId: string, content: string, receiverId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: SEND_MESSAGE_MUTATION,
      variables: {
        input: {
          adId,
          senderId: this.authStore.user()?.id,
          receiverId,
          content
        }
      }
    })
  }

  contactSeller(input: ContactAdInput) {
    return this.apollo.mutate({
      mutation: CONTACT_SELLER_MUTATION,
      variables: { input }
    });
  }

  subscribeToMessages(adId: string): Observable<any> {
    return this.apollo.subscribe({
      query: MESSAGE_SENT_SUBSCRIPTION,
      variables: { adId }
    }).pipe(

    );
  }
}
