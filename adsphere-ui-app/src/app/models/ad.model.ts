export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
}

export interface AdCardData {
  _id: string;
  slug: string;
  title: string;
  price: number;
  priceType: AdPriceTypeEnum;
  currency: string;
  locality: {
    id: string;
    name: string;
    county: string;
    latitude: number;
    longitude: number;
  },
  images: AdImage[];
  category: {
    id: string;
    name: string;
    slug: string;
  }
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}

export interface AdImage {
  url: string;
  publicId: string;
  isFeatured: boolean;
}

export interface Locality {
  _id: string;
  name: string;
  county: string;
  latitude: number;
  longitude: number;
}

export interface AdDetailsData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  priceType: string;
  images: AdImage[];
  categoryId: string;
  userId: string;
  status: string;
  attributes: Record<string, string>;
  locality: Locality;
  createdAt: string;
  updatedAt: string;
  viewsCounter: number;
}

export interface AdPostRequest {
  title: string;
  description: string;
  price: number;
  priceType: string;
  currency: string;
  localityId: string;
  categoryId: string;
  attributes: Record<string, string>;
}

export enum AdPriceTypeEnum {
  FIXED = 'fixed',
  NEGOTIABLE = 'negotiable',
  AUCTION = 'auction',
  FREE = 'free',
  EXCHANGE = 'exchange',
}
