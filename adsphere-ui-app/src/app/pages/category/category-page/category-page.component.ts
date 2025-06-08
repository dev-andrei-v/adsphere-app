import {Component, computed, OnInit, signal} from '@angular/core';
import {CategoryService} from '../../../services/category.service';
import {Category} from '../../../models/category.model';
import {ActivatedRoute, Router} from '@angular/router';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  range,
  Subject, switchMap,
  tap
} from 'rxjs';
import {AdCardData} from '../../../models/ad.model';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {AdListComponent} from '../../../shared/ad-list/ad-list.component';
import {NzOptionComponent, NzOptionGroupComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import {NzResultComponent, NzResultExtraDirective} from 'ng-zorro-antd/result';
import {NzSkeletonComponent} from 'ng-zorro-antd/skeleton';
import {NzInputNumberComponent} from 'ng-zorro-antd/input-number';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzFormControlComponent} from 'ng-zorro-antd/form';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {
  NzAutocompleteComponent,
  NzAutocompleteOptionComponent,
  NzAutocompleteTriggerDirective
} from 'ng-zorro-antd/auto-complete';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { UpperCasePipe } from '@angular/common';
import { Locality } from '../../../models/locality.model.';
import { LocalityService } from '../../../services/locality.service';
import isValidObjectId from '../../../utils/validate';
import { NzAlertComponent } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-category-page',
  imports: [
    NzCardComponent,
    AdListComponent,
    NzSelectComponent,
    NzOptionComponent,
    FormsModule,
    NzResultComponent,
    NzSkeletonComponent,
    NzInputNumberComponent,
    NzOptionGroupComponent,
    NzButtonComponent,
    NzFormControlComponent,
    NzIconDirective,
    NzInputDirective,
    ReactiveFormsModule,
    NzResultExtraDirective,
    NzAutocompleteComponent,
    NzAutocompleteOptionComponent,
    NzAutocompleteTriggerDirective,
    NzSpinComponent,
    UpperCasePipe,
    NzAlertComponent
  ],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss'
})
export class CategoryPageComponent implements OnInit {
  readonly DEFAULT_PAGE_SIZE = 20;
  readonly TRANSACTION_TYPE = [
    { value: 'fixed', label: 'Preț fix' },
    { value: 'negotiable', label: 'Negociabil' },
    { value: 'auction', label: 'Licitație' },
    { value: 'free', label: 'Gratuit' },
    { value: 'exchange', label: 'Schimb' },
    { value: 'not_specified', label: 'Nespecificat' },
  ];
  parentCategory = signal<{
    id: string,
    name: string,
  }>({id: "", name: ""});
  subcategories = signal<Category[]>([]);
  ads = signal<AdCardData[]>([]);
  isLoading = signal<boolean>(true);
  pageData = signal({
    page: 1,
    total: 0,
    totalPages: 0,
    pageSize: this.DEFAULT_PAGE_SIZE});

  searchQuery = signal<string>('');

  attributesForSubcategory = signal<any[]>([]);

  selectedSubcategoryId = "ALL";

  areSubcategoryFiltersEnabled = signal<boolean>(false);

  showSubcategoryFilters = signal<boolean>(false);

  parentSlug: string | null = null;
  childrenSlug: string | null = null;
  filterForm: FormGroup;

