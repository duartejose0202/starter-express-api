import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { FirestoreBaseService } from "../../firestore/firestore-base.service";
import { RestrictionDocument } from "./restriction.document";
import { FirebaseApp } from "../../firestore/firebase-app.service";
import { PricingPlanService } from "../../app/pricing-plan/pricing-plan.service";

@Injectable()
export class RestrictionsService extends FirestoreBaseService {
  constructor(
    protected app: FirebaseApp,
    @Inject(forwardRef(() => PricingPlanService))
    private pricingPlanService: PricingPlanService
  ) {
    super(app);
  }

  async getRestrictions(appId: string) : Promise<RestrictionDocument[]> {
    const restrictions = await this.getCollection<RestrictionDocument>(
      appId,
      RestrictionDocument.collectionName
    ).get();

    return restrictions.docs.map(doc => doc.to(RestrictionDocument));
  }

  async getRestrictionsForClient(appId: string): Promise<RestrictionDocument[]> {
    const restrictions = await this.getCollection<RestrictionDocument>(
      appId,
      RestrictionDocument.collectionName
    ).get();

    const response = restrictions.docs.map(doc => doc.to(RestrictionDocument));

    const ids = response.map((r) => r.products).flat();
    if (ids.length === 0) return response;

    const productMap = {};
    const pricingPlans = await this.pricingPlanService.findMany(ids);
    for (let plan of pricingPlans) {
      productMap[plan.id] = plan.name;
    }

    for (let restriction of response) {
      const map = {};
      for (let product of restriction.products) {
        map[product] = productMap[product];
      }
      restriction.productMap = map;
    }

    return response;
  }

  async createRestriction(appId: string, restriction: RestrictionDocument) {
    const restrictions = await this.getRestrictions(appId);

    if (restriction.type === 'program') {
      if (!restriction.programId) {
        throw new Error('Program ID is required for program restrictions');
      }

      const matches = restrictions.filter(r => r.type === 'program' && r.programId === restriction.programId);
      if (matches.length > 0) {
        const match = matches[0];
        match.products = [...new Set([...match.products, ...restriction.products])];
        await this.updateRestriction(appId, match);
        return;
      } else {
        await this.getCollection<RestrictionDocument>(
          appId,
          RestrictionDocument.collectionName
        ).add(restriction);
      }
    } else {
      if (!restriction.featureType) {
        throw new Error('Feature type is required for feature restrictions');
      }

      const matches = restrictions.filter(r => r.type === 'feature' && r.featureType === restriction.featureType);
      if (matches.length > 0) {
        const match = matches[0];
        match.products = [...new Set([...match.products, ...restriction.products])];
        await this.updateRestriction(appId, match);
        return;
      } else {
        await this.getCollection<RestrictionDocument>(
          appId,
          RestrictionDocument.collectionName
        ).add(restriction);
      }
    }
  }

  async removeRestriction(appId: string, restriction: RestrictionDocument) {
    const restrictions = await this.getRestrictions(appId);

    if (restriction.type === 'program') {
      if (!restriction.programId) {
        throw new Error('Program ID is required for program restrictions');
      }

      const matches = restrictions.filter(r => r.type === 'program' && r.programId === restriction.programId);
      if (matches.length > 0) {
        const match = matches[0];
        match.products = match.products.filter(p => !restriction.products.includes(p));

        await this.updateRestriction(appId, match);
        return;
      }
    } else {
      if (!restriction.featureType) {
        throw new Error('Feature type is required for feature restrictions');
      }

      const matches = restrictions.filter(r => r.type === 'feature' && r.featureType === restriction.featureType);
      if (matches.length > 0) {
        const match = matches[0];
        match.products = match.products.filter(p => !restriction.products.includes(p));

        await this.updateRestriction(appId, match);
        return;
      }
    }
  }

  async updateRestriction(appId: string, restriction: RestrictionDocument) {
    await this.getCollection<RestrictionDocument>(
      appId,
      RestrictionDocument.collectionName
    ).doc(restriction.id).set(Object.assign({}, restriction), { merge: true });
  }
}
