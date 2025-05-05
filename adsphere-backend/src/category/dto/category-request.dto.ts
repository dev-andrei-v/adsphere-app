import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeValidationDto {
  @IsOptional()
  @IsString()
  regex?: string;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;
}

export class AttributeTemplateDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsEnum(['text', 'number', 'select', 'boolean'])
  type: 'text' | 'number' | 'select' | 'boolean';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[]; // doar pt 'select'

  @IsOptional()
  @IsString()
  unit?: string; // doar pt 'number'

  @IsOptional()
  @ValidateNested()
  @Type(() => AttributeValidationDto)
  validation?: AttributeValidationDto;
}

export class CategoryRequestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  img?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  attributes?: AttributeTemplateDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AttributeValidationDto)
  validation?: AttributeValidationDto;
}
