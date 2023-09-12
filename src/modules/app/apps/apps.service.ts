import { BadRequestException, Injectable } from '@nestjs/common';
import { App } from '@prisma/client';
import * as moment from 'moment-timezone';
import DatabaseService from '../../../database/database.service';
import { CreateAppDto } from './dto/create-app.dto';
import { AppDataService } from "../../mobile/app_data/app-data.service";

@Injectable()
export class AppsService {
  constructor(
    private _dbService: DatabaseService,
    private appDataService: AppDataService
  ) { }

  async getAppByUserId(userId: string): Promise<App> {
    return await this._dbService.app.findFirst({
      where: { userId: userId },
      include: {
        form_styles: true,
      },
    });
  }

  async getAppByName(name: string): Promise<App> {
    return await this._dbService.app.findFirst({
      where: { appName: name },
    });
  }

  async getAppByFirebaseId(firebaseId: string): Promise<App> {
    return await this._dbService.app.findFirst({
      where: { firebase_app_id: firebaseId },
    });
  }

  async createApp(data: CreateAppDto): Promise<App> {
    const app = await this._dbService.app.findFirst({
      where: { userId: data.userId },
    });
    if (!app) {
      return this._dbService.app.create({
        data: {
          bussinessName: data.bussinessName,
          industryId: data.industryId,
          industryOther: data.industryOther,
          website: data.website,
          mgpCommission: data.mgpCommission,
          logo: data.logo,
          showLogo: data.showLogo,
          appName: data.appName,
          appIcon: data.appIcon,
          firebase_app_id: data.firebaseAppId,
          appBanner: data.appBanner,
          socialMedia: data.socialMedia,
          socialMediaHandler: data.socialMediaHandler,
          checklist: data.checklist,
          iosAppLink: data.iosAppLink,
          andriodAppLink: data.andriodAppLink,
          webAppLink: data.webAppLink,
          userId: data.userId,
        },
      });
    } else {
      throw new BadRequestException('This user already have an app');
    }
  }

  async updateApp(data: any): Promise<App> {
    const app = await this._dbService.app.findFirst({
      where: { userId: data.userId },
    });
    if (!app) {
      throw new BadRequestException('User app not found');
    }

    if (app.firebase_app_id != null) {
      const firestoreData = { ...data };
      if(data.logo) firestoreData.logoUrl = data.logo;
      if (data['appName'] != null) {
        firestoreData['name'] = data['appName'];
        firestoreData['slug'] = data['appName'].toLowerCase().replace(/[^a-zA-Z0-9]/g, "")
      }
      await this.appDataService.patchApp(app.firebase_app_id, firestoreData);
    }

    return await this._dbService.app.update({
      where: { id: app.id },
      data: {
        ...data,
        updated_at: moment().toDate(),
      },
    });
  }
}
