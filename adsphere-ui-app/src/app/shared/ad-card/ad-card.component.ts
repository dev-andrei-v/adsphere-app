import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';

import {RouterLink} from '@angular/router';


import {AdCardData} from '../../models/ad.model';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {formatDistanceToNow} from 'date-fns';
import {ro} from 'date-fns/locale';
import {NgOptimizedImage} from '@angular/common';
import { AuthStore } from '../../stores/auth.store';
import { NzToolTipComponent, NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { AdService } from '../../services/ad.service';
import { UserService } from '../../services/user.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-ad-card',
  imports: [
    RouterLink,
    NzCardComponent,
    NzIconDirective,
    NzButtonComponent,
    NzTooltipDirective
  ],
  templateUrl: './ad-card.component.html',
  styleUrl: './ad-card.component.scss'
})
export class AdCardComponent implements OnInit {
  @Input() ad: AdCardData | undefined;

  private readonly DEFAULT_WIDTH = 400;
  private readonly DEFAULT_HEIGHT = 300;
  isAddedToFavorite = signal(false);

  @Output() favoriteChange = new EventEmitter<boolean>();

  constructor(
    private readonly authStore: AuthStore,
    private readonly userService: UserService,
    private readonly notificationService: NzNotificationService,
  ) {
  }

  ngOnInit(): void {
    if (this.ad?.isFavorite) {
      this.isAddedToFavorite.set(true);
    }
  }

  time() {
    return formatDistanceToNow(this.ad!.updatedAt, {addSuffix: true, locale: ro});
  }

  get featuredImage() {
    const defaultImage = 'no-image.jpg';
    const imageUrl = this.ad?.images[0]?.url

    return imageUrl ? this.getResizedImageUrl(imageUrl) : defaultImage;
  }

  private getResizedImageUrl(url?: string, width: number = this.DEFAULT_WIDTH, height: number = this.DEFAULT_HEIGHT): string {
    if (!url) {
      return 'assets/images/no-image.png';
    }
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
  }

  get isFavoriteEnabled(): boolean {
    return this.authStore.isAuthenticated();
  }

  toggleFavorite() {
    if(this.isAddedToFavorite()) {
      this.userService.removeAdFromFavorites(this.ad!._id).subscribe({
        next: () => {
          this.isAddedToFavorite.set(false);
          this.favoriteChange.emit(false);
        },
        error: (error) => {
          console.error('Error removing ad from favorites:', error);
        }
      });
    } else {
      this.userService.adToFavorite(this.ad!._id).subscribe({
        next: (data) => {
          this.isAddedToFavorite.set(true);
          this.favoriteChange.emit(true);
        },
        error: (error) => {
          console.error('Error adding ad to favorites:', error);
          if(error.status == 409 && error.error.message === 'You cannot favorite your own ad') {
            this.notificationService.warning("Eroare", "Nu puteti adauga propriul anunt la favorite");
          }
        }
      });
    }
  }
}
