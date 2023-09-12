import AppConfig from '../../../configs/app.config';
import axios from 'axios';
import { UserDocument } from '../users/user.document';
import { AuthUserDto } from './auth-user.dto';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenSwapDto } from './token-swap.dto';
import { FirebaseApp } from "../../firestore/firebase-app.service";
import { MobileUsersService } from "../users/mobile-users.service";
import { Roles } from "../../../constants";

@Injectable()
export class AuthService extends FirestoreBaseService {
  constructor(
    protected app: FirebaseApp,
    private userService: MobileUsersService,
  ) {
    super(app);
  }

  async migrateToken(
    appId: string,
    token: string
  ): Promise<TokenSwapDto> {
    let decodedToken;
    try {
      // decode bearer token
      const decodedToken = await this.app.auth(appId).verifyIdToken(token);

      if (decodedToken.email != null) {
        // generate custom token
        const customToken = await this.app.auth(appId).createCustomToken(decodedToken.uid);
        console.log('Successfully generated custom token');

        const existingUser = await this.userService.getUserByEmail(appId, decodedToken.email);
        if (!existingUser) {
          throw new Error("User data doesn't exist.");
        }
        await this.setClaimsForUser(appId, decodedToken.email);

        // swap custom token for access and refresh tokens
        const apiKey = this.app.apiKey(appId);
        const response = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
          {
            token: customToken,
            returnSecureToken: true,
          },
        );
        console.log(
          'Successfully swapped custom token for access and refresh tokens',
        );

        return {
          token: response.data.idToken,
          refreshToken: response.data.refreshToken,
        };
      } else {
        throw new UnauthorizedException();
      }
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException();
    }
  }

  async getFirebaseToken(
    appId: string,
    token: string,
    refreshToken?: string,
  ): Promise<TokenSwapDto> {
    let decodedToken;
    try {
      // decode bearer token
      await this.app.auth(appId).verifyIdToken(token);
      return {
        token,
        refreshToken,
      };
    } catch (e) {
      console.log('Token is not Firebase token');
    }

    try {
      // decode bearer token
      decodedToken = jwt.verify(token, AppConfig.APP.JWT_SECRET);
      console.log('Token is jwt');

      if (decodedToken.email != null) {
        console.log('Getting user from email: ' + decodedToken.email);

        let user;
        try {
          user = await this.app.auth(appId).getUserByEmail(decodedToken.email);
        } catch (e) {
          console.error(e);
          console.log('User not found, creating user');
          user = await this.app.auth(appId).createUser({
            email: decodedToken.email,
          });
        }
        // generate custom token
        const customToken = await this.app.auth(appId).createCustomToken(user.uid);
        console.log('Successfully generated custom token');

        const existingUser = await this.userService.getUserByEmail(appId, decodedToken.email);
        if (!existingUser) {
          console.log("User data doesn't exist. Creating user in db");
          await this.userService.createUser(appId, { email: decodedToken.email });
          await this.app.firestore(appId).collection('admins').add({
            email: decodedToken.email,
            appId: appId,
          });
        }
        await this.setClaimsForUser(appId, decodedToken.email);

        // swap custom token for access and refresh tokens
        const apiKey = this.app.apiKey(appId);
        const response = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
          {
            token: customToken,
            returnSecureToken: true,
          },
        );
        console.log(
          'Successfully swapped custom token for access and refresh tokens',
        );

        return {
          token: response.data.idToken,
          refreshToken: response.data.refreshToken,
        };
      } else {
        throw new UnauthorizedException();
      }
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException();
    }
  }

  async getCustomToken(
    email: string,
  ): Promise<TokenSwapDto> {

    let customToken;

    try {
      // decode bearer token

      if (!email) {
        throw new UnauthorizedException();
      }

      customToken = jwt.sign(email, AppConfig.APP.JWT_SECRET);

      return {
        token: customToken,
      };
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException();
    }
  }

  async login(
    appId: string,
    email: string,
    password: string,
  ): Promise<AuthUserDto | null> {
    await this.setClaimsForUser(appId, email);

    const apiKey = this.app.apiKey(appId);
    try {
      // Authenticate user using Firebase REST API
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error verifying user:', error);
      return null;
    }
  }

  async setClaimsForUser(appId: string, email: string): Promise<void> {
    const userResponse = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    )
      .where('email', '==', email.toLowerCase().trim())
      .get();
    if (userResponse.empty) {
      console.log("User data not found. Could not set claims.");
      return;
    }

    const authUser = await this.app.auth(appId)
      .getUserByEmail(email.toLowerCase().trim());
    if (authUser == null) {
      console.error("Auth user not found. Could not set claims.");

      return;
    }

    const role = await this.userService.getUserRole(email, appId);

    const claims = {
      id: userResponse.docs[0].id,
      email: userResponse.docs[0].data().email,
      appId: appId,
      role: role,
    };

    await this.app.auth(appId).setCustomUserClaims(authUser.uid, claims);
  }

  async refresh(appId: string, token: string): Promise<AuthUserDto> {
    const apiKey = this.app.apiKey(appId);

    try {
      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/token?key=${apiKey}`,
        {
          grant_type: 'refresh_token',
          refresh_token: token,
        },
      );
      console.log(response);

      return response.data;
    } catch (e) {
      console.error('Error with refresh token');
      console.error(e);
      throw new UnauthorizedException();
    }
  }

  async getCustomerToken(appId: string, email: string) {
    const user = await this.app.auth(appId).getUserByEmail(email);

    // generate custom token
    const customToken = await this.app.auth(appId).createCustomToken(user.uid);
    console.log('Successfully generated custom token');

    await this.setClaimsForUser(appId, email);

    // swap custom token for access and refresh tokens
    const apiKey = this.app.apiKey(appId);
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        token: customToken,
        returnSecureToken: true,
      },
    );
    console.log(
      'Successfully swapped custom token for access and refresh tokens',
    );

    return {
      token: response.data.idToken,
    };
  }

  async signUp(
    appId: string,
    email: string,
    password: string,
  ): Promise<string | null> {
    const userResponse = await this.getCollection<UserDocument>(
      appId,
      UserDocument.collectionName,
    )
      .where('email', '==', email.toLowerCase().trim())
      .get();
    if (userResponse.empty) {
      return null;
    }

    let userExists = true;
    try {
      await this.app.auth(appId).getUserByEmail(email);
    } catch (e) {
      userExists = false;
    }

    if (!userExists) {
      const apiKey = this.app.apiKey(appId);
      try {
        // Create user using Firebase REST API
        const response = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
          {
            email,
            password,
            returnSecureToken: true,
          },
        );

        const uid = response.data.localId;
        const claims = {
          id: userResponse.docs[0].id,
          email: userResponse.docs[0].data().email,
          appId: appId,
          role: Roles.APP_USER,
        };
        await this.app.auth(appId).setCustomUserClaims(uid, claims);
        response.data.id = claims.id;
        response.data.email = claims.email;

        // Send the JWT token back to the client
        return response.data;
      } catch (error) {
        console.error('Error verifying user:', error);
        return null;
      }
    }
  }

  async userExists(appId: string, email: string): Promise<boolean> {
    try {
      const user = await this.app.auth(appId).getUserByEmail(email);
      return user != null;
    } catch (e) {
      return false;
    }
  }
}
