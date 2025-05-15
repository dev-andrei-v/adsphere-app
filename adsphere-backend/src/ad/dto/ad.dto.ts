export interface AdPreviewDto {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  slug: string;
  thumbnailUrl?: string;
  createdAt: Date;
}
