import { CanActivate, ExecutionContext, Inject, Logger, mixin, } from '@nestjs/common';
import { FirebaseApp } from "../../modules/firestore/firebase-app.service";

export const FirebaseAuthGuard = (role: UserRole) => {
  class FirebaseAuthGuardMixin implements CanActivate {
    constructor(@Inject(FirebaseApp) readonly firebaseApp: FirebaseApp) {}

    readonly logger = new Logger(FirebaseAuthGuard.name);

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();

      try {
        // Get and verify the bearer token
        const token = request.headers['authorization'];
        if (token == null || token == '') {
          this.logger.log('No auth token was provided');
          return false;
        } // No bearer token

        const appId = request.params?.appId;

        // decode bearer token
        const decodedToken = await this.firebaseApp.auth(appId ?? 'default').verifyIdToken(
          token.replace('Bearer ', ''),
        );

        const params = request.params;

        if (appId != null) {
          const userAppId = decodedToken['appId'];
          if (userAppId != params.appId) {
            this.logger.log(`appId ${userAppId} in token does not match appId ${params.appId} in request`);
            return false;
          }
        }

        const userRole = decodedToken['role'];
        request.user = decodedToken;

        switch (userRole.toLowerCase()) {
          case 'Admin'.toLowerCase():
            return true;
          case 'AppOwner'.toLowerCase():
            return role === 'AppOwner' || role === 'AppUser';
          default:
            return role === 'AppUser';
        }
      } catch (error) {
        this.logger.error(error);
        return false;
      }
    }
  }

  return mixin(FirebaseAuthGuardMixin);
};

type UserRole = 'Admin' | 'AppOwner' | 'AppUser';
