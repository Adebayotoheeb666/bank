"use server";

import { Client } from "dwolla-v2";

const getEnvironment = (): "production" | "sandbox" => {
  const environment = process.env.DWOLLA_ENV as string;

  switch (environment) {
    case "sandbox":
      return "sandbox";
    case "production":
      return "production";
    default:
      throw new Error(
        "Dwolla environment should either be set to `sandbox` or `production`"
      );
  }
};

const dwollaClient = new Client({
  environment: getEnvironment(),
  key: process.env.DWOLLA_KEY as string,
  secret: process.env.DWOLLA_SECRET as string,
});

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
  options: CreateFundingSourceOptions
) => {
  try {
    return await dwollaClient
      .post(`customers/${options.customerId}/funding-sources`, {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      })
      .then((res) => res.headers.get("location"));
  } catch (err: any) {
    console.error("Creating a Funding Source Failed: ", err);

    if (err?.body?.message) {
      throw new Error(err.body.message);
    }

    if (err?.body?._embedded?.errors?.[0]?.message) {
      throw new Error(err.body._embedded.errors[0].message);
    }

    throw new Error("Failed to create funding source. Please try again.");
  }
};

export const createOnDemandAuthorization = async () => {
  try {
    const onDemandAuthorization = await dwollaClient.post(
      "on-demand-authorizations"
    );
    const authLink = onDemandAuthorization.body._links;
    return authLink;
  } catch (err) {
    console.error("Creating an On Demand Authorization Failed: ", err);
  }
};

export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
) => {
  try {
    return await dwollaClient
      .post("customers", newCustomer)
      .then((res) => res.headers.get("location"));
  } catch (err: any) {
    console.error("Creating a Dwolla Customer Failed: ", err);

    if (err?.body?._embedded?.errors && Array.isArray(err.body._embedded.errors)) {
      const errorMessages = err.body._embedded.errors
        .map((e: any) => {
          const field = e.path?.replace('/', '') || 'Unknown field';
          return `${field}: ${e.message}`;
        })
        .join(', ');
      throw new Error(`Validation error: ${errorMessages}`);
    }

    if (err?.body?.message) {
      throw new Error(err.body.message);
    }

    throw new Error("Failed to create Dwolla customer. Please check your information and try again.");
  }
};

export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {
    const requestBody = {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: "USD",
        value: amount,
      },
    };
    return await dwollaClient
      .post("transfers", requestBody)
      .then((res) => res.headers.get("location"));
  } catch (err: any) {
    console.error("Transfer fund failed: ", err);

    if (err?.body?.message) {
      throw new Error(err.body.message);
    }

    if (err?.body?._embedded?.errors?.[0]?.message) {
      throw new Error(err.body._embedded.errors[0].message);
    }

    throw new Error("Transfer failed. Please try again.");
  }
};

export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    // create dwolla auth link
    const dwollaAuthLinks = await createOnDemandAuthorization();

    // add funding source to the dwolla customer & get the funding source url
    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };
    return await createFundingSource(fundingSourceOptions);
  } catch (err: any) {
    console.error("Adding funding source failed: ", err);

    if (err?.message) {
      throw new Error(err.message);
    }

    throw new Error("Failed to add funding source. Please try again.");
  }
};
