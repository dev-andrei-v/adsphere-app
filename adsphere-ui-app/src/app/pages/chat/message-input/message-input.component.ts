import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [FormsModule, NzButtonComponent, NzInputDirective],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss'
})
export class MessageInputComponent {
  @Input() model: string = '';
  @Output() modelChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<void>();

  onInput(value: string) {
    this.modelChange.emit(value);
  }

  onSend() {
    this.send.emit();
  }
}
