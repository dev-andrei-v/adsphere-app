import {Component, Input, OnInit, signal} from '@angular/core';




import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import { AuthStore } from '../../../../stores/auth.store';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { ContactSellerModalComponent } from '../contact-seller-modal/contact-seller-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ad-price',
  imports: [
    NzCardComponent,
    NzTagComponent,
    NzIconDirective,
    NzButtonComponent,
    NzTooltipDirective,
    ContactSellerModalComponent
  ],
  templateUrl: './ad-price.component.html',
  styleUrl: './ad-price.component.scss'
})
export class AdPriceComponent implements OnInit {
  @Input() ad: any;
  @Input({required: true}) adId!: string;
  @Input() price: number | undefined;
  @Input() currency: string | undefined;
  @Input() transactionType: string | undefined;

  showModal = signal<boolean>(false);

  transactionTypeDetails = signal({
    label: "Preț fix",
    tagColor: "blue",
  })

  constructor(
    readonly router: Router,
    readonly authStore: AuthStore) {}

  ngOnInit(): void {
      this.setTransactionTypeDetails()
  }

  private setTransactionTypeDetails() {
    switch (this.transactionType?.toUpperCase()) {
      case 'FIXED':
        this.transactionTypeDetails.set({
          label: "Preț fix",
          tagColor: "blue"
        });
        break;
      case 'NEGOTIABLE':
        this.transactionTypeDetails.set({
          label: "Preț negociabil",
          tagColor: "red"
        });
        break;
      case 'AUCTION':
        this.transactionTypeDetails.set({
          label: "Licitație",
          tagColor: "orange"
        });
        break;
      case 'FREE':
        this.transactionTypeDetails.set({
          label: "Gratuit",
          tagColor: "green"
        });
        break;
      case 'EXCHANGE':
        this.transactionTypeDetails.set({
          label: "Schimb",
          tagColor: "purple"
        });
        break;
      default:
        this.transactionTypeDetails.set({
          label: "Preț nespecificat",
          tagColor: "gray"
        });
        break;
    }
  }

  get isUserAuthenticated(): boolean {
    return this.authStore.isAuthenticated();
  }

  handleToggleModal() {
    this.showModal.set(!this.showModal());
  }

  handleModalSubmit() {
    this.showModal.set(false);
    this.router.navigate(['/user/conversations'], { queryParams: { id: this.adId } });
  }

  handleModalHide() {
    this.showModal.set(false);
  }

  get isSellerTheLoggedInUser(): boolean {
    return this.authStore.isAuthenticated() && this.authStore.getUserId() === this.ad.userId;
  }

}
