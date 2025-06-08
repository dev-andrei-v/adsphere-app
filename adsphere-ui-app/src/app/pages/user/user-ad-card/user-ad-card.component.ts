import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {DatePipe} from '@angular/common';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {Router} from '@angular/router';
import { AdService } from '../../../services/ad.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-user-ad-card',
  imports: [
    NzButtonComponent,
    NzIconDirective,
    NzCardComponent,
    DatePipe,
    NzTagComponent
  ],
  templateUrl: './user-ad-card.component.html',
  styleUrl: './user-ad-card.component.scss'
})
export class UserAdCardComponent{
  @Input() userAd: any;
  @Output() onAdModified = new EventEmitter();

  constructor(
    private router: Router,
    private notificationService: NzNotificationService,
    private adService: AdService
  ) {
    console.log(this.userAd)
    // this.isDisabled.set(this.userAd.status === 'disabled')
  }
  get firstImage(){
    if(this.userAd.images && this.userAd.images.length > 0) {
      return this.userAd.images[0].url;
    } else {
      return `/no-image.jpg`
    }
  }

  navigateToAd(slug: any) {
    this.router.navigate(['/ad', slug]).then(() => {
      window.scrollTo(0, 0);
    });
  }

  editAd() {
    console.log('Editing ad:', this.userAd.id);
    this.router.navigate(['/ad/edit', this.userAd._id]).then(() => {
      window.scrollTo(0, 0);
    });
  }

  deactivateAd() {
    // Logic to deactivate the ad
    console.log('Deactivating ad:', this.userAd.id);
    this.adService.disableAd(this.userAd._id).subscribe({
        next: (response) => {
          console.log('Ad deactivated successfully:', response);
          this.userAd.status = 'deleted'; // Update the status locally
          this.notificationService.warning('Anunț dezactivat', 'Anunțul a fost dezactivat cu succes.');
          this.onAdModified.emit();
        },
        error: (error) => {
          console.error('Error deactivating ad:', error);
          // Handle error, e.g., show an error message
        }
      }
    )
  }

  get isDezactiveazaDisabled() {
    return this.userAd.status === 'deleted'
  }

  get isAdActive() {
    return this.userAd.status === 'approved';
  }

  reactivateAd() {
    this.adService.enableAd(this.userAd._id).subscribe({
      next: (response) => {
        console.log('Ad reactivated successfully:', response);
        this.userAd.status = 'approved'; // Update the status locally
        this.notificationService.success('Anunț reactivat', 'Anunțul a fost reactivat cu succes.');
        this.onAdModified.emit();
        },
      error: (error) => {
        console.error('Error reactivating ad:', error);
        // Handle error, e.g., show an error message
      }
    })
  }
}
