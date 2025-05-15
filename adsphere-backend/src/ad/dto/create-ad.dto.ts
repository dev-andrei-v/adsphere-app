import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsObject,
} from 'class-validator';
import { AdCurrencyEnum } from '../enums/ad-currency.enum';
import { AdTransactionType } from '../enums/ad-transaction.type';

export class CreateAdDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsEnum(AdCurrencyEnum)
  currency?: AdCurrencyEnum;

  @IsEnum(AdTransactionType)
  priceType: AdTransactionType;

  @IsMongoId({message: "categoryId must be valid"})
  categoryId: string;

  @IsMongoId({message: "localityId must be valid"})
  localityId: string;

  @IsObject()
  @IsNotEmpty()
  attributes: Record<string, string | number | boolean>;

}
