import { Injectable } from '@nestjs/common';
import { InjectStripe } from 'nestjs-stripe';
import { form_settings, form_styles } from '@prisma/client';
import Stripe from 'stripe';
import DatabaseService from '../../../database/database.service';
import { CreateFormSettingsDto } from './dto/create-form-settings.dto';
import { AppDataService } from "../../mobile/app_data/app-data.service";
import { CreateFormStylesDto } from './dto/create-form-styles.dto';
import { AppsService } from '../apps/apps.service';
@Injectable()
export class FormSettingsService {
  constructor(
    @InjectStripe() private readonly stripeClient: Stripe,
    private _dbService: DatabaseService,
    private platformAppService: AppsService,
    private appService: AppDataService,
  ) {}

  async findApp(id: string) {
    const data = await this._dbService.app.findFirst({
      where: {
        userId: id,
      },
    });

    const fbData = await this.appService.getAppById(data.firebase_app_id);
    data['logoUrl'] = fbData?.logoUrl;

    return data;
  }

  async findOne(id: string) {
    const data = await this._dbService.form_settings.findFirst({
      where: {
        identifier: id,
      },
      include: {
        products: true,
        prices: true,
        User: {
          include: {
            StripeConnect: true,
          },
        },
        App: {
          include: {
            form_styles: true,
          },
        },
      },
    });

    if (data) {
      const fbData = await this.appService.getAppById(data.App.firebase_app_id);
      data['logoUrl'] = fbData?.logoUrl;
      console.log(data['logoUrl']);

      if (data?.prices?.type === 'One Time') {
        const stripe_account: string = data.User?.StripeConnect?.stripeAccountId;
        const fee_amount =
          Math.ceil(data.prices.amount) *
          ((data.User?.mgp_commission ?? data?.App?.mgpCommission ?? 15) / 100);
        const options = {
          amount: data.prices.amount * 100,
          currency: data.prices.currency,
          application_fee_amount: fee_amount * 100,
        };
        data['payment_intent'] = await this.stripeClient.paymentIntents.create(
          options,
          {
            stripeAccount: stripe_account,
          },
        );
      }
      return data;
    } else {
      return this.findFree(id);
    }
  }

  async findFree(id: string) {
    const data = await this._dbService.freeSignup.findFirst({
      where: {
        identifier: id,
      },
      include: {
        user: true,
      },
    });

    const app = await this.platformAppService.getAppByUserId(data.userId);
    const fbData = await this.appService.getAppById(app.firebase_app_id);
    data['logoUrl'] = fbData?.logoUrl;
    // @ts-ignore
    data['form_styles'] = app.form_styles[0];
    data['App'] = app;
    return data;
  }

  async create(data: CreateFormSettingsDto) {
    return await this._dbService.form_settings.create({
      data: {
        user_id: data.user_id,
        product_id: data.product_id,
        price_id: data.price_id,
        app_id: data.app_id,
        identifier: data.identifier,
      },
    });
  }

  async createStyle(style: any, user_app: any) {
    const form = await this._dbService.form_styles.findFirst({
      where: {
        app_id: user_app.app,
      },
    });

    if (style.iosAppLink || style.androidAppLink || style.webAppLink) {
      await this._dbService.app.update({
        where: {
          id: user_app.app,
        },
        data: {
          iosAppLink: style.iosAppLink,
          andriodAppLink: style.androidAppLink,
          webAppLink: style.webAppLink,
        },
      });
    }

    let res: any;
    if (!form) {
      res = await this._dbService.form_styles.create({
        data: {
          style_object: {
            theme: style.theme,
            font: style.font,
            color: style.color,
            bg: style.bg,
            highlight: style.highlight,
          },
          analytics_object: {
            fb_pixel: style.pixel,
          },
          user_id: user_app.user,
          app_id: user_app.app,
        },
        include: {
          App: true,
        },
      });
    } else {
      res = await this._dbService.form_styles.update({
        where: {
          id: form.id,
        },
        data: {
          style_object: {
            theme: style.theme,
            font: style.font,
            color: style.color,
            bg: style.bg,
            highlight: style.highlight,
          },
          analytics_object: {
            fb_pixel: style.pixel,
          },
        },
      });
    }

    return res;
  }

  async findStyle(app: string) {
    return await this._dbService.form_styles.findFirst({
      where: {
        app_id: app,
      },
      include: {
        App: true,
      },
    });
  }

  async findWhereProduct(productId: string) {
    return await this._dbService.form_settings.findFirst({
      where: {
        product_id: productId,
      },
    });
  }

  async findWhereHash(identifier: string) {
    return await this._dbService.form_settings.findFirst({
      where: {
        identifier: identifier,
      },
    });
  }

  async findAllWhere(productIds: string[]) {
    const forms = await this._dbService.form_settings.findMany({
      where: {
        product_id: {
          in: productIds,
        },
      },
      include: {
        products: true,
      },
    });

    return forms;
  }
}
