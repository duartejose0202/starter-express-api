import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from '../../../firestore/firestore-base.service';
import { LoggedMealDocument } from './logged-meal.document';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { MealItemDocument } from './meal-item.document';
import { ChunkArray } from '../../../../helpers/array.helper';
import { plainToInstance } from "class-transformer";

@Injectable()
export class LoggedMealsService extends FirestoreBaseService {
  async getLoggedMeals(
    appId: string,
    userId: string,
    date: Timestamp,
  ): Promise<LoggedMealDocument[]> {
    const result = await this.getUserCollection<LoggedMealDocument>(
      appId,
      userId,
      LoggedMealDocument.collectionName,
    )
      .where('date', '==', date)
      .get();

    return result.docs.map((doc) => doc.to(LoggedMealDocument));
  }

  async logMeal(
    appId: string,
    userId: string,
    meal: LoggedMealDocument,
  ): Promise<void> {
    await this.getUserCollection<LoggedMealDocument>(
      appId,
      userId,
      LoggedMealDocument.collectionName,
    ).add(Object.assign({}, meal));
  }

  async getMealItems(
    appId: string,
    userId: string,
    ids: string[],
  ): Promise<MealItemDocument[]> {
    const chunks = ChunkArray(ids, 10);

    const promises = chunks.map<Promise<MealItemDocument[]>>(async (chunk) => {
      const result = await this.getUserCollection<MealItemDocument>(
        appId,
        userId,
        MealItemDocument.collectionName,
      )
        .where(firestore.FieldPath.documentId(), 'in', chunk)
        .get();

      return result.docs.map((doc) => doc.to(MealItemDocument));
    });

    const results = await Promise.all(promises);
    return results.reduce((acc, val) => acc.concat(val), []);
  }

  async logMealItem(
    appId: string,
    userId: string,
    mealItem: MealItemDocument,
  ): Promise<any> {
    const result = await this.getUserCollection<MealItemDocument>(
      appId,
      userId,
      MealItemDocument.collectionName,
    ).add(Object.assign({}, mealItem));

    return { id: result.id };
  }
}
