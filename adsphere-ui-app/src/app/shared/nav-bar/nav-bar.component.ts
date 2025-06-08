import {Component, OnInit, signal} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {AuthService} from '../../services/auth.service';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzHeaderComponent} from 'ng-zorro-antd/layout';
import {NzMenuDirective, NzMenuDividerDirective, NzMenuItemComponent} from 'ng-zorro-antd/menu';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzDropDownADirective, NzDropDownDirective, NzDropdownMenuComponent} from 'ng-zorro-antd/dropdown';
import {AuthStore} from '../../stores/auth.store';
import {NzAvatarComponent} from 'ng-zorro-antd/avatar';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  imports: [
    RouterLink,
    NzHeaderComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzButtonComponent,
    NzIconDirective,
    NzDropDownADirective,
    NzDropDownDirective,
    NzDropdownMenuComponent,
    NzMenuDividerDirective,
    NzAvatarComponent,
  ],
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnInit {

  constructor(public authStore: AuthStore) {
  }

  ngOnInit(): void {
    // this.authStore.loadUser()
  }

  get user() {
    return this.authStore.user()
  }

  logout() {
    this.authStore.logout()
  }
}
