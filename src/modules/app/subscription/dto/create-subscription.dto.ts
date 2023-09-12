export class CreateSubscriptionDto {
  first_name: string;
  last_name: string;
  payment_method: string;
  identifier?: string;
  stripe_price_id: string;
  stripe_product_id: string;
  product_id: string;
  mgp_commission: number;
  currency: string;
  trial_day: number;
  seller_id: string;
  app_id: string;
  firebase_app_id: string;
  stripe_account_id: string;
  promotion_code?: string;
}
