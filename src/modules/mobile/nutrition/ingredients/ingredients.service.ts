import { FirestoreBaseService } from '../../../firestore/firestore-base.service';
import { IngredientDocument } from './ingredient.document';
import { IngredientAssignmentDocument } from './ingredient-assignment.document';
import { MealDocument } from '../meal.document';

export class IngredientsService extends FirestoreBaseService {
  async getIngredients(appId: string): Promise<IngredientDocument[]> {
    const response = await this.getCollection(
      appId,
      IngredientDocument.collectionName,
    ).get();

    return response.docs.map((doc) => doc.to(IngredientDocument));
  }

  async getIngredientsForMeal(
    appId: string,
    mealId: string,
  ): Promise<(IngredientDocument | IngredientAssignmentDocument)[]> {
    const response = await this.getCollection(
      appId,
      MealDocument.collectionName,
    )
      .doc(mealId)
      .collection(IngredientAssignmentDocument.collectionName)
      .get();

    return response.docs.map((doc) => {
      if (Object.keys(doc.data()).includes('imageUrl')) {
        return doc.to(IngredientDocument);
      }
      return doc.to(IngredientAssignmentDocument);
    });
  }
}
