export class CreateSplitPaymentsDto {
  merchant_id: string;
  stripe_account_id: string;
  commission_id: string;
  split: number;
  email: string;
}
