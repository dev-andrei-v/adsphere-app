import { Component, OnInit } from '@angular/core';
import { AdCardComponent } from "../../../shared/ad-card/ad-card.component";
import { signal } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { AdCardData } from '../../../models/ad.model';
import { NzIconDirective } from "ng-zorro-antd/icon";

@Component({
  selector: 'app-user-favorites-page',
    imports: [
        AdCardComponent,
        NzIconDirective
    ],
  templateUrl: './user-favorites-page.component.html',
  styleUrl: './user-favorites-page.component.scss'
})
export class UserFavoritesPageComponent implements OnInit {
  userAds = signal<AdCardData[]>([]);

  constructor(private userService: UserService) {

  }

  ngOnInit(): void {
   this.loadFavorites();
    }

    private loadFavorites(){
      this.userService.getUserFavorites()
        .subscribe((response) => {
          this.userAds.set(response.data);
        });
    }

  handleFavoriteChange($event: boolean) {
    this.loadFavorites();
  }
}
