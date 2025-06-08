import {Component, OnInit, signal} from '@angular/core';
import {UserService} from '../../../services/user.service';
import {UserAdCardComponent} from '../user-ad-card/user-ad-card.component';
import {NzTabComponent, NzTabSetComponent} from 'ng-zorro-antd/tabs';
import {NzResultComponent} from 'ng-zorro-antd/result';
import { UpperCasePipe } from '@angular/common';
import { NzSkeletonComponent, NzSkeletonElementDirective } from 'ng-zorro-antd/skeleton';
import { NzCardComponent } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-user-ads-page',
  imports: [
    UserAdCardComponent,
    NzTabSetComponent,
    NzTabComponent,
    NzResultComponent,
    UpperCasePipe,
    NzSkeletonComponent,
    NzCardComponent,
    NzSkeletonElementDirective
  ],
  templateUrl: './user-ads-page.component.html',
  styleUrl: './user-ads-page.component.scss'
})
export class UserAdsPageComponent implements OnInit {
  ads: any[] = [];
  tabs: any[] = [
    {
      key: "all",
      label: "Toate",
    },
    {
      key: "ACTIVE",
      label: "Active",
    },
    {
      key: "PENDING",
      label: "În așteptare",
    },
    {
      key: "INACTIVE",
      label: "Dezactivate",
    }
  ]
  filteredAds: any[] = [];
  selectedTab = this.tabs[0];
  isLoading = signal(true);

  constructor(private userService: UserService) {
  }

  ngOnInit() {
    this.userService.getUserAds().subscribe((res: any) => {
      this.ads = res;
      this.filterAds();
      this.isLoading.set(false);
    });
  }

  onTabChange($event: number) {
    this.isLoading.set(true)
    this.selectedTab = this.tabs[$event]
    this.filterAds();
  }

  filterAds(){
    switch(this.selectedTab.key) {
      case "all":
        this.filteredAds = this.ads.filter(ad => ad.status !== 'deleted');
        break;
      case "ACTIVE":
        this.filteredAds = this.ads.filter(ad => ad.status === 'approved');
        break;
      case "PENDING":
        this.filteredAds = this.ads.filter(ad => ad.status === 'pending');
        break;
      case "INACTIVE":
        this.filteredAds = this.ads.filter(ad => ad.status === 'archived' || ad.status === 'deleted' || ad.status === 'rejected');
        break;
      default:
        this.filteredAds = this.ads;
    }
    this.isLoading.set(false);
  }

  get noAdsMessage() {
    if (this.selectedTab.key === 'all') {
      return 'Nu aveți anunțuri.';
    } else if (this.selectedTab.key === 'ACTIVE') {
      return 'Nu aveți anunțuri active.';
    } else if (this.selectedTab.key === 'PENDING') {
      return 'Nu aveți anunțuri în așteptare.';
    } else if (this.selectedTab.key === 'INACTIVE') {
      return 'Nu aveți anunțuri inactive.';
    }
    return '';
  }
}
