//  Helper Utilities
//  util.helper.ts
//  Created by Muhammad Asad on 14th Feb, 2023.
//  Copyright Gameplan Apps 2023. All rights reserved.

import { compare, bcrypt, genSalt, hash } from 'bcrypt-nodejs';
import * as gpc from 'generate-pincode';
import { createCipheriv, createDecipheriv } from 'crypto';
import AppConfig from '../configs/app.config';
import { v4 as uuid } from 'uuid';

export async function HashPassword(plainText: string): Promise<any> {
  return new Promise(function (resolve, reject) {
    genSalt(10, function (error, salt) {
      if (error) {
        reject(error);
      } else {
        hash(plainText, salt, null, function (error, hash) {
          if (error) {
            reject(error);
          } else {
            resolve(hash);
          }
        });
      }
    });
  });
}

export async function ComparePassword(plainText, hash): Promise<any> {
  return new Promise(function (resolve, reject) {
    compare(plainText, hash, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

export interface PaginationRequestParams {
  Limit: number;
  Page?: number;
  Before?: number;
  After?: number;
}

export interface PaginationDBParams {
  Limit: number;
  Offset: number | string; // Offset as string would be Id for mongo before/after pagination
}

export interface OrderByRequestParams {
  Column: string;
  Direction: 'ASC' | 'DESC';
}

export function SplitName(name) {
  const FullName = name.split(' ');
  const LastName = FullName.length > 1 ? FullName.pop() : null;
  const FirstName = FullName.join(' ');
  return { FirstName, LastName };
}

export function GetEnumKeyByEnumValue(myEnum, enumValue) {
  const keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
  return keys.length > 0 ? keys[0] : null;
}

export async function traverseObjectWithSearchKey(
  objOrArray: object | Array<object>,
  searchKeys: Array<string>,
  modifier: (val: object | Array<object> | string | number) => object,
) {
  if (!objOrArray) {
    return;
  }
  if (Array.isArray(objOrArray)) {
    for (const val of objOrArray) {
      await this.traverseObjectWithSearchKey(val, searchKeys, modifier);
    }
  } else if (typeof objOrArray === 'object') {
    const objectKeys = Object.keys(objOrArray);
    for (const key of objectKeys) {
      if (searchKeys.includes(key)) {
        objOrArray[key] = await modifier(objOrArray[key]);
      }
      await this.traverseObjectWithSearchKey(
        objOrArray[key],
        searchKeys,
        modifier,
      );
    }
  }
}

export function SortObjectByKeys(data: any) {
  const orignalKeys = Object.keys(data);
  const sortedKeys = orignalKeys.sort();
  const obj = {};
  sortedKeys.forEach((key) => {
    obj[key] = data[key];
  });
  return obj;
}

export function IsAndroid(userAgent: string) {
  let result = false;
  const androidRegex = new RegExp(/android/i);
  if (androidRegex.test(userAgent)) {
    result = true;
  }
  return result;
}

export function ConvertVersionStringToFloatNumber(versionString) {
  return parseFloat(
    versionString.split('.')[0] +
    '.' +
    versionString.split('.').slice(1).join(''),
  );
}

export function ReplaceObjectValuesInString(text: string, obj = {}): string {
  for (const field in obj) {
    text = text.replace(new RegExp(`{{${field}}}`, 'g'), obj[field]);
  }
  return text;
}

export function GenerateVerificationCode(): string {
  return AppConfig.APP.DEBUG ? '0000' : gpc(4);
}

export function VerifyUniquePrimitiveArrayItems(array, length) {
  return new Set(array).size === length;
}

export function GenerateEnumDescriptionForSwagger(obj: object): string {
  return Object.keys(obj)
    .map((key) => `${key} = ${obj[key]}`)
    .join(', ');
}

export function StringToBoolean(value: string) {
  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true' ? true : false;
  }
  return value;
}

export function ConvertToTwoDecimalPlaces(number: number) {
  return Math.round(number * 100) / 100;
}

export function TruncateString(value: string, limit = 20) {
  return value.slice(0, limit) + '...';
}

export function GenerateUUID(): string {
  return uuid();
}

type GetPaginationOptionsArgs = {
  page?: number;
  limit?: number;
};

export function GetPaginationOptions(options: GetPaginationOptionsArgs) {
  const databaseOptions = {
    skip: 0,
    take: 10,
  };

  if (options.limit) {
    databaseOptions.take = options.limit;
  }

  if (options.page) {
    databaseOptions.skip = databaseOptions.take * Math.max(options.page - 1, 0);
  }

  return databaseOptions;
}

export function ExcludeFields<T, Key extends keyof T>(
  model: T,
  keys: Key[],
): Omit<T, Key> {
  for (const k of keys) delete model[k];

  return model;
}

export const encryptData = (plainText: string) => {
  if (!AppConfig.CRYPTO.SECRET_KEY) {
    throw new Error('Secret key is not defined');
  }
  const secretKey = Buffer.from(AppConfig.CRYPTO.SECRET_KEY, 'hex'); // 32 bytes = 256 bits
  const initializationVector = Buffer.from(
    AppConfig.CRYPTO.INITIAL_VECTOR,
    'hex',
  ); // 16 bytes = 128 bits
  const cipher = createCipheriv(
    AppConfig.CRYPTO.METHOD,
    secretKey,
    initializationVector,
  );
  let encryptedData = cipher.update(plainText, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
};

export const decryptData = (encryptedData: string) => {
  if (!AppConfig.CRYPTO.SECRET_KEY) {
    return encryptedData;
  }
  const secretKey = Buffer.from(AppConfig.CRYPTO.SECRET_KEY, 'hex'); // 32 bytes = 256 bits
  const initializationVector = Buffer.from(
    AppConfig.CRYPTO.INITIAL_VECTOR,
    'hex',
  ); // 16 bytes = 128 bits
  const decipher = createDecipheriv(
    AppConfig.CRYPTO.METHOD,
    secretKey,
    initializationVector,
  );
  let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');
  return decryptedData;
};

export const getPriceIdByPlan = (
  payment_plan: string,
  payment_period: string,
) => {
  if (payment_plan === 'Basic') {
    return payment_period === 'Annual'
      ? process.env.STRIPE_PLAN_BASIC_ANNUAL
      : process.env.STRIPE_PLAN_BASIC_MONTHLY;
  } else if (payment_plan === 'Business') {
    return payment_period === 'Annual'
      ? process.env.STRIPE_PLAN_BUSINESS_ANNUAL
      : process.env.STRIPE_PLAN_BUSINESS_MONTHLY;
  } else if (payment_plan === 'Professional') {
    return payment_period === 'Annual'
      ? process.env.STRIPE_PLAN_PROFESSIONAL_ANNUAL
      : process.env.STRIPE_PLAN_PROFESSIONAL_MONTHLY;
  }
  return '';
};

export const getOfferPriceIdByPlan = (
  payment_plan: string,
  payment_period: string,
) => {
  if (payment_plan === 'Basic') {
    return payment_period === 'Annual'
      ? process.env.STRIPE_PLAN_BASIC_ANNUAL_OFFER
      : process.env.STRIPE_PLAN_BASIC_MONTHLY_OFFER;
  } else if (payment_plan === 'Business') {
    return payment_period === 'Annual'
      ? process.env.STRIPE_PLAN_BUSINESS_ANNUAL_OFFER
      : process.env.STRIPE_PLAN_BUSINESS_MONTHLY_OFFER;
  } else if (payment_plan === 'Professional') {
    return payment_period === 'Annual'
      ? process.env.STRIPE_PLAN_PROFESSIONAL_ANNUAL_OFFER
      : process.env.STRIPE_PLAN_PROFESSIONAL_MONTHLY_OFFER;
  }
  return '';
};

export const Timezone = 'America/Los_Angeles';
export const genKey = (data: string, keyLength = 10): Promise<any> => {
  return new Promise(function (resolve, reject) {
    genSalt(5, (err, salt) => {
      if (err) {
        reject(err);
      }
      hash(data, salt, null, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash.replace(/[^\w\s]/gi, '').slice(-keyLength));
      });
    });
  });
};

export const splitName = (name: string) => {
  if (!name) {
    return { first_name: '', last_name: '' };
  }
  const nameArray = name.split(' ');
  return { first_name: nameArray[0], last_name: nameArray.length > 1 ? nameArray[1] : '' };
}
