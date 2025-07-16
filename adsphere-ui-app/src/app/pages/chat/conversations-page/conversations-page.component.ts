import { Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { NzSiderComponent } from 'ng-zorro-antd/layout';
import {
  NzListComponent,
  NzListItemComponent,
  NzListItemMetaComponent,
  NzListItemMetaTitleComponent
} from 'ng-zorro-antd/list';
import { DatePipe, NgClass } from '@angular/common';
import { NzSkeletonComponent } from 'ng-zorro-antd/skeleton';
import { FormsModule } from '@angular/forms';
import { ChatService, Conversation } from '../../../services/chat.service';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { AuthStore } from '../../../stores/auth.store';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConversationsSidebarComponent } from '../conversations-sidebar/conversations-sidebar.component';
import { ConversationMessagesComponent } from '../conversation-messages/conversation-messages.component';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'app-conversations-page',
  imports: [
    FormsModule,
    ConversationsSidebarComponent,
    ConversationMessagesComponent,
    MessageInputComponent
  ],
  templateUrl: './conversations-page.component.html',
  styleUrl: './conversations-page.component.scss'
})
export class ConversationsPageComponent implements OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  conversations = signal<Conversation[]>([])
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<any[]>([]);
  newMessage = signal<string>('');
  isConversationLoading = signal<boolean>(false);

  private messageSubscription: Subscription | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authStore: AuthStore,
    private readonly chatService: ChatService,
  ){}
  ngOnInit(): void {
    this.fetchConversations()

  }

  fetchConversations(){
    this.isConversationLoading.set(true);
    this.chatService.getConversationsForLoggedInUser().subscribe(
      {
        next: (conversations: Conversation[]) => {
          console.log('Conversations fetched:', conversations);
          const sortedConversations = [...conversations].sort(
            (a: Conversation, b: Conversation) => {
              const aDate = new Date(a.lastMessageDate);
              const bDate = new Date(b.lastMessageDate);
              return bDate.getTime() - aDate.getTime();
            }
          );
          this.conversations.set(sortedConversations);

          this.route.queryParamMap.subscribe(params => {
            const adId = params.get('id');
            console.log('Ad ID from route:', adId); // ← aici NU va fi null
            if (adId) {
              const conversation = conversations.find(c => c.adId === adId);
              if (conversation) {
                this.selectConversation(conversation);
              }
            }

          });

          this.isConversationLoading.set(false);
        },
        error: (error) => {
          console.error('Eroare la încărcarea conversațiilor:', error);
        }
      }
    )
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    console.log("Selected conversation:", conv);
    if (conv?.adId) {
      this.messageSubscription = this.chatService.subscribeToMessages(conv.adId)
        .subscribe(newMessage => {
          if (newMessage) {
            console.log("New message received:", newMessage);
            this.scrollToBottom();
          }
        });
    }

    this.chatService.getMessagesByAd(conv.adId, conv.sellerId, conv.buyerId).subscribe({
      next: (messages) => {
        console.log('messages', messages);
        this.messages.set(messages);

        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Eroare la încărcarea mesajelor:', error);
      }
    });
  }

  messageSender(message: any): 'me' | 'other' {
    return message.senderId === this.authStore.user()?.id ? 'me' : 'other';
  }

  sendMessage() {
    const newMessageContent = this.newMessage().trim();
    const selectedConv = this.selectedConversation();

    if(selectedConv == null) return;

    const receiverId = selectedConv.sellerId === this.authStore.user()?.id
      ? selectedConv.buyerId
      : selectedConv.sellerId;

    this.chatService.sendMessage(
      selectedConv.adId,
      newMessageContent,
      receiverId
    ).subscribe({
      next: (response) => {
        if(response.data.sendMessage === true) {
          const insertedMessage = {
            _id: "local_" + new Date().getTime(),
            adId: this.selectedConversation()?.adId,
            senderId: this.authStore.user()?.id,
            content: newMessageContent,
            createdAt: new Date().toISOString(),
          }
          this.messages.update(msgs => [...msgs, insertedMessage]);
          this.newMessage.set('');
          this.scrollToBottom();
          this.fetchConversations();
        } else {
          console.error('Failed to send message');
        }
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    }
    )
  }

  get adUrl(): string {
    const adId = this.selectedConversation()?.adId;
    return adId ? `/ad/${adId}` : '';
  }

  private scrollToBottom(): void {
    setTimeout(() => { // setTimeout asigură că DOM-ul s-a actualizat
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }
}
