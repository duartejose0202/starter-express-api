import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDocument } from './user.document';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { ProgressDocument } from './progress.document';
import { Roles } from '../../../constants';
import { SwapDocument } from './swap.document';
import { FavoriteDocument } from './favorite.document';
import { UserCreationDto } from './user-creation.dto';
import { FirebaseApp } from '../../firestore/firebase-app.service';
import { FirebaseCreateAppDto } from '../app_data/firebase-create-app.dto';
import { AppDataDocument } from '../app_data/app-data.document';
import { GoalDocument } from '../goals/goal.document';

@Injectable()
export class MobileUsersService extends FirestoreBaseService {
  constructor(protected app: FirebaseApp) {
    super(app);
  }

  async createNewApp(data: FirebaseCreateAppDto): Promise<AppDataDocument> {
    const db = this.app.firestore('default');
    // Create new app
    const newRef = await db.collection(AppDataDocument.collectionName).add({
      adminEmail: data.email,
      appOpened: false,
    });
    const appId = newRef.id;

    const appDoc = this.getAppCollection('default').doc(appId);

    let batch = db.batch();
    // Add superadmins, user, and test account as customers to the app
    const users = [
      'swainston.cory89@gmail.com',
      'creators@gameplanapps.com',
      'tester@test.com',
    ];
    users.forEach((email) => {
      batch.set(appDoc.collection(UserDocument.collectionName).doc(), {
        email: email,
      });
    });
    // Set up goals
    batch.set(appDoc.collection(GoalDocument.collectionName).doc(), {
      title: 'Weight',
    });

    // Add user as admin for their new app
    batch.set(db.collection('admins').doc(), {
      email: data.email,
      appId: appId,
    });

    // commit changes
    await batch.commit();

    // Create user login
    await this.createSubscription({
      appId: appId,
      email: data.email,
      password: data.password,
      productList: [],
    });

    const appResponse = await appDoc.get();
    return appResponse.to(AppDataDocument);
  }

  async getUserData(
    appId: string,
    userId: string,
  ): Promise<UserDocument | null> {
    try {
      const user = await this.getCollection<UserDocument>(
        appId,
        UserDocument.collectionName,
      )
        .doc(userId)
        .get();

      if (!user.exists) {
        return null;
      }

      return user.to(UserDocument);
    } catch (e) {
      this.logger.log(e);

      throw e;
    }
  }

  async getUserExists(appId: string, email: string): Promise<boolean> {
    const result = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    )
      .where('email', '==', email.toLowerCase().trim())
      .get();

