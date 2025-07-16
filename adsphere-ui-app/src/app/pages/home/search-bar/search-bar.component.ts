import { Component, computed, OnInit, signal, ViewChild } from '@angular/core';






import {LocalityService} from '../../../services/locality.service';
import { debounceTime, distinctUntilChanged, finalize, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { FormsModule, NgModel } from '@angular/forms';

import {Locality} from '../../../models/locality.model.';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {NzFormControlComponent, NzFormItemComponent} from 'ng-zorro-antd/form';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzAutocompleteComponent,
  NzAutocompleteOptionComponent,
  NzAutocompleteTriggerDirective
} from 'ng-zorro-antd/auto-complete';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {Router} from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import isValidObjectId from '../../../utils/validate';

@Component({
  selector: 'app-search-bar',
  imports: [
    FormsModule,
    NzCardComponent,
    NzFormItemComponent,
    NzFormControlComponent,
    NzInputDirective,
    NzIconDirective,
    NzAutocompleteTriggerDirective,
    NzAutocompleteComponent,
    NzButtonComponent,
    NzTooltipDirective,
    NzAutocompleteOptionComponent,
    UpperCasePipe,
    NzSpinComponent
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit {
  searchInput = signal('');
  selectedLocalityLabel = signal<string | null>(null);
  selectedLocalityValue = signal<Locality | undefined>(undefined);
  suggestedLocalities = signal<Locality[]>([]);
  isLocalitiesLoading = signal(false);
  userLocated = signal(false);
  @ViewChild('localityInput') localityInput!: NgModel;
  private localityInput$ = new Subject<string>();

  constructor(
    private readonly router: Router,
    private readonly notificationService: NzNotificationService,
    private readonly localityService: LocalityService,
  ) {
  }

  ngOnInit(): void {
    this.localityInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isLocalitiesLoading.set(true)),
      switchMap(value =>
        this.localityService.getAutocomplete(value).pipe(
          finalize(() => this.isLocalitiesLoading.set(false))
        )
      )
    ).subscribe(localities => {
      this.suggestedLocalities.set(localities);
    });
  }

  handleSubmitSearch() {
      const searchValue = this.searchInput().trim();
      if(searchValue === '') return;
      const queryParams: {
        q: string;
        loc?: string;
      } = { q: searchValue }
    if(this.selectedLocalityValue()) {
      queryParams['loc'] = this.selectedLocalityValue()?._id
    }
      this.router.navigate(['/search'], {
        queryParams: queryParams
      }).then(() => {
        this.searchInput.set('');
      })
  }

  onLocalityChange($event: Event) {
    const inputElement = $event.target as HTMLInputElement;
    this.localityInput$.next(inputElement.value.trim());
  }

  handleLocateMe() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          this.localityService.getNearbyLocalities(latitude, longitude).subscribe({
            next: (localities) => {
              if (localities && localities.length > 0) {
                this.suggestedLocalities.set(localities);
                this.selectedLocalityLabel.set(`${localities[0].county.toUpperCase()} | ${localities[0].name}`);
                this.selectedLocalityValue.set(localities[0]);
                this.notificationService.success("Locație găsită", `Am găsit localitățile din jurul tău.`);
                this.userLocated.set(true);
              } else {
                this.notificationService.warning("Locația nu a fost găsită", "Nu am putut găsi o localitate în apropierea ta. Te rugăm să încerci din nou.");
                this.userLocated.set(false);
              }
            },
            error: (error) => {
             this.notificationService.error("Eroare la obținerea locației", "Nu am putut obține localitatea ta.");
              this.userLocated.set(false);
            }
          });
        },
        error => {
          this.notificationService.warning("Eroare la obținerea locației", "Nu am putut obține locația ta. Te rugăm să verifici permisiunile browserului.");
          this.userLocated.set(false);
        }
      );
    } else {
      this.notificationService.error("Geolocația nu este suportată", "Browserul tău nu suportă geolocația. Te rugăm să introduci manual localitatea.");
    }
  }

  onLocalitySelect($event: Event) {
    const inputElement = $event.target as HTMLInputElement;
    const value = inputElement.value;

    let county = '';
    let name = '';

    if (value.includes(' | ')) {
      [county, name] = value.split(' | ');

      if (county && name) {
        county = county[0]?.toUpperCase() + county.slice(1).toLowerCase();
      } else {
        county = '';
        name = '';
      }
    }

    if (county && name) {
      const selectedLocality = this.suggestedLocalities().find(
        locality => locality.name === name && locality.county === county
      );
      this.selectedLocalityValue.set(selectedLocality);
    } else {
      this.selectedLocalityValue.set(undefined);
    }
  }


  onLocalityBlur($event: Event) {
    const inputElement = $event.target as HTMLInputElement;
    const value = inputElement.value;
    const split = value.split(' | ');
    const county = `${split[0][0]?.toUpperCase()}${split[0].slice(1).toLowerCase()}`;
    const name = split[1]
    const isMatch = this.suggestedLocalities().some(locality => locality.name === name && locality.county === county);
    console.log(this.suggestedLocalities());
    console.log(`len=${value.length}, isMatch=${isMatch}, county=${county}, name=${name}`);
    if(value.length > 0 && isMatch) {
      this.localityInput.control.setErrors(null);
    } else {
      if(value.length === 0) {
        this.localityInput.control.setErrors(null);
      } else {
        this.localityInput.control.setErrors({localityNotFound: true});
      }

    }
  }

  canSubmitSearch = computed(() => {
    const searchValue = this.searchInput().trim();
    const selectedLocality = this.selectedLocalityValue();
    const isMatch = selectedLocality
      ? this.suggestedLocalities().some(
        locality =>
          locality.name === selectedLocality.name &&
          locality.county === selectedLocality.county
      )
      : true;

    return searchValue.length > 0 && isMatch;
  });
}
