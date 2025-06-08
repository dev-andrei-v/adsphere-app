import { Component, Input } from '@angular/core';


import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzRateComponent } from 'ng-zorro-antd/rate';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NzTagComponent } from 'ng-zorro-antd/tag';
import { AuthStore } from '../../../../stores/auth.store';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-ad-seller-info',
  imports: [
    NzCardComponent,
    NzIconDirective,
    NzButtonComponent,
    NzRateComponent,
    FormsModule,
    DatePipe,
    NzTagComponent,
    RouterLink
  ],
  templateUrl: './ad-seller-info.component.html',
  styleUrl: './ad-seller-info.component.scss'
})
export class AdSellerInfoComponent {
  @Input() seller: any;
  @Input({required: true}) adId!: string;

  constructor(private authStore: AuthStore,
              private router: Router) {
  }

  get sellerInitials() {
    if (!this.seller || !this.seller.name) {
      return '';
    }
    const names = this.seller.name.replace("-", "")
      .split(' ');
    const initials = names.map((name: string) => name.charAt(0).toUpperCase()).join('');
    return initials;
  }

  get sellerType() {
    if (this.seller.type === "USER_INDIVIDUAL") {
      return "Persoană fizică";
    }
    if (this.seller.type === "USER_BUSINESS") {
      return "Firmă";
    }
    return "";
  }

  get rating() {
    if (!this.seller || !this.seller.rating) {
      return 0;
    }
    return this.seller.rating;
  }

  get isThisSellerAd() {
    return this.authStore.getUserId() === this.seller.id;
  }

  navigateToEditAd() {
    this.router.navigate(['/ad/edit', this.adId]).then();
  }
}
