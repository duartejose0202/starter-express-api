export class AddProductDto {
    billing: string;
    desc: string;
    name: string;
    price: number;
    currency: string;
    customerId: string;
    accountId?: string;
    default_payment_method?: string;
    productId?: string;
}