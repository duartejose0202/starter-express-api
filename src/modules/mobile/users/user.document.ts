import { Timestamp } from '@google-cloud/firestore';

export class UserDocument {
  static readonly collectionName = 'customers';

  id?: string;
  readonly training: boolean = false;
  readonly messaging: boolean = false;
  readonly messagingToken?: string;
  readonly name?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly gender?: string;
  readonly height?: number;
  readonly birthday?: Timestamp;
  readonly metric: boolean = false;
  readonly coachEmail?: string;
  readonly email: string;
  readonly imageUrl?: string;
  readonly isCoach: boolean = false;
  isAdmin = false;
  readonly unpaid: boolean = false;
  readonly appOpened: boolean = false;
  readonly active: boolean = true;
  readonly paymentMethod: string = 'web';
  readonly verificationData?: string;
  readonly subscriptionId?: string;
  readonly stripeCustomerId?: string;
  readonly blockedIds: string[] = [];
  readonly blockedByIds: string[] = [];
  readonly hiddenPostIds: string[] = [];
  readonly hiddenCommentIds: string[] = [];
  readonly reported: boolean = false;
  readonly isAllPlans: boolean = true;
  readonly password?: string;
  productList: string[] = [];
}
