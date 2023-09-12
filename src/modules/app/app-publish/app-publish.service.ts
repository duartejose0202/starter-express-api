import { BadRequestException, Injectable } from '@nestjs/common';
import { SlackService } from 'nestjs-slack';
import * as moment from 'moment-timezone';
import DatabaseService from 'src/database/database.service';
import { AppleAccountRequestDto } from './dto/apple.account.request.dto';
import { AppleAppDetailRequestDto } from './dto/apple.app.detail.request.dto';
import { GoogleAccountRequestDto } from './dto/google.account.request.dto';
import { GoogleAppDetailRequestDto } from './dto/google.appdetail.request.dto';
import { decryptData, encryptData } from 'src/helpers/util.helper';
import axios from "axios";
import * as jwt from 'jsonwebtoken';
import { AppleAccount, AppleAppDetail } from "@prisma/client";

@Injectable()
export class AppPublishService {
  constructor(private dbService: DatabaseService, private slackService: SlackService) {
  }

  async createBundleId(userId: string, data: any) {
    const bundleId = data.bundleId;

    const user = await this.dbService.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('user not found');
    }

    const app = await this.dbService.app.findFirst({
      where: { userId },
    });

    if (!app) {
      throw new BadRequestException('app not found');
    }

    const account = await this.dbService.appleAccount.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException('account not found');
    }

    console.log("🏃 appStoreConnectAPIFromNode.js running 🏃‍")

    const apiKeyId = account.apiKeyId;
    const issuerId = account.apiKeyIssuerId;
    const privateKey = decryptData(account.apiKey);

    let now = Math.round((new Date()).getTime() / 1000); // Notice the /1000
    let nowPlus20 = now + 1199 // 1200 === 20 minutes

    let payload = {
      "iss": issuerId,
      "exp": nowPlus20,
      "aud": "appstoreconnect-v1"
    }

    let signOptions = {
      algorithm: "ES256",
      header: {
        "alg": "ES256",
        "kid": apiKeyId,
        "typ": "JWT"
      }
    };

    // @ts-ignore
    let token = jwt.sign(payload, privateKey, signOptions);

    try {
      const bundleIdResponse = await axios.post(
        `https://api.appstoreconnect.apple.com/v1/bundleIds`,
        {
          data: {
            attributes: {
              identifier: bundleId,
              name: app.appName,
              platform: 'IOS',
            },
            type: 'bundleIds',
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      return {
        data: bundleIdResponse.data,
        status: bundleIdResponse.status
      };
    } catch (error) {
      // console.log(error);
      throw new BadRequestException(error.response.data);
    }
  }

  async addCapability(userId: string, data: any) {
    const bundleId = data.bundleId;

    const user = await this.dbService.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('user not found');
    }

    const app = await this.dbService.app.findFirst({
      where: { userId },
    });

    if (!app) {
      throw new BadRequestException('app not found');
    }

    const account = await this.dbService.appleAccount.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException('account not found');
    }

    const apiKeyId = account.apiKeyId;
    const issuerId = account.apiKeyIssuerId;
    const privateKey = decryptData(account.apiKey);

    let now = Math.round((new Date()).getTime() / 1000); // Notice the /1000
    let nowPlus20 = now + 1199 // 1200 === 20 minutes

    let payload = {
      "iss": issuerId,
      "exp": nowPlus20,
      "aud": "appstoreconnect-v1"
    }

    let signOptions = {
      algorithm: "ES256",
      header: {
        "alg": "ES256",
        "kid": apiKeyId,
        "typ": "JWT"
      }
    };

    // @ts-ignore
    let token = jwt.sign(payload, privateKey, signOptions);

    console.log(bundleId);

    try {
      const pushNotisResponse = await axios.post(
        `https://api.appstoreconnect.apple.com/v1/bundleIdCapabilities`,
        {
          data: {
            attributes: {
              capabilityType: 'PUSH_NOTIFICATIONS',
            },
            relationships: {
              bundleId: {
                data: {
                  id: bundleId,
                  type: 'bundleIds'
                }
              }
            },
            type: 'bundleIdCapabilities'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      const iapResponse = await axios.post(
        `https://api.appstoreconnect.apple.com/v1/bundleIdCapabilities`,
        {
          data: {
            attributes: {
              capabilityType: 'IN_APP_PURCHASE',
            },
            relationships: {
              bundleId: {
                data: {
                  id: bundleId,
                  type: 'bundleIds'
                }
              }
            },
            type: 'bundleIdCapabilities'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      return {
        pushNotifications: pushNotisResponse.data,
        iap: iapResponse.data,
      };
    } catch (error) {
      // console.log(error);
      throw new BadRequestException(error.response.data);
    }
  }

  async getBundleIds(userId: string): Promise<any> {
    const user = await this.dbService.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('user not found');
    }

    const app = await this.dbService.app.findFirst({
      where: { userId },
    });

    if (!app) {
      throw new BadRequestException('app not found');
    }

    const account = await this.dbService.appleAccount.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException('account not found');
    }

    const apiKeyId = account.apiKeyId;
    const issuerId = account.apiKeyIssuerId;
    const privateKey = decryptData(account.apiKey);

    let now = Math.round((new Date()).getTime() / 1000); // Notice the /1000
    let nowPlus20 = now + 1199 // 1200 === 20 minutes

    let payload = {
      "iss": issuerId,
      "exp": nowPlus20,
      "aud": "appstoreconnect-v1"
    }

    let signOptions = {
      algorithm: "ES256",
      header: {
        "alg": "ES256",
        "kid": apiKeyId,
        "typ": "JWT"
      }
    };

    // @ts-ignore
    let token = jwt.sign(payload, privateKey, signOptions);

    try {
      const bundleIdResponse = await axios.get(
        `https://api.appstoreconnect.apple.com/v1/bundleIds`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        }
      )

      return {
        data: bundleIdResponse.data,
        status: bundleIdResponse.status
      };
    } catch (error) {
      // console.log(error);
      throw new BadRequestException(error.response.data);
    }
  }

  async getAllApps(): Promise<AppleAppDetail[]> {
    return this.dbService.appleAppDetail.findMany();
  }

  async upsertAppleAccount(data: AppleAccountRequestDto, userId: string): Promise<any> {
    const iosSecret = encryptData(data.iosSecret);
    const iapKey = encryptData(data.iapKey);
    const apiKey = encryptData(data.apiKey);

    const user = await this.dbService.user.findFirst({
      where: { id: userId },
    });

    this.slackService.sendText(`${user.name} (email: ${user.email}) Created a Apple Account: \nTeam ID: ${data.teamId}\nTeam Name: ${data.teamName}\nBundle ID: ${data.bundleId}\nIOS Key ID: ${data.iosKeyId}\nIAP Key ID: ${data.iapKeyId}\nAPI Key ID: ${data.apiKeyId}\nAPI Key Issuer ID: ${data.apiKeyIssuerId}`);

    return this.dbService.appleAccount.upsert({
      where: { userId: data.userId },
      update: {
        teamId: data.teamId,
        teamName: data.teamName,
        bundleId: data.bundleId,
        iosKeyId: data.iosKeyId,
        iosSecret,
        iapKeyId: data.iapKeyId,
        iapKey,
        apiKeyId: data.apiKeyId,
        apiKeyIssuerId: data.apiKeyIssuerId,
        apiKey,
        updated_at: moment().toDate(),
      },
      create: {
        teamId: data.teamId,
        teamName: data.teamName,
        bundleId: data.bundleId,
        iosKeyId: data.iosKeyId,
        iosSecret,
        iapKeyId: data.iapKeyId,
        iapKey,
        apiKeyId: data.apiKeyId,
        apiKeyIssuerId: data.apiKeyIssuerId,
        apiKey,
        userId: data.userId,
      },
    });
  }

  async findAppleAccount(userId: string): Promise<any> {
    const account = await this.dbService.appleAccount.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException('account not found');
    }

    return {
      ...account,
      iosSecret: decryptData(account.iosSecret),
      iapKey: decryptData(account.iapKey),
      apiKey: decryptData(account.apiKey),
    };
  }

  async upsertAppleAppDetail(data: AppleAppDetailRequestDto): Promise<any> {
    return this.dbService.appleAppDetail.upsert({
      where: { userId: data.userId },
      update: {
        name: data.name,
        iconFile: data.iconFile,
        iconUrl: data.iconUrl,
        description: data.description,
        promotion: data.promotion,
        subtitle: data.subtitle,
        category: data.category,
        keywords: data.keywords,
        supportUrl: data.supportUrl,
        marketingUrl: data.marketingUrl,
        privacyPolicyUrl: data.privacyPolicyUrl,
        screenshotFiles: data.screenshotFiles,
        screenshotUrls: data.screenshotUrls,
        status: data.status,
        updated_at: moment().toDate(),
      },
      create: {
        name: data.name,
        iconFile: data.iconFile,
        iconUrl: data.iconUrl,
        description: data.description,
        promotion: data.promotion,
        subtitle: data.subtitle,
        category: data.category,
        keywords: data.keywords,
        supportUrl: data.supportUrl,
        marketingUrl: data.marketingUrl,
        privacyPolicyUrl: data.privacyPolicyUrl,
        screenshotFiles: data.screenshotFiles,
        screenshotUrls: data.screenshotUrls,
        status: data.status,
        userId: data.userId,
      },
    });
  }

  async findAppleAppDetail(userId: string): Promise<any> {
    const appDetail = await this.dbService.appleAppDetail.findFirst({
      where: { userId },
    });

    if (!appDetail) {
      throw new BadRequestException('app detail not found');
    }

    return appDetail;
  }

  async upsertGoogleAccount(data: GoogleAccountRequestDto): Promise<any> {
    const jsonKey = encryptData(data.jsonKey);

    return this.dbService.googleAccount.upsert({
      where: { userId: data.userId },
      update: {
        gplk: data.gplk,
        jsonKey,
        updated_at: moment().toDate(),
      },
      create: {
        gplk: data.gplk,
        jsonKey,
        userId: data.userId,
      },
    });
  }

  async findGoogleAccount(userId: string): Promise<any> {
    const account = await this.dbService.googleAccount.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException('account not found');
    }

    return {
      ...account,
      jsonKey: decryptData(account.jsonKey),
    };
  }

  async upsertGoogleAppDetail(data: GoogleAppDetailRequestDto): Promise<any> {
    return this.dbService.googleAppDetail.upsert({
      where: { userId: data.userId },
      update: {
        name: data.name,
        iconFile: data.iconFile,
        iconUrl: data.iconUrl,
        description: data.description,
        shortDesc: data.shortDesc,
        featureImageFile: data.featureImageFile,
        featureImageUrl: data.featureImageUrl,
        category: data.category,
        keywords: data.keywords,
        supportUrl: data.supportUrl,
        marketingUrl: data.marketingUrl,
        privacyPolicyUrl: data.privacyPolicyUrl,
        screenshotFiles: data.screenshotFiles,
        screenshotUrls: data.screenshotUrls,
        updated_at: moment().toDate(),
      },
      create: {
        name: data.name,
        iconFile: data.iconFile,
        iconUrl: data.iconUrl,
        description: data.description,
        shortDesc: data.shortDesc,
        featureImageFile: data.featureImageFile,
        featureImageUrl: data.featureImageUrl,
        category: data.category,
        keywords: data.keywords,
        supportUrl: data.supportUrl,
        marketingUrl: data.marketingUrl,
        privacyPolicyUrl: data.privacyPolicyUrl,
        screenshotFiles: data.screenshotFiles,
        screenshotUrls: data.screenshotUrls,
        userId: data.userId,
      },
    });
  }

  async findGoogleAppDetail(userId: string): Promise<any> {
    const appDetail = await this.dbService.googleAppDetail.findFirst({
      where: { userId },
    });

    if (!appDetail) {
      throw new BadRequestException('app detail not found');
    }

    return appDetail;
  }
}
