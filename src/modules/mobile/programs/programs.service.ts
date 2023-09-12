import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { ProgramDocument } from './program.document';
import { MobileUsersService } from '../users/mobile-users.service';
import { FirebaseApp } from '../../firestore/firebase-app.service';

@Injectable()
export class ProgramsService extends FirestoreBaseService {
  constructor(protected app: FirebaseApp, private userService: MobileUsersService) {
    super(app);
  }

  async getAllPrograms(
    appId: string,
  ): Promise<ProgramDocument[]> {
    const snapshot = await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    )
    .get();

    return snapshot.docs.map((doc) => doc.to(ProgramDocument));
  }

  async hasPersonalData(appId: string, userId: string): Promise<boolean> {
    const snapshot = await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    ).where('customerId', '==', userId).count().get();

    if (snapshot.data().count > 0) {
      return true;
    }

    const snapshot2 = await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    ).where('customers', 'array-contains', userId).count().get();

    return snapshot2.data().count > 0;
  }

  async getPrograms(
    appId: string,
    userId: string,
    customerId?: string,
  ): Promise<ProgramDocument[]> {
    const snapshot1 = await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    )
      .where('customerId', '==', customerId ?? null)
      .get();

    let programs = snapshot1.docs.map((doc) => doc.to(ProgramDocument));

    if (customerId != null) {
      const snapshot2 = await this.getCollection<ProgramDocument>(
        appId,
        ProgramDocument.collectionName,
      )
        .where('customers', 'array-contains', userId)
        .get();

      programs.push(...snapshot2.docs.map((doc) => doc.to(ProgramDocument)));
    }

    const user = await this.userService.getUserById(appId, userId);
    programs = programs.filter(e => {
      return e.availablePlans == null || e.availablePlans.length === 0 || e.availablePlans.filter(value => user.productList.some(oneElement => oneElement === value)).length > 0;
    });

    const progress = await this.userService.getUserProgress(appId, userId);
    const progressMap = {};
    for (const p of progress) {
      progressMap[p.id] = p;
    }

    programs.sort((a, b) => a.order - b.order);

    for (const program of programs) {
      if (program.locked && program.startAfterId != null) {
        if (program.daysDelay == null) {
          continue;
        }
        for (const program2 of programs) {
          if (program2.id == program.startAfterId) {
            program.startAfterProgram = program2;
            const startDate = progress[program2.id];
            if (startDate != null) {
              const today = new Date();
              const differenceInMillis =
                today.getMilliseconds() - startDate.getMilliseconds();
              const differenceInDays =
                differenceInMillis / (1000 * 60 * 60 * 24);
              program.daysUntilUnlock = program.daysDelay! - differenceInDays;
              if (program.daysUntilUnlock! < 0) program.daysUntilUnlock = 0;
            } else {
              program.daysUntilUnlock = program.daysDelay!;
            }
          }
        }
      }
    }

    return programs;
  }

  async createProgram(
    appId: string,
    program: ProgramDocument,
  ): Promise<ProgramDocument> {
    try {
      const ref = await this.getCollection<ProgramDocument>(
        appId,
        ProgramDocument.collectionName,
      ).add(program);

      program.id = ref.id;
      return program;
    } catch (e) {
      this.logger.log(e);

      throw e;
    }
  }

  async updateProgram(
    appId: string,
    programId: string,
    program: any,
  ): Promise<ProgramDocument> {
    if (program.id != null && program.id != programId) {
      throw new Error('Program ID does not match');
    }

    console.log(program);

    try {
      await this.getCollection(
        appId,
        ProgramDocument.collectionName,
      )
        .doc(programId)
        .set(program, { merge: true });

      return program;
    } catch (e) {
      this.logger.log(e);

      throw e;
    }
  }

  async deleteProgram(appId: string, programId: string): Promise<void> {
    try {
      await this.getCollection<ProgramDocument>(
        appId,
        ProgramDocument.collectionName,
      )
        .doc(programId)
        .delete();
    } catch (e) {
      this.logger.log(e);

      throw e;
    }
  }

  async getProgram(
    appId: string,
    programId: string,
  ): Promise<ProgramDocument | null> {
    const snapshot = await this.getCollection<ProgramDocument>(
      appId,
      ProgramDocument.collectionName,
    )
      .doc(programId)
      .get();

    if (!snapshot.exists) return null;

    return snapshot.to(ProgramDocument);
  }

  async reorderPrograms(appId: string, ids: string[]) {
    for (const i in ids) {
      await this.getCollection(appId, ProgramDocument.collectionName)
        .doc(ids[parseInt(i)])
        .set({ order: parseInt(i) }, { merge: true });
    }
  }
}
