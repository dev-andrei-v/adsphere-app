import { Component, Input } from '@angular/core';
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzResultComponent} from "ng-zorro-antd/result";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-ad-sent-message',
    imports: [
        NzButtonComponent,
        NzResultComponent,
        RouterLink
    ],
  templateUrl: './ad-sent-message.component.html',
  styleUrl: './ad-sent-message.component.scss'
})
export class AdSentMessageComponent {
  @Input() messageTitle: string = "Anunțul a fost trimis cu succes spre validare";
  @Input() messageSubTitle: string = "Va fi publicat în cateva minute după moderare de către echipa noastră.";
  @Input() previewAdId?: string | null;
}
