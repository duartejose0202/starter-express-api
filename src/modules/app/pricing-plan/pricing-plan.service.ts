import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException, } from '@nestjs/common';
import { Roles } from '../../../constants';
import Stripe from 'stripe';
import DatabaseService from '../../../database/database.service';
import { genKey } from '../../../helpers/util.helper';
import { RolesService } from '../roles/roles.service';
import { StripeConnectService } from '../stripe-connect/stripe-connect.service';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { CreatePricingPlanDto } from './dto/create-pricing-plan.dto';
import { FormSettingsService } from '../form-settings/form-settings.service';
import { AppsService } from '../apps/apps.service';
import { RestrictionsService } from "../../mobile/restrictions/restrictions.service";
import { HomeElementsService } from "../../mobile/home_elements/home-elements.service";
import { ProgramsService } from "../../mobile/programs/programs.service";

interface NewProduct extends Stripe.Product {
  identifier?: string;
}

@Injectable()
export class PricingPlanService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private stripeService: StripeService,
    private stripeConnectService: StripeConnectService,
    private _dbService: DatabaseService,
    private formSettingsService: FormSettingsService,
    private appService: AppsService,
    private programsService: ProgramsService,
    private homeElementsService: HomeElementsService,
    @Inject(forwardRef(() => RestrictionsService))
    private restrictionsService: RestrictionsService,
  ) {
  }

  async findMany(ids: string[]) {
    return this._dbService.products.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async findAll(userId: string, accountId: string) {
    const allDbProducts = await this._dbService.products.findMany({
      where: {
        user_id: userId,
      },
    });

    const allStripeProducts: NewProduct[] = await this.stripeService.findAllProducts(accountId);
    const productIds = allDbProducts.map((product) => product.id);
    const forms = await this.formSettingsService.findAllWhere(productIds);
    const hashMap = {};
    forms.forEach((row) => {
      hashMap[row.products.stripe_product_id] = row.identifier;
    });

    const app = await this.appService.getAppByUserId(userId);
    const restrictions = await this.restrictionsService.getRestrictions(app.firebase_app_id);
    allStripeProducts.forEach((product) => {
      if (hashMap.hasOwnProperty(product.id)) {
        product['identifier'] = hashMap[product.id];
      }
      product['programs'] = [];
      product['features'] = [];
      const product_id = allDbProducts.find((e) => e.stripe_product_id === product.id)?.id;
      const matchingRestrictions = restrictions.filter((restriction) => restriction.products.indexOf(product_id) > -1);
      matchingRestrictions.forEach((restriction) => {
        if (restriction.type === 'program') {
          product['programs'] = product?.['programs'].concat([restriction.programId]);
        } else {
          product['features'] = product?.['features'].concat([restriction.featureType]);
        }
      });
    });

    return allStripeProducts.filter((product) => product.identifier);
  }

  async create(accountId: string, userId: string, data: CreatePricingPlanDto) {
    const res = await this.stripeService.createProduct(data, accountId);
    const app = await this.appService.getAppByUserId(userId);
    if (res?.id) {
      const product = await this._dbService.products.create({
        data: {
          user_id: userId,
          stripe_product_id: res.id,
          name: data.name,
          description: data.desc,
        },
      });

      if (product?.id) {
        const price = await this._dbService.prices.create({
          data: {
            product_id: product.id,
            stripe_price_id: res.pricingId,
            type: data.billing,
            amount: data.price,
            currency: data.currency,
            trial_day: data.trialDay ?? null,
            duration: data.duration ?? null,
            pricing_type: data.billing,
          },
        });

        for (let programId of data.programs) {
          await this.restrictionsService.createRestriction(app.firebase_app_id, {
            'type': 'program',
            'programId': programId,
            'products': [product.id]
          });
        }

        for (let featureType of data.features) {
          await this.restrictionsService.createRestriction(app.firebase_app_id, {
            'type': 'feature',
            'featureType': featureType,
            'products': [product.id]
          });
        }

        const fs = await this.formSettingsService.create({
          user_id: userId,
          product_id: product.id,
          price_id: price.id,
          app_id: app.id,
          identifier: await genKey([userId, product.id].toString()),
        });

        if (fs?.id) {
          return {
            ...product,
            identifier: fs.identifier,
          };
        }
        throw new Error('Something went wrong while saving to database');
      }

      return product;
    }
  }

  async findOne(id: string, userId: string) {
    const stripeConnect = await this.getStripeConnectInfo(userId);
    return this.stripeService.findProductById(
      id,
      stripeConnect.stripeConnectUrl,
    );
  }

  async update(accountId: string, data: any, userId: string) {
    const app = await this.appService.getAppByUserId(userId);
    const product = await this._dbService.products.findFirst({
      where: {
        stripe_product_id: data.id,
        user_id: userId
      }
    });
    const restrictions = await this.restrictionsService.getRestrictions(app.firebase_app_id);
    const existingRestrictions = restrictions.filter((restriction) => restriction.products.indexOf(product.id) > -1);
    for (let restriction of existingRestrictions) {
      console.log(restriction);
      if (restriction.type === 'program' && data.programs.indexOf(restriction.programId) === -1) {
        await this.restrictionsService.removeRestriction(app.firebase_app_id, {
          'type': 'program',
          'programId': restriction.programId,
          'products': [product.id]
        });
      } else if (restriction.type == 'feature' && data.features.indexOf(restriction.featureType) === -1) {
        await this.restrictionsService.removeRestriction(app.firebase_app_id, {
          'type': 'feature',
          'featureType': restriction.featureType,
          'products': [product.id]
        });
      }
    }
    for (let program of data.programs) {
      if (existingRestrictions.filter((restriction) => restriction.type === 'program' && restriction.programId === program).length === 0) {
        await this.restrictionsService.createRestriction(app.firebase_app_id, {
          'type': 'program',
          'programId': program,
          'products': [product.id]
        });
      }
    }
    for (let feature of data.features) {
      if (existingRestrictions.filter((restriction) => restriction.type === 'feature' && restriction.featureType === feature).length === 0) {
        await this.restrictionsService.createRestriction(app.firebase_app_id, {
          'type': 'feature',
          'featureType': feature,
          'products': [product.id]
        });
      }
    }
    console.log(data);
    console.log(product);
    await this._dbService.products.update(
      {
        where: {
          id: product.id,
        },
        data: {
          name: data.name,
          description: data.desc,
        }
      }
    );
    return this.stripeService.updateProduct({
      id: data['id'],
      name: data['name'],
      description: data['desc'],
    }, accountId);
  }

  async remove(id: string, accountId: string) {
    return await this.stripeService.removeProduct(id, accountId);
  }

  async getPrograms(appId: string) {
    let allPrograms = await this.programsService.getAllPrograms(appId);
    allPrograms = allPrograms.filter((program) => {
      return (
        program.tabs.indexOf("course") > -1 ||
        (program.tags?.indexOf("FITNESS") > -1 && program['tags'].indexOf("PROGRAM") > -1) ||
        program.restricted
      ) && program.customerId !== 'library';
    });
    return allPrograms.map((program) => {
      return {
        id: program.id,
        name: program.title,
        ...program,
      }
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  async getContents(user_id: string) {
    const app = await this.appService.getAppByUserId(user_id);
    const allPrograms = await this.getPrograms(app.firebase_app_id);
    const allFeatures = await this.homeElementsService.getHomeElements(app.firebase_app_id);
    return { programs: allPrograms, features: allFeatures };
  }

  private async getStripeConnectInfo(userId: string) {
    const userInfo = await this.usersService.getUserById(userId);
    if (!userInfo) {
      throw new NotFoundException('Unable to find user');
    }
    const role = await this.rolesService.getRoleById(userInfo.role_id);
    if (role.name !== Roles.APP_OWNER) {
      throw new BadRequestException(
        'Invalid role, only App Owners can access it',
      );
    }
    const stripeConnect = await this.stripeConnectService.getStripeConnection(
      userId,
    );
    if (!stripeConnect) {
      throw new NotFoundException('Unable to find connected stripe account');
    }
    return stripeConnect;
  }
}
