import { ApiError } from "@/lib/api/errors";

/** Supported payment methods. */
export type PaymentMethod = "COD" | "BANK_TRANSFER" | "ONLINE";

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: "PKR";
  method: PaymentMethod;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface PaymentResult {
  status: "PENDING" | "PAID" | "FAILED";
  provider: string;
  transactionId?: string;
  instructions?: string;
  message: string;
}

export interface PaymentProvider {
  method: PaymentMethod;
  name: string;
  initiate(req: PaymentRequest): Promise<PaymentResult>;
}

/** Cash on Delivery — payment collected at the door. */
export const codProvider: PaymentProvider = {
  method: "COD",
  name: "Cash on Delivery",
  async initiate(): Promise<PaymentResult> {
    return {
      status: "PENDING",
      provider: "cod",
      message: "Pay in cash when your order arrives.",
    };
  },
};

/** Manual bank transfer — customer transfers to the brand's account. */
export const bankTransferProvider: PaymentProvider = {
  method: "BANK_TRANSFER",
  name: "Bank Transfer",
  async initiate(req: PaymentRequest): Promise<PaymentResult> {
    const bank = process.env.BANK_NAME?.trim();
    const title = process.env.BANK_ACCOUNT_TITLE?.trim();
    const number = process.env.BANK_ACCOUNT_NUMBER?.trim();
    const iban = process.env.BANK_IBAN?.trim();

    let instructions: string;
    if (bank && (number || iban)) {
      const lines = [
        `Please transfer PKR ${req.amount.toLocaleString("en-PK")} to:`,
        `Bank: ${bank}`,
      ];
      if (title) lines.push(`Account title: ${title}`);
      if (number) lines.push(`Account number: ${number}`);
      if (iban) lines.push(`IBAN: ${iban}`);
      lines.push(
        "Share your transfer receipt on WhatsApp or email so we can confirm your order."
      );
      instructions = lines.join("\n");
    } else {
      instructions =
        "Please contact us for bank transfer details and share your transfer receipt so we can confirm your order.";
    }

    return {
      status: "PENDING",
      provider: "bank_transfer",
      instructions,
      message: "Awaiting bank transfer confirmation.",
    };
  },
};

/** Online payments are not integrated yet. */
export const onlineProvider: PaymentProvider = {
  method: "ONLINE",
  name: "Online Payment",
  async initiate(): Promise<PaymentResult> {
    throw new ApiError(
      400,
      "Online payments are not available yet — please choose Cash on Delivery or Bank Transfer."
    );
  },
};

/** Resolve the provider for a payment method. */
export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case "COD":
      return codProvider;
    case "BANK_TRANSFER":
      return bankTransferProvider;
    case "ONLINE":
      return onlineProvider;
    default:
      throw new ApiError(400, `Unsupported payment method: ${method}`);
  }
}
