export class UserCreationDto {
  readonly appId: string;
  readonly email: string;
  readonly stripeCustomerId?: string;
  readonly subscriptionId?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly password?: string;
  readonly isAllPlans?: boolean;
  readonly productList: string[] = [];
}
