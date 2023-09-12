import { Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import AppConfig from "../../configs/app.config";

@Injectable()
export class FirebaseApp {
  private firebaseApps: Map<string, firebase.app.App> = new Map();

  private readonly projectMap = {
    'yeLwTkXGQX0UvzLcSLxA': AppConfig.FIREBASE.SERVICE_ACCOUNT_ATHLETIC,
    'Qc8dscN4PH67CAsBwlj2': AppConfig.FIREBASE.SERVICE_ACCOUNT_ATHLETIC,
    'R1Z3xvHOcsRnAe534VhT': AppConfig.FIREBASE.SERVICE_ACCOUNT_ATHLETIC,
    'Wak35EBSwAOdSmDh3gyg': AppConfig.FIREBASE.SERVICE_ACCOUNT_RADIN,
    'U8fMcrpQnspdIOZ8y7cY': AppConfig.FIREBASE.SERVICE_ACCOUNT_RISE,
    '0fo3C7krRaDsGY2fyaPX': AppConfig.FIREBASE.SERVICE_ACCOUNT_ROB,
    'KaKod5rLYYQq8b2qPyDq': AppConfig.FIREBASE.SERVICE_ACCOUNT_SUPRA,
    'xODau9kgep1aFSwTDk1T': AppConfig.FIREBASE.SERVICE_ACCOUNT_TANK,
    '7cMv69weLE9cOzADRiuC': AppConfig.FIREBASE.SERVICE_ACCOUNT_TRABUCO,
  };

  constructor() {
    this.firebaseApps['default'] = firebase.initializeApp({
      credential: firebase.credential.cert(AppConfig.FIREBASE.SERVICE_ACCOUNT),
      storageBucket: AppConfig.FIREBASE.STORAGE_BUCKET,
    });
  }

  auth = (appId: string): firebase.auth.Auth => {
    if (!Object.keys(this.projectMap).includes(appId)) {
      return this.firebaseApps['default'].auth();
    } else {
      if (!this.firebaseApps.has(appId)) {
        console.log('Initializing app: ' + appId);
        this.firebaseApps.set(appId, firebase.initializeApp({
          credential: firebase.credential.cert(this.projectMap[appId]),
          storageBucket: AppConfig.FIREBASE.STORAGE_BUCKET,
        }, appId));
      }
      return this.firebaseApps.get(appId).auth();
    }
  };

  firestore = (appId: string): firebase.firestore.Firestore => {
    if (!Object.keys(this.projectMap).includes(appId)) {
      return this.firebaseApps['default'].firestore();
    } else {
      if (!this.firebaseApps.has(appId)) {
        this.firebaseApps.set(appId, firebase.initializeApp({
          credential: firebase.credential.cert(this.projectMap[appId]),
          storageBucket: AppConfig.FIREBASE.STORAGE_BUCKET,
        }, appId));
      }
      return this.firebaseApps.get(appId).firestore();
    }
  };

  storage = (): firebase.storage.Storage => {
    return this.firebaseApps['default'].storage();
  };

  apiKey = (appId: string): string => {
    if (!Object.keys(this.projectMap).includes(appId)) {
      return AppConfig.FIREBASE.SERVICE_ACCOUNT.api_key;
    } else {
      return this.projectMap[appId].api_key;
    }
  }
}
