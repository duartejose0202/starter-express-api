import Stripe from 'stripe';

interface Subscription {
  merchant_id: string;
  merchant_stripe_id: string;
  platform_sub: string;
  currency: string;
  txn: Stripe.Invoice | Stripe.Charge;
  splits: any;
}

export class SubscriptionCreatedEvent {
  constructor(public readonly subscriptionEvent: Subscription) {}
}
