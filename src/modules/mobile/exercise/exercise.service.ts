import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { ExerciseDocument } from './exercise.document';
import { ChunkArray } from '../../../helpers/array.helper';
import { firestore } from 'firebase-admin';
import FieldPath = firestore.FieldPath;
import { ExerciseAssignmentDocument } from './exercise_assignment.document';
import { ExerciseEntryDocument } from "./exercise-entry.document";

@Injectable()
export class ExerciseService extends FirestoreBaseService {
  async getExercises(appId: string) {
    const response = await this.getCollection<ExerciseDocument>(
      appId,
      ExerciseDocument.collectionName,
    ).get();

    return response.docs.map((doc) => doc.to(ExerciseDocument));
  }

  async getExercisesByIds(appId: string, ids: string[]): Promise<ExerciseDocument[]> {
    if (ids.length === 0) return [];

    const chunks = ChunkArray(ids, 10);
    const futures = chunks.map((chunk) =>
      this.getCollection<ExerciseDocument>(
        appId,
        ExerciseDocument.collectionName,
      )
        .where(FieldPath.documentId(), 'in', chunk)
        .get(),
    );

    const results = await Promise.all(futures);
    const exercises = [];
    for (const result of results) {
      exercises.push(...result.docs.map((doc) => doc.to(ExerciseDocument)));
    }

    return exercises;
  }

  async refreshExerciseAssignment(
    appId: string,
    path: string,
  ): Promise<ExerciseAssignmentDocument> {
    if (
      !path.startsWith(`apps/${appId}`) ||
      !(path.includes('assignments') || path.includes('items'))
    ) {
      throw new Error('Invalid path');
    }

    const result = await this.app.firestore(appId).doc(path).get();

    if (result.exists) {
      return result.to(ExerciseAssignmentDocument);
    } else {
      throw new NotFoundException();
    }
  }

  async updateExerciseAssignment(
    appId: string,
    assignment: ExerciseAssignmentDocument,
  ): Promise<ExerciseAssignmentDocument> {
    if (
      !assignment.path.startsWith(`apps/${appId}`) ||
      !(assignment.path.includes('assignments') || assignment.path.includes('items'))
    ) {
      throw new Error('Invalid path');
    }

    await this.app.firestore(appId)
      .doc(assignment.path)
      .set(assignment, { merge: true });

    return assignment;
  }

  async createExercise(
    appId: string,
    exercise: ExerciseDocument,
  ): Promise<ExerciseDocument> {
    const result = await this.getCollection(
      appId,
      ExerciseDocument.collectionName,
    ).add(exercise);

    exercise.id = result.id;
    return exercise;
  }

  async updateExercise(
    appId: string,
    exerciseId: string,
    exercise: ExerciseDocument,
  ): Promise<ExerciseDocument> {
    if (exercise.id !== exerciseId) {
      throw new Error('Exercise ID does not match');
    }

    await this.getCollection(appId, ExerciseDocument.collectionName)
      .doc(exerciseId)
      .set(exercise, { merge: true });

    return exercise;
  }

  async deleteExercise(
    appId: string,
    exerciseId: string,
  ): Promise<void> {
    await this.getCollection(appId, ExerciseDocument.collectionName)
      .doc(exerciseId)
      .delete();
  }

  async createExerciseEntry(
    appId: string,
    userId: string,
    exerciseId: string,
    entry: ExerciseEntryDocument,
  ): Promise<ExerciseEntryDocument> {
    await this.getUserCollection(
      appId,
      userId,
      ExerciseDocument.collectionName,
    )
      .doc(exerciseId)
      .set({"exists": true}, { merge: true });

    const result = await this.getUserCollection(
      appId,
      userId,
      ExerciseDocument.collectionName,
    )
      .doc(exerciseId)
      .collection(ExerciseEntryDocument.collectionName)
      .add(entry);

    entry.id = result.id;
    entry.path = result.path;

    return entry;
  }

  async getExerciseEntries(
    appId: string,
    userId: string,
    exerciseId: string,
  ): Promise<ExerciseEntryDocument[]> {
    const response = await this.getUserCollection(
      appId,
      userId,
      ExerciseDocument.collectionName,
    )
      .doc(exerciseId)
      .collection(ExerciseEntryDocument.collectionName)
      .get();

    return response.docs.map((doc) => doc.to(ExerciseEntryDocument));
  }

  async getExerciseOneRepMax(
    appId: string,
    userId: string,
    exerciseId: string,
  ): Promise<number | null> {
    const response = await this.getUserCollection(
      appId,
      userId,
      ExerciseDocument.collectionName,
    )
      .doc(exerciseId)
      .get();

    return response.data()['singleRepMax'];
  }

  async saveOneRepMax(
    appId: string,
    userId: string,
    exerciseId: string,
    oneRepMax: number,
  ) {
    await this.getUserCollection(
      appId,
      userId,
      ExerciseDocument.collectionName,
    )
      .doc(exerciseId)
      .set({ singleRepMax: oneRepMax }, { merge: true });
  }
}
