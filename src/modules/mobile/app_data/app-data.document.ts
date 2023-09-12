import { FirestoreBaseDocument } from '../../firestore/firestore-base.document';

export class AppDataDocument extends FirestoreBaseDocument {
  static collectionName = 'apps';

  adminEmail: string;
  readonly backgroundColor: string;
  readonly backgroundUrl?: string;
  readonly active?: boolean;
  readonly isExample?: boolean;
  readonly coaching?: boolean;
  readonly iconUrl?: string;
  readonly logoUrl?: string;
  readonly metric?: boolean;
  readonly messaging?: boolean;
  readonly free?: boolean;
  readonly showCommunity?: boolean;
  readonly appCategory?: string;
  readonly showUserProfile?: boolean;
  readonly advancedCharts?: boolean;
  name?: string;
  readonly splashScreenUrl: string;
  readonly themeColor?: string;
  readonly welcomeMessage?: string;
  readonly applePurchases?: string[];
  readonly googlePurchases?: string[];
  readonly earliestBuild?: number;
  readonly videoLimit?: number;
  readonly config?: string;
  readonly privacyPolicyUrl?: string;
  readonly accountManagementUrl?: string;
  readonly pushyKey?: string;
}
