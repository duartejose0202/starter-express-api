import { Prisma } from '@prisma/client';
import Stripe from 'stripe';

type FirstCommission = {
  amount?: number;
  percentage?: number;
  time: number;
  time_type: string;
};

type SecondCommission = {
  amount?: number;
  percentage?: number;
  time: number;
  time_type: string;
};

interface PlatformSubscription {
  commission_id: string;
  salesperson_stripe_id: string;
  platform_sub: string;
  currency: string;
  txn: Stripe.Subscription;
  first_commission: FirstCommission | Prisma.JsonValue;
  second_commission: SecondCommission | Prisma.JsonValue;
  subscription_created: Date;
  trial: boolean;
}

export class PlatformSubscriptionCreatedEvent {
  constructor(public readonly subscriptionEvent: PlatformSubscription) {}
}
