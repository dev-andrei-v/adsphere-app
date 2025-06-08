import {Routes} from '@angular/router';
import {HomePageComponent} from './pages/home/home-page/home-page.component';
import {PostAdPageComponent} from './pages/ad/post-ad-page/post-ad-page.component';
import {CategoryPageComponent} from './pages/category/category-page/category-page.component';
import {AdDetailsPageComponent} from './pages/ad/ad-details/ad-details-page.component';
import {NotFoundPageComponent} from './pages/error/not-found-page/not-found-page.component';
import { authGuard } from './guards/auth.guard';
import {UserProfilePageComponent} from './pages/user/user-profile-page/user-profile-page.component';
import {AuthWrapperComponent} from './pages/auth/auth-wrapper/auth-wrapper.component';
import {UserAdsPageComponent} from './pages/user/user-ads-page/user-ads-page.component';
import {UserFavoritesPageComponent} from './pages/user/user-favorites-page/user-favorites-page.component';
import {SearchResultsPageComponent} from './pages/search/search-results-page/search-results-page.component';
import { ConversationsPageComponent } from './pages/chat/conversations-page/conversations-page.component';


export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  },
  {
    path: 'auth',
    component: AuthWrapperComponent,
  },
  {
    path: 'category/:slug',
    component: CategoryPageComponent,
  },
  {
    path: 'ad',
    children: [
      {
        path: 'post',
        component: PostAdPageComponent,
        canActivate: [authGuard]
      },
      {
        path: 'edit/:id',
        component: PostAdPageComponent,
        canActivate: [authGuard]
      },
      {
        path: ':slug',
        component: AdDetailsPageComponent
      },
    ]
  },
  {
    path: 'user',
    canActivate: [authGuard],
    children: [
      {
        path: 'profile',
        component: UserProfilePageComponent,
      },
      {
        path: 'ads',
        component: UserAdsPageComponent,
      },
      {
        path: 'conversations',
        component: ConversationsPageComponent,
      },
      {
        path: 'favorites',
        component: UserFavoritesPageComponent,
      }
    ]
  },
  {
    path: 'search',
    component: SearchResultsPageComponent,
  },
  {
    path: '**',
    component: NotFoundPageComponent
  }
];
