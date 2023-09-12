import { Injectable } from '@nestjs/common';
import { CircuitDocument } from './circuit.document';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { ChunkArray } from '../../../helpers/array.helper';
import { firestore } from 'firebase-admin';
import FieldPath = firestore.FieldPath;

@Injectable()
export class CircuitsService extends FirestoreBaseService {
  async getAllCircuits(appId: string): Promise<CircuitDocument[]> {
    try {
      const circuits = await this.getCollection<CircuitDocument>(
        appId,
        CircuitDocument.collectionName,
      ).get();

      return circuits.docs.map((doc) => doc.to(CircuitDocument));
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  async getCircuitsByIds(
    appId: string,
    ids: string[],
  ): Promise<CircuitDocument[]> {
    try {
      const chunks = ChunkArray(ids, 10);
      const results = await Promise.all(
        chunks.map(async (chunk) => {
          const circuits = await this.getCollection<CircuitDocument>(
            appId,
            CircuitDocument.collectionName,
          )
            .where(FieldPath.documentId(), 'in', chunk)
            .get();

          return circuits.docs.map((doc) => doc.to(CircuitDocument));
        }),
      );

      return [].concat(...results);
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  async createCircuit(
    appId: string,
    circuit: CircuitDocument,
  ): Promise<CircuitDocument> {
    try {
      const reference = await this.getCollection<CircuitDocument>(
        appId,
        CircuitDocument.collectionName,
      ).add(circuit);

      circuit.id = reference.id;
      return circuit;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }
}