    return !result.empty;
  }

  async getUserByEmail(
    appId: string,
    email: string,
  ): Promise<UserDocument | null> {
    const result = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    )
      .where('email', '==', email.toLowerCase().trim())
      .get();

    if (!result.empty) {
      return result.docs[0].to(UserDocument);
    } else {
      return null;
    }
  }

  async getUserByName(
    appId: string,
    name: string,
  ): Promise<UserDocument | null> {
    const result = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    )
      .where('name', '==', name)
      .get();

    if (!result.empty) {
      return result.docs[0].to(UserDocument);
    } else {
      return null;
    }
  }

  async getUserById(
    appId: string,
    userId: string,
  ): Promise<UserDocument | null> {
    const result = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    )
      .doc(userId)
      .get();

    if (!result.exists) {
      return null;
    } else {
      return result.to(UserDocument);
    }
  }

  async createSubscription(userInfo: UserCreationDto): Promise<void> {
    console.log(userInfo);
    console.log('Creating subscription for App ID: ' + userInfo.appId);

    const user = await this.getUserByEmail(userInfo.appId, userInfo.email);
    if (user == null) {
      // whitelist user as a customer in the app
      console.log("User doesn't exist. Adding " + userInfo.email);
      await this.createUser(userInfo.appId, {
        email: userInfo.email,
        subscriptionId: userInfo.subscriptionId ?? null,
        stripeCustomerId: userInfo.stripeCustomerId ?? null,
        firstName: userInfo.firstName ?? null,
        lastName: userInfo.lastName ?? null,
        isAllPlans: userInfo.isAllPlans ?? true,
        productList: userInfo.productList ?? [],
      });

      // if (appId === "KaKod5rLYYQq8b2qPyDq") { TODO handle email sending
      //   sg.setApiKey(functions.config().sendgrid.key);
      //
      //   const msg = {
      //     from: {email: "ross@supratraining.app", name: appData.data()["name"]},
      //     templateId: "d-b58c5dc15c2f46408e1782f91d767520",
      //     personalizations: [{
      //       to: { "email": customerEmail },
      //     }],
      //   };
      //   console.log(msg);
      //   await sg.send(msg);
      // }
    } else {
      user.productList = user.productList.concat(userInfo.productList);
      await this.saveUserData(userInfo.appId, user.id, user);
      console.log('Updating existing user ' + userInfo.email);
      await this.saveUserData(userInfo.appId, user.id, {
        subscriptionId: userInfo.subscriptionId,
        stripeCustomerId: userInfo.stripeCustomerId,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        unpaid: false,
        productList: (user.productList ?? []).concat(userInfo.productList ?? []),
      });
    }

    if (userInfo.password != null) {
      try {
        await this.app.auth(userInfo.appId).createUser({
          email: userInfo.email,
          password: userInfo.password,
          emailVerified: false,
          displayName: `${userInfo.firstName} ${userInfo.lastName}`,
          disabled: false,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      console.log(`No password provided for ${userInfo.email}. Skipping user creation.`);
    }
  }

  async getAllUsers(appId: string): Promise<UserDocument[]> {
    const result = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    ).get();

    const users = result.docs.map((doc) => doc.to(UserDocument));

    const superAdminsRes = await this.app
      .firestore(appId)
      .collection('superadmins')
      .get();
    const superAdmins = superAdminsRes.docs.map((d) => d.data().email);
    const adminRes = await this.app
      .firestore(appId)
      .collection('admins')
      .where('appId', '==', appId)
      .get();
    const admins = adminRes.docs.map((d) => d.data().email);

    for (const user of users) {
      if (superAdmins.includes(user.email) || admins.includes(user.email)) {
        user.isAdmin = true;
      }
    }

    return users;
  }

  async deleteUser(appId: string, userId: string): Promise<void> {
    const response = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    ).doc(userId).get();

    if (!response.exists) return;

    const user = response.to(UserDocument);
    if (user.subscriptionId != null) {
      throw new BadRequestException();
    }

    await response.ref.delete();
  }

  async saveUserData(
    appId: string,
    userId: string,
    userData: Partial<UserDocument>,
  ): Promise<void> {
    await this.getCollection<UserDocument>(appId, UserDocument.collectionName)
      .doc(userId)
      .set(userData, { merge: true });
  }

  async createUser(
    appId: string,
    userData: Partial<UserDocument>,
  ): Promise<void> {
    const result = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    ).where('email', '==', userData.email).get();

    if (!result.empty) {
      throw new BadRequestException();
    }

    await this.getCollection<Partial<UserDocument>>(
      appId,
      UserDocument.collectionName,
    ).add(userData);
  }

  async getUserProgress(
    appId: string,
    userId: string,
  ): Promise<ProgressDocument[]> {
    const progress = await this.getUserCollection<ProgressDocument>(
      appId,
      userId,
      ProgressDocument.collectionName,
    ).get();

    return progress.docs.map((doc) => doc.to(ProgressDocument));
  }

  async getProgressForItem(
    appId: string,
    userId: string,
    itemId: string,
  ): Promise<ProgressDocument | null> {
    const progress = await this.getUserCollection<ProgressDocument>(
      appId,
      userId,
      ProgressDocument.collectionName,
    )
      .doc(itemId)
      .get();

    if (progress.exists) {
      return progress.to(ProgressDocument);
    } else {
      return null;
    }
  }

  async addUserProgress(
    appId: string,
    userId: string,
    progress: ProgressDocument,
  ) {
    await this.getUserCollection<ProgressDocument>(
      appId,
      userId,
      ProgressDocument.collectionName,
    )
      .doc(progress.itemId)
      .set(Object.assign({}, progress), { merge: true });
  }

  async getUserRole(email: string, appId: string): Promise<string> {
    const superResult = await this.app
      .firestore(appId)
      .collection('superadmins')
      .where('email', '==', email.toLowerCase().trim())
      .get();

    if (superResult.docs.length !== 0) {
      return Roles.ADMIN;
    }

    const adminResult = await this.app
      .firestore(appId)
      .collection('admins')
      .where('appId', '==', appId)
      .where('email', '==', email.toLowerCase().trim())
      .get();

    if (adminResult.docs.length !== 0) {
      return Roles.APP_OWNER;
    }

    return Roles.APP_USER;
  }

  async getSwaps(appId: string, userId: string): Promise<SwapDocument[]> {
    const response = await this.getUserCollection<SwapDocument>(
      appId,
      userId,
      SwapDocument.collectionName,
    ).get();

    return response.docs.map((doc) => doc.to(SwapDocument));
  }

  async addSwap(appId: string, userId: string, swap: SwapDocument) {
    const response = await this.getUserCollection<SwapDocument>(
      appId,
      userId,
      SwapDocument.collectionName,
    ).add(swap);

    return {
      id: response.id,
    };
  }

  async deleteSwap(appId: string, userId: string, swapId: string) {
    await this.getUserCollection<SwapDocument>(
      appId,
      userId,
      SwapDocument.collectionName,
    )
      .doc(swapId)
      .delete();
  }

  async getFavorites(
    appId: string,
    userId: string,
    type?: string,
  ): Promise<FavoriteDocument[]> {
    if (type) {
      const response = await this.getUserCollection<FavoriteDocument>(
        appId,
        userId,
        FavoriteDocument.collectionName,
      )
        .where('type', '==', type)
        .get();

      return response.docs.map((doc) => doc.to(FavoriteDocument));
    } else {
      const response = await this.getUserCollection<FavoriteDocument>(
        appId,
        userId,
        FavoriteDocument.collectionName,
      ).get();

      return response.docs.map((doc) => doc.to(FavoriteDocument));
    }
  }

  async addFavorite(appId: string, userId: string, favorite: FavoriteDocument) {
    const response = await this.getUserCollection<FavoriteDocument>(
      appId,
      userId,
      FavoriteDocument.collectionName,
    ).add(favorite);

    return {
      id: response.id,
    };
  }

  async deleteFavorite(appId: string, userId: string, itemId: string) {
    const result = await this.getUserCollection<FavoriteDocument>(
      appId,
      userId,
      FavoriteDocument.collectionName,
    )
      .where('itemId', '==', itemId)
      .get();

    for (const doc of result.docs) {
      await doc.ref.delete();
    }
  }
}
