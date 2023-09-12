export class CreatePricingPlanDto {
  billing: string;
  desc: string;
  duration?: string;
  name: string;
  price: number;
  currency: string;
  trialDay: number;
  style?: any;
  programs?: string[] = [];
  features?: string[] = [];
}
