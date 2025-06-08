export interface Category {
  id: string;
  name: string;
  slug: string;
  image: {
    url: string;
    publicId: string;
  }
  color?: string;
  attributes?: CategoryAttribute[];
}

export interface CategoryAttribute {
  key: string;
  label: string;
  type: string;
  options?: string[];
  validation?: {
    regex?: string;
    minValue?: number;
    maxValue?: number;
    unit?: string;
    errorMessage?: string;
  }
  isRequired: boolean;
}

export enum CategoryAttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
}

export interface CategoryTreeItem {
  id: string;
  name: string;
  slug: string;
  subcategories?: CategoryTreeItem[];
}
