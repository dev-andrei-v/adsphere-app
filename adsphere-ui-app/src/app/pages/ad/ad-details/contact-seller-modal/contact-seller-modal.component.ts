import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { NzModalComponent, NzModalContentDirective } from 'ng-zorro-antd/modal';
import { NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzColDirective } from 'ng-zorro-antd/grid';
import { NzInputDirective, NzInputGroupComponent, NzInputGroupWhitSuffixOrPrefixDirective } from 'ng-zorro-antd/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { ChatService, ContactAdInput, CreateOfferInput } from '../../../../services/chat.service';
import { AuthStore } from '../../../../stores/auth.store';
import { AdService } from '../../../../services/ad.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-contact-seller-modal',
  imports: [
    NzModalComponent,
    NzModalContentDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzInputDirective,
    ReactiveFormsModule,
    NzInputGroupWhitSuffixOrPrefixDirective,
    NzFormControlComponent,
    NzSelectComponent,
    NzOptionComponent,
    NzInputGroupComponent
  ],
  templateUrl: './contact-seller-modal.component.html',
  styleUrl: './contact-seller-modal.component.scss'
})
export class ContactSellerModalComponent implements OnInit {
  @Input({required: true}) adId!: string
  @Input() isVisible: boolean = false;
  @Input() currency: string = 'RON';
  @Input() transactionType: string | undefined = '';
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  contactSellerForm: FormGroup;

  auctionTotal = signal(0);
  auctionMinPrice = signal(0);
  auctionIncreasePercentage = signal("0.00");
  auctionAuthUserParticipated = signal(false);
  @Output() hide = new EventEmitter<unknown>();
  canSendMessage = signal<boolean>(true);

  constructor(
    private readonly fb: FormBuilder,
    private readonly authStore: AuthStore,
    private readonly notificationService: NzNotificationService,
    private chatService: ChatService,
    private adService: AdService
  ) {
    this.contactSellerForm = this.fb.group(
      {
        content: [''],
        priceNegotiable: [null],
        priceAuction: [null],
        exchangeAdId: [null],
        priceDifference: [null]
      }
    )
  }

  ngOnInit(): void {
    if (this.transactionType == 'auction') {
      const priceAuctionCtrl = this.contactSellerForm.get('priceAuction');
      this.adService.getAuctionInfo(this.adId).subscribe(
        {
          next: (auctionInfo) => {
            this.auctionIncreasePercentage.set(auctionInfo.increasePercentage);
            this.auctionMinPrice.set(auctionInfo.minPrice);
            this.auctionAuthUserParticipated.set(auctionInfo.authUserParticipated);

            if(this.auctionAuthUserParticipated()) {
              this.contactSellerForm.get('priceAuction')?.disable();
              this.canSendMessage.set(false);
            }


            priceAuctionCtrl?.setValidators([Validators.required, Validators.min(auctionInfo.minPrice)]);
            priceAuctionCtrl?.setValue(auctionInfo.minPrice);

          },
          error: (error) => {
            console.error('Error fetching auction info:', error);
          }
        }
      )
    }
  }
  handleCancel(): void {
    this.closed.emit();
  }

  handleOk() {
    const contactAdInputData: ContactAdInput = {
      adId: this.adId,
      senderId: this.authStore.user()?.id ?? '',
      content: this.contactSellerForm.value.content,
    }

    if(this.transactionType && (this.transactionType === 'auction' || this.transactionType === 'exchange' || this.transactionType === 'negotiable')) {
      const offer: CreateOfferInput = {
        type: this.transactionType.toUpperCase()
      }
      if(this.transactionType === 'exchange') {
        offer.exchangeAdId = this.contactSellerForm.value.exchangeAdId;
        offer.amount = this.contactSellerForm.value.priceDifference;
      }
      if(this.transactionType === 'auction') {
        offer.amount = this.contactSellerForm.value.priceAuction;
      }
      if(this.transactionType === 'negotiable') {
        offer.amount = this.contactSellerForm.value.priceNegotiable;
      }
      contactAdInputData.offer = offer;
    }
    console.log('Contact Ad Input Data:', contactAdInputData);
    this.chatService.contactSeller(contactAdInputData).subscribe({
        next: (response) => {
          // @ts-ignore
          if(response?.data?.contactSellerForAd) {
            this.submitted.emit();
          } else {
            this.hide.emit();
            this.notificationService.warning("Atenție", "Nu s-a putut trimite mesajul către vânzător. Încearcă mai târziu.");
          }

        }, error: (error) => {
          this.notificationService.error("Eroare", "Nu s-a putut trimite mesajul către vânzător. Încearcă mai târziu.");
        }
      }
    )
  }
}