  priceErrorMessage = signal<string>("")

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private readonly localityService: LocalityService,
  ) {
    this.filterForm = this.fb.group({
      query: [null],
      subcategoryId: ['ALL'],
      minPrice: [null],
      maxPrice: [null],
      currency: [null],
      accountType: [null],
      priceType: [null],
      sort: [null],
      localityId: [null],
    }, { validators: [this.priceCurrencyValidator()]})

    this.filterForm.get('subcategoryId')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        tap((value) => {
          this.selectedSubcategoryId = value;
          this.handleOnSubcategoryChange(this.selectedSubcategoryId);
          this.areSubcategoryFiltersEnabled.set(value !== 'ALL' && this.attributesForSubcategory().length > 0);
        })
      )
      .subscribe();

  }

  ngOnInit(): void {
    this.readRouteParams();
    this.loadInitialData();

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

  private readRouteParams() {
    this.parentSlug = this.route.snapshot.paramMap.get('slug');
    this.childrenSlug = this.route.snapshot.queryParamMap.get('subcategory');

    // Setează pagina dacă e transmisă în query params
    const pageIndex = this.route.snapshot.queryParamMap.get('page');
    if (pageIndex) {
      const page = parseInt(pageIndex, 10);
      if (!isNaN(page) && page > 0) {
        this.pageData.set({ ...this.pageData(), page });
      }
    }
  }


  private loadInitialData() {
    if (!this.parentSlug) return;
    this.isLoading.set(true);

    const searchSlug = this.childrenSlug != null ? this.childrenSlug : this.parentSlug;

    combineLatest([
      this.categoryService.getSubcategoriesByParentSlug(this.parentSlug),
      this.categoryService.getAdsByCategorySlug(
        searchSlug,
        this.pageData().page,
        this.pageData().pageSize
      )
    ]).pipe(
      map(([subCatResponse, adsResponse]) => {
        this.pageData.set({
          page: adsResponse.page,
          total: adsResponse.total,
          totalPages: adsResponse.totalPages,
          pageSize: adsResponse.pageSize
        });
        return {
          subcategories: subCatResponse.subcategories,
          parentCategory: subCatResponse.parent,
          ads: adsResponse.data
        }
      }),
      tap(({ subcategories, parentCategory, ads }) => {
        this.setSubcategories(subcategories);
        this.parentCategory.set(parentCategory);

        if (this.childrenSlug) {
          this.setSelectedSubcategoryBySlug(this.childrenSlug);
        }

        this.ads.set(ads);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe();
  }


  private setSubcategories(subcategories: any[]) {
    const mapped = subcategories.map((cat: any) => ({
      ...cat,
      id: cat._id,
    }));
    this.subcategories.set(mapped);
  }

  private setSelectedSubcategoryBySlug(slug: string) {
    const selected = this.subcategories().find(cat => cat.slug === slug);
    if (selected) {
      this.filterForm.get('subcategoryId')?.setValue(selected.id);
    }
  }


  protected readonly range = range;
  selectedLocalityLabel: any;

  handlePageIndexChange($event: number) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Set page to url route
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: $event },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    if(this.parentSlug == null) return;
    this.loadData($event, this.pageData().pageSize);
  }

  handlePageSizeChange($event: number) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadData(this.pageData().page, $event);
  }

  private loadData(page: number, pageSize: number) {
    this.isLoading.set(true);
    this.categoryService
      .getAdsByCategorySlug(this.parentSlug!!, page, pageSize, this.buildFilterPayload())
      .pipe(
        map(response => {
          this.pageData.set({
            page: response.page,
            total: response.total,
            totalPages: response.totalPages,
            pageSize: response.pageSize
          });
          return response.data;
        }),
        tap(ads => {
          this.ads.set(ads);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.patchValue({
      subcategoryId: 'ALL',
      minPrice: null,
      maxPrice: null,
      currency: null,
      accountType: null,
      sort: null,
      localityId: null
    });
    this.searchQuery.set('')
    // Load again with default filters
    this.isLoading.set(true);
    this.categoryService.getAdsByCategorySlug(this.parentSlug!!, this.pageData().page, this.pageData().pageSize)
      .pipe(
        map(response => {
          this.pageData.set({
            page: response.page,
            total: response.total,
            totalPages: response.totalPages,
            pageSize: response.pageSize
          });
          return response.data;
        }),
        tap(ads => {
          this.ads.set(ads);
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      )
      .subscribe();

  }

  handleOnSubcategoryChange(subcategoryId: string) {
    if(subcategoryId === 'ALL') {
      return;
    }
    // Load dynamic attributes
    const selectedSubcategory = this.subcategories().find(cat => cat.id === subcategoryId);
    // Update subcategory slug in the URL without reloading the page
    if(selectedSubcategory) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {subcategory: selectedSubcategory?.slug},
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    } else {
      // If no subcategory is found, reset the slug
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {subcategory: null},
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }

    if(selectedSubcategory == null) return;
    const attributesWithSelect = selectedSubcategory?.attributes?.filter(attr => attr.type === 'select');
    this.attributesForSubcategory.set([]);
    attributesWithSelect?.forEach(attr => {
      this.attributesForSubcategory().push({
          type: "select",
          key: attr.key,
          label: attr.label,
          options: attr.options || [],
          userValue: ''
      });
    })
  }

  handleSubmitFilters() {
    this.isLoading.set(true);
    //Reset page to 1
    const pageData = this.pageData()
    pageData.page = 1; // Reset to first page on filter submit
    this.pageData.set(pageData);

    this.categoryService.getAdsByCategorySlug(
      this.parentSlug!!,
      this.pageData().page,
      this.pageData().pageSize,
      this.buildFilterPayload()
    ).pipe(
      map(response => {
        this.pageData.set({
          page: response.page,
          total: response.total,
          totalPages: response.totalPages,
          pageSize: response.pageSize
        });
        return response.data;
      }),
      tap(ads => {
        this.ads.set(ads);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe();
  }

  private buildFilterPayload(): any {
    const filtersPayload = {
      ...this.filterForm.value,
      attributes: this.attributesForSubcategory().reduce((acc, attr) => {
        if (attr.userValue) {
          acc[attr.key] = attr.userValue;
        }
        return acc;
      }, {})
    };

    const searchQuery = this.searchQuery().trim();
    if(searchQuery != null) {
      filtersPayload.query = searchQuery;
    }
    if(filtersPayload.subcategoryId === 'ALL') {
      filtersPayload.subcategoryId = null; // Ensure we send null if ALL is selected
    }

    // Remove empty values
    for(const key in filtersPayload) {
      if(filtersPayload[key] === null || filtersPayload[key] === '') {
        delete filtersPayload[key];
      }
    }
    return filtersPayload;
  }

  suggestedLocalities = signal<Locality[]>([]);
  isLocalitiesLoading = signal(false);

  private localityInput$ = new Subject<string>();

  onLocalityChange($event: Event) {
    const inputElement = $event.target as HTMLInputElement;
    this.localityInput$.next(inputElement.value.trim());
  }

  onLocalitySelect($event: Event) {
    const inputElement = $event.target as HTMLInputElement;
    const value = inputElement.value;

    let [county, name] = value.split(' | ');

    county = county[0].toUpperCase() + county.slice(1).toLowerCase(); // Capitalize first letter of county
    const selectedLocality = this.suggestedLocalities().find(locality => locality.name === name && locality.county === county);
  }

  onLocalityBlur($event: Event) {
    const inputElement = $event.target as HTMLInputElement;

    const localityId = this.filterForm.get('localityId')?.value
    if(!isValidObjectId(localityId)) {
      inputElement.value = '';
      this.suggestedLocalities.set([])
    } else {
      this.filterForm.get('localityId')?.setErrors(null);
    }
  }

  priceCurrencyValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const minPrice = group.get('minPrice')?.value;
      const maxPrice = group.get('maxPrice')?.value;
      const currency = group.get('currency')?.value;

      // Verifică explicit dacă field-urile sunt completate (0 e valid)
      const isSet = (val: any) => val !== null && val !== undefined && val !== '';

      const anyFilled = isSet(minPrice) || isSet(maxPrice) || isSet(currency);
      const allFilled = isSet(minPrice) && isSet(maxPrice) && isSet(currency);

      if (anyFilled && !allFilled) {
        this.priceErrorMessage.set("Toate câmpurile de preț și monedă trebuie completate.");
        return { priceCurrencyRequired: true };
      }
      if (
        minPrice != null &&
        maxPrice != null &&
        !isNaN(minPrice) &&
        !isNaN(maxPrice) &&
        Number(minPrice) > Number(maxPrice)
      ) {
        this.priceErrorMessage.set('Prețul minim nu poate fi mai mare decât prețul maxim.');
        return { priceRangeInvalid: true };
      }
      return null;
    };
  }



}
