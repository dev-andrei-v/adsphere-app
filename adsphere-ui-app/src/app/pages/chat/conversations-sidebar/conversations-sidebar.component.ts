import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Conversation } from '../../../services/chat.service';
import { NzListComponent, NzListItemComponent, NzListItemMetaComponent } from 'ng-zorro-antd/list';
import { NgForOf, NgIf } from '@angular/common';
import { AuthStore } from '../../../stores/auth.store';

@Component({
  selector: 'app-conversations-sidebar',
  standalone: true,
  imports: [NzListComponent, NzListItemComponent, NzListItemMetaComponent, NgIf, NgForOf],
  templateUrl: './conversations-sidebar.component.html',
  styleUrl: './conversations-sidebar.component.scss'
})
export class ConversationsSidebarComponent {
  @Input() conversations: Conversation[] = [];
  @Input() selectedConversation: Conversation | null = null;
  @Input() isLoading: boolean = false;
  @Output() conversationSelected = new EventEmitter<Conversation>();

  constructor(
    private readonly authStore: AuthStore
  ) {}

  onSelect(conversation: Conversation) {
    this.conversationSelected.emit(conversation);
  }

  conversationTitle(conversation: Conversation): string {
    const userId = this.authStore.user()?.id;
    if (conversation.sellerId === userId) {
      return conversation.buyerName;
    } else if (conversation.buyerId === userId) {
      return conversation.sellerName;
    }
    return ""
  }

  conversationDescription(conversation: Conversation) {
    if(conversation.lastMessage != '') {
      return conversation.lastMessage.length > 50
        ? conversation.lastMessage.substring(0, 37) + '...'
        : conversation.lastMessage;
    }

    return "";
  }
}
