import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-conversation-messages',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './conversation-messages.component.html',
  styleUrl: './conversation-messages.component.scss'
})
export class ConversationMessagesComponent {
  @Input() messages: any[] = [];
  @Input() messageSender!: (msg: any) => 'me' | 'other';
}
