export type SupplierStatus = "pending" | "active" | "inactive" | "approved";
export type AccountType = "checking" | "savings" | "payment";

export interface SupplierAddressDto {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
}

export interface SupplierBankAccountDto {
  bankCode: string;
  agency: string;
  account: string;
  accountType: AccountType;
  pixKey?: string;
}

export interface CreateSupplierDto {
  corporateName: string;
  tradeName?: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address: SupplierAddressDto;
  bankAccount?: SupplierBankAccountDto;
}
