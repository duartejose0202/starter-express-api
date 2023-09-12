import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { MealDocument } from './meal.document';
import { Injectable } from '@nestjs/common';
import { IngredientAssignmentDocument } from "./ingredients/ingredient-assignment.document";

@Injectable()
export class NutritionService extends FirestoreBaseService {
  async getMeals(appId: string): Promise<MealDocument[]> {
    const result = await this.getCollection(
      appId,
      MealDocument.collectionName,
    ).get();

    return result.docs.map((doc) => doc.to(MealDocument));
  }
  async createMeal(appId: string, meal: MealDocument): Promise<MealDocument> {
    const result = await this.getCollection(
      appId,
      MealDocument.collectionName,
    ).add(meal);

    meal.id = result.id;
    return meal;
  }

  async updateMeal(
    appId: string,
    mealId: string,
    meal: MealDocument,
  ): Promise<MealDocument> {
    if (meal.id !== mealId) {
      throw new Error('Meal ID does not match');
    }

    await this.getCollection(appId, MealDocument.collectionName)
      .doc(mealId)
      .set(meal, { merge: true });

    return meal;
  }

  async deleteMeal(
    appId: string,
    mealId: string,
  ): Promise<void> {
    await this.getCollection(appId, MealDocument.collectionName)
      .doc(mealId)
      .delete();
  }

  async addIngredient(
    appId: string,
    mealId: string,
    ingredient: IngredientAssignmentDocument
  ): Promise<IngredientAssignmentDocument> {
    const result = await this.getCollection(
      appId,
      MealDocument.collectionName,
    ).doc(mealId).collection(IngredientAssignmentDocument.collectionName).add(ingredient);

    ingredient.id = result.id;
    ingredient.path = result.path;
    return ingredient;
  }
}
