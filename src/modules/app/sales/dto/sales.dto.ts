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

export class UpdateSalesCommissionDto {
  first_commission: FirstCommission;
  second_commission: SecondCommission;
  salesperson_id: string;
}
