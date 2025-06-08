import { Component, OnInit, signal } from '@angular/core';
import { Category, CategoryAttribute, CategoryAttributeType, CategoryTreeItem } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime, firstValueFrom, map, Observable, of, startWith, Subscription, switchMap } from 'rxjs';
import { AsyncPipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { LocalityService } from '../../../services/locality.service';
import { Locality } from '../../../models/locality.model.';
import { AdPostRequest, AdPriceTypeEnum } from '../../../models/ad.model';
import { AdService } from '../../../services/ad.service';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzFormControlComponent, NzFormItemComponent, NzFormLabelComponent } from 'ng-zorro-antd/form';
import { NzInputDirective, NzInputGroupComponent, NzInputGroupWhitSuffixOrPrefixDirective } from 'ng-zorro-antd/input';
import {
  NzAutocompleteComponent,
  NzAutocompleteOptgroupComponent, NzAutocompleteOptionComponent,
  NzAutocompleteTriggerDirective
} from 'ng-zorro-antd/auto-complete';
import { NzColDirective } from 'ng-zorro-antd/grid';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { NzRadioComponent, NzRadioGroupComponent } from 'ng-zorro-antd/radio';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { NzStepComponent, NzStepsComponent } from 'ng-zorro-antd/steps';
import { AdSentMessageComponent } from './ad-sent-message/ad-sent-message.component';
import { NzUploadComponent, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { NzSpinComponent } from 'ng-zorro-antd/spin';

const getBase64 = (file: File): Promise<string | ArrayBuffer | null> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

@Component({
  selector: 'app-post-ad-page',
  imports: [
    NzModalModule,
    ReactiveFormsModule,
    NgForOf,
    NzCardComponent,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzInputDirective,
    NzAutocompleteTriggerDirective,
    NzAutocompleteComponent,
    NzAutocompleteOptgroupComponent,
    NzAutocompleteOptionComponent,
    NzColDirective,
    NzSelectComponent,
    NzOptionComponent,
    NzRadioComponent,
    NzButtonComponent,
    NzIconDirective,
    NgSwitch,
    NgSwitchCase,
    NzStepsComponent,
    NzStepComponent,
    NgIf,
    NzRadioGroupComponent,
    AdSentMessageComponent,
    NzUploadComponent,
    NzTooltipDirective,
    NzInputGroupComponent,
    NgClass,
    NzInputGroupWhitSuffixOrPrefixDirective,
    NzSpinComponent,
  ],
  templateUrl: './post-ad-page.component.html',
  styleUrl: './post-ad-page.component.scss'
})
export class PostAdPageComponent implements OnInit {
  isSentToPosting = signal(false);
  isSentToUpdating = signal(false);
  isLoading = signal(true);
  isPosting = signal(false);
  isEnhancingTitle = signal(false);
  isEnhancingDescription = signal(false);

  imageFileList: NzUploadFile[] = []
  previewImage: string | undefined = '';
  previewVisible: boolean = false;
  currentStep: number = 0;
  adForm!: FormGroup;
  countyControl = new FormControl('', Validators.required);
  counties: string[] = [];
  categories: CategoryTreeItem[] = [];
  localities: Locality[] = [];

  adPriceTypes = [
    {key: AdPriceTypeEnum.FIXED, label: 'Preț fix', description: 'Prețul nu se va negocia.'},
    {
      key: AdPriceTypeEnum.NEGOTIABLE,
      label: 'Negociabil',
      description: 'Dacă prețul este negociabil, se va menționa acest lucru pe pagina anunțului.'
    },
    {
      key: AdPriceTypeEnum.AUCTION,
      label: 'Licitație',
      description: 'În cazul unei licitații, prețul introdus este prețul minim.'
    },
    {key: AdPriceTypeEnum.FREE, label: 'Gratuit', description: ''},
    {key: AdPriceTypeEnum.EXCHANGE, label: 'Schimb', description: ''},
  ]

  attributesForCategory: CategoryAttribute[] | undefined = [];
  protected readonly CategoryAttributeType = CategoryAttributeType;

  mode: 'post' | 'edit' = 'post';
  editAdId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private adService: AdService,
    private categoryService: CategoryService,
    private locationService: LocalityService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.adForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(100)]],
      category: [null, Validators.required],
      description: ['', [Validators.required, Validators.minLength(100), Validators.maxLength(2000)]],
      price: [null, [Validators.required, Validators.min(1)]],
      currency: 'RON',
      transactionType: [AdPriceTypeEnum.FIXED, Validators.required],
      locality: [{value: '', disabled: true}, Validators.required],
      attributes: this.fb.group({}),
    });
    const url = this.router.url;
    if (url.includes('/ad/edit')) {
      this.mode = 'edit';
      this.editAdId = this.route.snapshot.paramMap.get('id');

      Promise.all([
        firstValueFrom(this.categoryService.getCategoryTree()).then(categories => {
          this.categories = categories ?? [];
        }),
        firstValueFrom(this.locationService.getCounties()).then(counties => {
          this.counties = counties ?? [];
        })
      ]).then(r => {
        this.fetchAdData();

        this.adForm.get('transactionType')?.valueChanges.subscribe(value => {
          const priceControl = this.adForm.get('price');
          const currencyControl = this.adForm.get('currency');
          if (value === AdPriceTypeEnum.FREE || value === AdPriceTypeEnum.EXCHANGE) {
            priceControl?.setValue(null);
            priceControl?.setValidators(null);
            priceControl?.disable();
            currencyControl?.setValue(null);
            currencyControl?.disable();

          } else {
            priceControl?.enable();
            priceControl?.setValidators([Validators.required, Validators.min(0)]);
            currencyControl?.enable();
            currencyControl?.setValue('RON');
          }
        });
        this.countyControl.valueChanges.subscribe(value => {
          if (value == null || value === '') {
            this.adForm.get('locality')?.setValue(null);
          }
        })

        this.isLoading.set(false);
      })

    } else if (url === '/ad/post') {
      this.mode = 'post';
      this.categoryService.getCategoryTree().subscribe(categories => {
        this.categories = categories;
      });

      this.locationService.getCounties().subscribe(counties => {
        this.counties = counties;
      });

      this.adForm.get('transactionType')?.valueChanges.subscribe(value => {
        const priceControl = this.adForm.get('price');
        const currencyControl = this.adForm.get('currency');
        if (value === AdPriceTypeEnum.FREE || value === AdPriceTypeEnum.EXCHANGE) {
          priceControl?.setValue(null);
          priceControl?.setValidators(null);
          priceControl?.disable();
          currencyControl?.setValue(null);
          currencyControl?.disable();

        } else {
          priceControl?.enable();
          priceControl?.setValidators([Validators.required, Validators.min(0)]);
          currencyControl?.enable();
          currencyControl?.setValue('RON');
        }
      });
      this.countyControl.valueChanges.subscribe(value => {
        if (value == null || value === '') {
          this.adForm.get('locality')?.setValue(null);
        }
      })
    }
  }

  private fetchAdData() {
    if (this.editAdId != null) {
      this.adService.getAdView(this.editAdId).subscribe({
        next: (ad) => {
          this.resetPageData();
          const foundCategory = this.findCategoryById(this.categories, ad.categoryId);
          console.log("Found category", foundCategory);
          this.adForm.patchValue({
            title: ad.title,
            category: foundCategory,
            description: ad.description,
            price: ad.price,
            currency: ad.currency,
            transactionType: ad.priceType,
            locality: ad.locality,
            attributes: ad.attributes || {},
          });
          this.onCategorySelect({nzValue: foundCategory}, ad.attributes);
          this.countyControl.setValue(ad.locality.county);
          this.onCountySelect({nzValue: ad.locality.county}, ad.locality.name);

          this.editAdId = ad._id;
        }
      });
    }
  }


  onCategoryBlur() {
    if (typeof this.adForm.get('category')?.value === 'string') {
      this.adForm.get('category')?.setValue(null);
    }
  }

  onCountySelect($event: any, selectedLocality?: string): void {
    const county = $event.nzValue
    if (!county || !this.counties.includes(county)) {
      this.adForm.get('locality')?.disable();
      this.adForm.get('locality')?.setValue('');
      return;
    }

    this.locationService.getLocalitiesByCounty(county).subscribe(localities => {
      if(selectedLocality) {
        this.adForm.get('locality')?.enable();
        this.adForm.get('locality')?.setValue(selectedLocality);
      } else {
        this.adForm.get('locality')?.enable();
        this.adForm.get('locality')?.setValue('');
      }
      this.localities = localities;
    });
  }

  onSubmit() {
    this.isPosting.set(true);
    const adData: AdPostRequest = {
      title: this.adForm.value.title,
      categoryId: this.adForm.value.category.id,
      description: this.adForm.value.description,
      price: this.adForm.value.price,
      priceType: this.adForm.value.transactionType,
      currency: this.adForm.value.currency,
      localityId: this.adForm.value.locality._id,
      attributes: this.adForm.value.attributes,
    }
    console.log("ATTRIBUTES ", this.adForm.value.attributes);

    const attributes = this.adForm.value.attributes;

    //Send only attributes that are not empty
    if (attributes && Object.keys(attributes).length > 0) {
      adData.attributes = Object.entries(attributes)
        .filter(([key, value]) => value !== null && value !== '')
        .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});
    } else {
      adData.attributes = {};
    }

    this.adService.publishAd(adData).subscribe((response) => {
      console.log("Ad published successfully", response);
      const publishedAdId = response.id
      this.uploadImages(publishedAdId);

      this.isPosting.set(false);
      this.isSentToPosting.set(true)
      this.editAdId = response._id;
    });
  }

  private resetPageData() {
    this.adForm.reset();
    this.imageFileList = [];
    this.previewImage = '';
    this.previewVisible = false;
    this.currentStep = 0;
    this.isSentToPosting.set(false);
    this.isPosting.set(false);
  }

  private uploadImages(adId: string) {
    console.log("Uploading images for ad with ID:", adId);
    this.imageFileList.forEach(file => {
      this.adService.uploadImage(adId, file.originFileObj).subscribe({
        next: (response) => {
          console.log("Image uploaded successfully", response);
        },
        error: (error) => {
          console.error("Error uploading image", error);
        }
      })
    })
  }

  onCategorySelect($event: any, attrValues?: { [key: string]: any }) {
    const selectedCategory = $event.nzValue
    this.adForm.get('category')?.setValue(selectedCategory);
    this.categoryService.getCategoryBySlug(selectedCategory.slug)
      .subscribe(category => {
        this.attributesForCategory = category.attributes
        if (category.attributes && category.attributes.length > 0) {
          this.addDynamicAttributes(category.attributes, attrValues);
        }
      })
  }

  compareCategory = (o1: CategoryTreeItem | string, o2: CategoryTreeItem): boolean => {
    if (o1) {
      if (typeof o1 === 'string') {
        return o1 === o2.name;
      } else {
        return o1.name === o2.name;
      }
    } else {
      return false;
    }
  }

  addDynamicAttributes(attributes: CategoryAttribute[], attrValues?: { [key: string]: any }) {
    if (this.adForm.contains('attributes')) {
      this.adForm.removeControl('attributes');
    }

    const dynamicGroup: { [key: string]: any } = {};

    attributes.forEach(attr => {
      const validators: ValidatorFn[] = [];

      if (attr.isRequired) {
        validators.push(Validators.required);
      }

      if (attr.type === CategoryAttributeType.TEXT && attr.validation?.regex) {
        validators.push(Validators.pattern(attr.validation.regex));
      }

      if (attr.type === CategoryAttributeType.NUMBER) {
        if (attr.validation?.minValue !== undefined) {
          validators.push(Validators.min(attr.validation.minValue));
        }
        if (attr.validation?.maxValue !== undefined) {
          validators.push(Validators.max(attr.validation.maxValue));
        }
      }

      dynamicGroup[attr.key] = this.fb.control(
        attrValues && attrValues[attr.key] !== undefined ? attrValues[attr.key] : '',
        validators
      );

    });

    this.adForm.addControl('attributes', this.fb.group(dynamicGroup));
  }

  get attributesFormGroup(): FormGroup {
    return this.adForm.get('attributes') as FormGroup;
  }

  prevStep() {
    this.currentStep = Math.max(0, this.currentStep - 1);
  }

  isStepValid(): boolean {
    if (this.currentStep === 0) {
      const priceControl = this.adForm.get('price');
      const currencyControl = this.adForm.get('currency');

      const isPriceValid = priceControl?.enabled ? priceControl.valid : true;
      const isCurrencyValid = currencyControl?.enabled ? currencyControl.valid : true;

      return (
        (this.adForm.get('title')?.valid ?? false) &&
        (this.adForm.get('category')?.valid ?? false) &&
        (this.adForm.get('description')?.valid ?? false) &&
        (this.adForm.get('transactionType')?.valid ?? false) &&
        isPriceValid &&
        isCurrencyValid
      );
    }

    if (this.currentStep === 1) {
      return this.attributesFormGroup?.valid ?? true;
    }

    if (this.currentStep === 2) {
      return this.adForm.get('locality')?.valid ?? false;
    }

    return false;
  }

  markCurrentStepControlsAsTouched() {
    const controlsToTouch = [];

    if (this.currentStep === 0) {
      controlsToTouch.push('title', 'category', 'description', 'transactionType', 'price', 'currency');
    } else if (this.currentStep === 1) {
      const attributesGroup = this.adForm.get('attributes') as FormGroup;
      if (attributesGroup) {
        Object.keys(attributesGroup.controls).forEach(key => {
          attributesGroup.get(key)?.markAsTouched();
        });
      }
    } else if (this.currentStep === 2) {
      controlsToTouch.push('locality');
    }

    controlsToTouch.forEach(name => {
      this.adForm.get(name)?.markAsTouched();
    });
  }


  nextStep() {
    if (!this.isStepValid()) {
      this.markCurrentStepControlsAsTouched();
      return;
    }
    this.currentStep = Math.max(0, this.currentStep + 1);
  }

  onLocalitySelect($event: NzAutocompleteOptionComponent) {
    const selectedLocality = $event.nzValue;
    this.adForm.get('locality')?.enable();
    this.adForm.get('locality')?.setValue(selectedLocality);
  }

  onLocalityBlur() {
    const locality = this.adForm.get('locality')?.value;
    console.log("LOCALITY: ", locality)
    if (typeof locality === 'string') {
      this.adForm.get('locality')?.setValue(null);
    }
  }

  compareLocality(o1: Locality, o2: Locality): boolean {
    if (o1) {
      return o1.name === o2.name;
    } else {
      return false;
    }
  }

  beforeUploadFile(file: NzUploadFile, fileList: NzUploadFile[]): boolean {
    console.log("file", file)
    return true
  }

  handleFile = (item: NzUploadXHRArgs): Subscription => {
    const file = item.file as any;

    // Dacă vrei doar să-l păstrezi în fileList (fără upload)
    //this.fileList = [...this.fileList, item.file];
    this.imageFileList = [...this.imageFileList, item.file];

    // Poți simula un upload "reușit":
    setTimeout(() => {
      item.onSuccess?.({}, item.file, event);
    }, 100);

    // Trebuie să returnezi un Subscription valid
    return new Subscription();
  };

  handlePreview = async (file: NzUploadFile): Promise<void> => {
    if (!file.url && !file['preview']) {
      file!['preview'] = await getBase64(file.originFileObj!);
    }
    this.previewImage = file.url || file['preview'];
    this.previewVisible = true;
  };

  get showPrice() {
    return this.adForm.get('transactionType')?.value !== AdPriceTypeEnum.FREE &&
      this.adForm.get('transactionType')?.value !== AdPriceTypeEnum.EXCHANGE;
  }

  enhanceTitleWithAI() {
    this.isEnhancingTitle.set(true);
    const title = this.adForm.get('title')?.value;
    const extraDescription = this.adForm.get('description')?.value;
    //Disable the title control to prevent user from changing it while AI is enhancing
    this.adForm.get('title')?.disable();
    this.adService.enhanceAdTitle(title, extraDescription).subscribe({
      next: (response) => {
        console.log("Enhanced title response", response);
        this.adForm.get('title')?.setValue(response.enhanced_title);
        this.isEnhancingTitle.set(false);
        this.adForm.get('title')?.enable();
      },
      error: (error) => {
        console.error("Error enhancing title", error);
        this.isEnhancingTitle.set(false);
        this.adForm.get('title')?.enable();
      }
    });
  }

  enhanceDescriptionWithAI() {
    this.isEnhancingDescription.set(true);
    const description = this.adForm.get('description')?.value;
    const extraTitle = this.adForm.get('title')?.value;
    //Disable the description control to prevent user from changing it while AI is enhancing
    this.adForm.get('description')?.disable();
    this.adService.enhanceAdDescription(description, extraTitle).subscribe({
      next: (response) => {
        console.log("Enhanced description response", response);
        this.adForm.get('description')?.setValue(response.enhanced_description);
        this.isEnhancingDescription.set(false);
        this.adForm.get('description')?.enable();
      },
      error: (error) => {
        console.error("Error enhancing description", error);
        this.isEnhancingDescription.set(false);
        this.adForm.get('description')?.enable();
      }
    });
  }

  get canEnhanceTitle() {
    const title = this.adForm.get('title')?.value;
    return title && title.length >= 20 && !this.isEnhancingTitle();
  }

  get canEnhanceDescription() {
    const description = this.adForm.get('description')?.value;
    return description && description.length >= 100 && !this.isEnhancingDescription();
  }

  onCountyBlur($event: any) {
    const value = $event.target.value;
    const suggestedContains = this.counties.filter(county => county.toLowerCase().includes(value.toLowerCase()));
    if (!suggestedContains) {
      this.countyControl.setValue('');
    }


  }

  get descriptionClassName(): string {
    const length = this.adForm.get('description')?.value?.trim().length || 0;

    if (length < 100) return 'text-red-600 font-bold';
    if (length < 500) return 'text-orange-500 font-bold';
    if (length <= 2000) return 'text-green-600 font-bold';
    return 'text-red-600 font-bold';
  }

  private findCategoryById(categories: CategoryTreeItem[], id: string): CategoryTreeItem | null {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.subcategories && category.subcategories.length > 0) {
        const found = this.findCategoryById(category.subcategories, id);
        if (found) return found;
      }
    }
    return null;
  }

  onEditSubmit() {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) {
      console.log("Edit ad ID is not set, cannot submit edit.");
      return;
    }
    const localityId = this.adForm.value.locality?._id || this.localities.find(l => l.name.toLowerCase() === this.adForm.value.locality.toLowerCase())?._id;
    this.isPosting.set(true);

    const adData: AdPostRequest = {
      title: this.adForm.value.title,
      categoryId: this.adForm.value.category.id,
      description: this.adForm.value.description,
      price: this.adForm.value.price,
      priceType: this.adForm.value.transactionType,
      currency: this.adForm.value.currency,
      localityId,
      attributes: this.adForm.value.attributes,
    }
    const attributes = this.adForm.value.attributes;

    //Send only attributes that are not empty
    if (attributes && Object.keys(attributes).length > 0) {
      adData.attributes = Object.entries(attributes)
        .filter(([key, value]) => value !== null && value !== '')
        .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});
    } else {
      adData.attributes = {};
    }

    this.adService.editAd(adData, id).subscribe((response) => {
      console.log("Ad published successfully", response);
      const publishedAdId = response._id
      this.uploadImages(publishedAdId);

      this.isPosting.set(false);
      this.isSentToUpdating.set(true);
    });

  }

  previewAd(){
    if(this.mode == 'edit') {
      console.log("Opening ad preview in new tab for edit mode with ID:", this.editAdId);
      const id = this.route.snapshot.paramMap.get('id')
      window.open(
        `/ad/${id}`,
        '_blank',
        'noopener,noreferrer'
      )
    }
  }
}
