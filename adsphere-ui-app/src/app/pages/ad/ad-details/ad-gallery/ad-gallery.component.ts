import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {GalleryItem, ImageItem, GalleryComponent} from 'ng-gallery';
import {NzCardComponent} from 'ng-zorro-antd/card';
import {AdImage} from '../../../../models/ad.model';

@Component({
  selector: 'app-ad-gallery',
  imports: [
    GalleryComponent,
    NzCardComponent,
  ],
  templateUrl: './ad-gallery.component.html',
  styleUrl: './ad-gallery.component.scss'
})
export class AdGalleryComponent implements OnChanges {
  @Input({required: true}) adImages!: AdImage[] | undefined;
  images: GalleryItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['adImages'] && this.adImages != null && this.adImages.length > 0) {
      this.images = this.adImages?.map(image => {
        return new ImageItem({
          src: image.url,
          thumb: image.url,
        });
      })
    } else {
      this.images =
        [
          new ImageItem({
            src: 'no-image.jpg',
            thumb: 'no-image.jpg',
          })
        ];

    }
  }
}
