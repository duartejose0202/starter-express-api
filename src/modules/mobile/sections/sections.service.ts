import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { ProgramDocument } from '../programs/program.document';
import { SectionDocument } from './section.document';
import { firestore } from 'firebase-admin';
import { DaysService } from '../days/days.service';
import { MobileUsersService } from '../users/mobile-users.service';
import { FirebaseApp } from '../../firestore/firebase-app.service';
import FieldValue = firestore.FieldValue;

@Injectable()
export class SectionsService extends FirestoreBaseService {
  constructor(
    protected app: FirebaseApp,
    private readonly daysService: DaysService,
    private readonly userService: MobileUsersService,
  ) {
    super(app);
  }

  async copySection(appId: string, programId: string, sectionId: string) {
    try {
      const getResult = await this.getCollection<ProgramDocument>(
        appId,
        ProgramDocument.collectionName,
      )
        .doc(programId)
        .collection(SectionDocument.collectionName)
        .doc(sectionId)
        .get();

      const section = getResult.to(SectionDocument);

      const addResult = await this.getCollection<ProgramDocument>(
        appId,
        ProgramDocument.collectionName,
      )
        .doc(programId)
        .collection(SectionDocument.collectionName)
        .add(section);

      section.id = addResult.id;

      const exerciseDays = await this.daysService.getExerciseDaysForIds(
        appId,
        section.exerciseDays,
      );

      for (const day of exerciseDays) {
        const newDay = await this.daysService.addExerciseDay(appId, day);
        await this.addExerciseDayToSection(
          appId,
          programId,
          section.id,
          newDay.id,
        );

        const assignments = await this.daysService.getExerciseAssignmentsForDay(
          appId,
          day.id,
        );

        for (const a of assignments) {
          if (a.isSuperset) {
            const assignmentPromises = a.assignmentIds
              ?.map((id) => assignments.filter((as) => as.id == id))
              .filter((e) => e.length > 0)
              .map((e) => e[0])
              .map((e) =>
                this.daysService.addExerciseAssignmentToDay(
                  appId,
                  newDay.id,
                  e,
                ),
              );
            if (assignmentPromises != null) {
              const newIds = (await Promise.all(assignmentPromises)).map(
                (e) => e.id,
              );
              const copy = { ...a };
              a.assignmentIds = newIds;
              await this.daysService.addExerciseAssignmentToDay(
                appId,
                newDay.id,
                copy,
              );
            }
          } else {
            await this.daysService.addExerciseAssignmentToDay(
              appId,
              newDay.id,
              { ...a },
            );
          }
        }
      }

      const mealDays = await this.daysService.getMealDaysForIds(
        appId,
        section.mealDays,
      );
      for (const day of mealDays) {
        const newDay = await this.daysService.addMealDay(appId, day);
        await this.addMealDayToSection(appId, programId, section.id, newDay.id);
      }
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  async addExerciseDayToSection(
    appId: string,
    programId: string,
    sectionId: string,
    dayId: string,
  ) {
    await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    )
      .doc(programId)
      .collection(SectionDocument.collectionName)
      .doc(sectionId)
      .set({ exerciseDays: FieldValue.arrayUnion([dayId]) }, { merge: true });
  }

  async addMealDayToSection(
    appId: string,
    programId: string,
    sectionId: string,
    dayId: string,
  ) {
    await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    )
      .doc(programId)
      .collection(SectionDocument.collectionName)
      .doc(sectionId)
      .set({ mealDays: FieldValue.arrayUnion([dayId]) }, { merge: true });
  }

  async getSections(
    userId: string,
    appId: string,
    programId: string,
  ): Promise<SectionDocument[]> {
    const response = await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    )
      .doc(programId)
      .collection(SectionDocument.collectionName)
      .get();
    const sections = response.docs.map((doc) => doc.to(SectionDocument));

    const progress = await this.userService.getUserProgress(appId, userId);

    const progressMap = new Map<string, Date>();
    progress.forEach((doc) => {
      progressMap.set(doc.id, new Date(doc.startDate.seconds));
    });

    for (const section of sections) {
      if (section.locked && section.startAfterId != null) {
        if (section.daysDelay == null) {
          continue;
        }
        for (const section2 of sections) {
          if (section2.id == section.startAfterId) {
            section.startAfterSection = section2;
            const startDate = progressMap.get(section2.id);
            if (startDate != null) {
              section.daysUntilUnlock =
                section.daysDelay -
                Math.floor(
                  (new Date().getTime() - startDate.getTime()) /
                    (1000 * 3600 * 24),
                );
              if (section.daysUntilUnlock < 0) section.daysUntilUnlock = 0;
            } else {
              section.daysUntilUnlock = section.daysDelay;
            }
          }
        }
      }
    }

    return sections;
  }
}
