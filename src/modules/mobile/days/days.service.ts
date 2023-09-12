import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { ExerciseDayDocument } from './exercise_day.document';
import { ChunkArray } from '../../../helpers/array.helper';
import { firestore } from 'firebase-admin';
import { ExerciseAssignmentDocument } from '../exercise/exercise_assignment.document';
import { CollectionReference } from '@google-cloud/firestore';
import { MealDayDocument } from './meal_day.document';
import FieldPath = firestore.FieldPath;

@Injectable()
export class DaysService extends FirestoreBaseService {
  async getExerciseDays(appId: string): Promise<ExerciseDayDocument[]> {
    const result = await this.getCollection<ExerciseDayDocument>(
      appId,
      ExerciseDayDocument.collectionName,
    ).get();

    return result.docs.map((doc) => doc.to(ExerciseDayDocument));
  }

  async getMealDays(appId: string): Promise<MealDayDocument[]> {
    const result = await this.getCollection<MealDayDocument>(
      appId,
      MealDayDocument.collectionName,
    ).get();

    return result.docs.map((doc) => doc.to(MealDayDocument));
  }

  async getExerciseDaysForIds(
    appId: string,
    dayIds: string[],
  ): Promise<ExerciseDayDocument[]> {
    const idChunks = ChunkArray(dayIds, 10);

    const exerciseDays = [];
    for (const chunk of idChunks) {
      const result = await this.getCollection<ExerciseDayDocument>(
        appId,
        ExerciseDayDocument.collectionName,
      )
        .where(FieldPath.documentId(), 'in', chunk)
        .get();

      const days = result.docs.map((doc) => doc.to(ExerciseDayDocument));

      exerciseDays.push(...days);
    }

    return exerciseDays;
  }

  async addExerciseDay(
    appId: string,
    day: ExerciseDayDocument,
  ): Promise<ExerciseDayDocument> {
    const result = await this.getCollection<ExerciseDayDocument>(
      appId,
      ExerciseDayDocument.collectionName,
    ).add(day);

    day.id = result.id;
    return day;
  }

  async getExerciseAssignmentsForDay(
    appId: string,
    dayId: string,
  ): Promise<ExerciseAssignmentDocument[]> {
    const result = await (
      this.getCollection<ExerciseDayDocument>(
        appId,
        ExerciseDayDocument.collectionName,
      )
        .doc(dayId)
        .collection(
          ExerciseAssignmentDocument.collectionName,
        ) as CollectionReference<ExerciseAssignmentDocument>
    ).get();

    return result.docs.map((doc) => doc.to(ExerciseAssignmentDocument));
  }

  async addExerciseAssignmentToDay(
    appId: string,
    dayId: string,
    assignment: ExerciseAssignmentDocument,
  ): Promise<ExerciseAssignmentDocument> {
    const result = await this.getCollection<ExerciseDayDocument>(
      appId,
      ExerciseDayDocument.collectionName,
    )
      .doc(dayId)
      .collection(ExerciseAssignmentDocument.collectionName)
      .add(assignment);

    assignment.id = result.id;
    return assignment;
  }

  async getMealDaysForIds(
    appId: string,
    dayIds: string[],
  ): Promise<MealDayDocument[]> {
    const idChunks = ChunkArray(dayIds, 10);

    const mealDays: MealDayDocument[] = [];
    for (const chunk of idChunks) {
      const result = await this.getCollection<MealDayDocument>(
        appId,
        MealDayDocument.collectionName,
      )
        .where(FieldPath.documentId(), 'in', chunk)
        .get();

      const days = result.docs.map((doc) => doc.to(MealDayDocument));

      mealDays.push(...days);
    }

    return mealDays;
  }

  async addMealDay(
    appId: string,
    day: MealDayDocument,
  ): Promise<MealDayDocument> {
    const result = await this.getCollection<MealDayDocument>(
      appId,
      MealDayDocument.collectionName,
    ).add(day);

    day.id = result.id;
    return day;
  }
}
