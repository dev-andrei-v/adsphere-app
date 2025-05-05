import { Injectable } from '@nestjs/common';
import { Locality } from './schema/locality.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LocalityService {
  constructor( @InjectModel(Locality.name)
               private readonly localityModel: Model<Locality>,) {}

  getAutocomplete(query: string) {
    //query must have at least 3 characters
    if (query.length < 3) {
      return [];
    }

    const terms = query.split(' ').filter(Boolean); // split by space, remove empty

    return this.localityModel.find({
      $and: terms.map(term => ({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { county: { $regex: term, $options: 'i' } },
        ]
      }))
    })
      .sort({ name: 1 })
      .lean();
  }

  getCounties() {
    return this.localityModel.distinct('county').sort({county: 1});
  }

  getByCounty(county: string) {
    return this.localityModel.find({
      county: { $regex: county, $options: 'i' }, // case-insensitive
    }).sort({ name: 1 })
  }

  async getByNameAndCounty(name: string, county: string) {
    return this.localityModel.findOne({
      name: { $regex: name, $options: 'i' }, // case-insensitive
      county: { $regex: county, $options: 'i' }, // case-insensitive
    }).lean();
  }

  async getNearbyLocality(latitude: number, longitude: number) {
    return this.localityModel.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // ATENȚIE: [lng, lat]
          },
          $maxDistance: 10000 // în metri, de ex 10km, ajustează după nevoie!
        }
      }
    }).lean();
  }

  async getNearbyLocalities(latitude: number, longitude: number, maxDistance: number = 10000) {
    return this.localityModel.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance
        }
      }
    }).lean();
  }
}
