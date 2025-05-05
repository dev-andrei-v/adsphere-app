import { Expose } from 'class-transformer';

export class FeaturedCategoryDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  image: {
    url: string;
    publicId: string;
  }

  @Expose()
  isEnabled: boolean;

  @Expose()
  isFeatured: boolean;
}
