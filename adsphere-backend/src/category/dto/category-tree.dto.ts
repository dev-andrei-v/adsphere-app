import { Expose, Type } from "class-transformer";

export class CategoryTreeDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  icon?: string;

  @Expose()
  img?: string;

  @Expose()
  color?: string;

  @Expose()
  @Type(() => CategoryTreeDto) // recursive
  subcategories?: CategoryTreeDto[];
}
