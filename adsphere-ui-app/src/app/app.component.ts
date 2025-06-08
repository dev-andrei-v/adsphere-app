import { Component, OnDestroy, OnInit } from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {NavBarComponent} from './shared/nav-bar/nav-bar.component';
import {FooterComponent} from './shared/footer/footer.component';
import {NzLayoutComponent} from 'ng-zorro-antd/layout';
import { AuthStore } from './stores/auth.store';
import { UserService } from './services/user.service';



@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent, FooterComponent, NzLayoutComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'adsphere-app';
  showMainLayout: boolean = true;
  hideMainLayoutRoutes: string[] = [ '/auth' ]

  constructor(private router: Router,
              private userService: UserService,
              private authStore: AuthStore) {
    this.router.events.subscribe((event) => {
      if(event instanceof NavigationEnd) {
        this.showMainLayout = !this.hideMainLayoutRoutes.includes(event.url);
      }
    })
    this.authStore.loadUser()
    this.scheduleSeenPing()

  }

  ngOnInit() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private timeoutId: any = null;
  private destroyed = false;

  private updateLastSeen() {
    this.userService.sendSeenStatus().subscribe(status => {
    })
  }

  private scheduleSeenPing() {
    const run = () => {
      if (this.destroyed) return;

      if (document.visibilityState === 'visible') {
        this.updateLastSeen();
      }

      this.timeoutId = setTimeout(run, 30_000);
    };

    run(); // Send the first ping immediately
  }

  ngOnDestroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.destroyed = true;
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.updateLastSeen(); // trimite imediat ce revine în tab
    }
  };
}
