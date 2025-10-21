'use server';

import { createAdminClient, createSessionClient } from '../supabase';
import { cookies } from 'next/headers';
import { encryptId, extractCustomerIdFromUrl, parseStringify } from '../utils';
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from 'plaid';

import { plaidClient } from '@/lib/plaid';
import { revalidatePath } from 'next/cache';
import { addFundingSource, createDwollaCustomer } from './dwolla.actions';

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const client = await createAdminClient();
    
    const { data, error } = await client.from('users').select('*').eq('user_id', userId).single();

    if (error) throw error;
    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const client = await createAdminClient();
    
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const cookieStore = cookies();
    cookieStore.set('sb-session', JSON.stringify(data.session), {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    const user = await getUserInfo({ userId: data.user.id });

    return parseStringify(user);
  } catch (error) {
    console.error('Error', error);
  }
};

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;

  try {
    const client = await createAdminClient();

    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error creating user in authentication');

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: 'personal',
    });

    if (!dwollaCustomerUrl) throw new Error('Error creating Dwolla customer');

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const { data: dbData, error: dbError } = await client.from('users').insert([
      {
        user_id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        address_1: userData.address1,
        city: userData.city,
        state: userData.state,
        postal_code: userData.postalCode,
        date_of_birth: userData.dateOfBirth,
        ssn: userData.ssn,
        dwolla_customer_id: dwollaCustomerId,
        dwolla_customer_url: dwollaCustomerUrl,
      },
    ]).select().single();

    if (dbError) throw dbError;

    const { data: sessionData, error: sessionError } = await client.auth.admin.createSession(
      authData.user.id
    );

    if (sessionError) throw sessionError;

    const cookieStore = cookies();
    cookieStore.set('sb-session', JSON.stringify(sessionData.session), {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    return parseStringify(dbData);
  } catch (error) {
    console.error('Sign up error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

export async function getLoggedInUser() {
  try {
    const client = await createSessionClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error) throw error;
    if (!user) return null;

    const userInfo = await getUserInfo({ userId: user.id });
    return parseStringify(userInfo);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const client = await createSessionClient();
    const cookieStore = cookies();

    cookieStore.delete('sb-session');

    await client.auth.signOut();
  } catch (error) {
    return null;
  }
};

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.user_id || user.$id,
      },
      client_name: `${user.first_name || user.firstName} ${user.last_name || user.lastName}`,
      products: ['auth'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.log(error);
  }
};

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const client = await createAdminClient();

    const { data, error } = await client.from('banks').insert([
      {
        user_id: userId,
        bank_id: bankId,
        account_id: accountId,
        access_token: accessToken,
        funding_source_url: fundingSourceUrl,
        shareable_id: shareableId,
      },
    ]).select().single();

    if (error) throw error;
    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: 'dwolla' as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse = await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwolla_customer_id || user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    if (!fundingSourceUrl) throw Error;

    await createBankAccount({
      userId: user.user_id || user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });

    revalidatePath('/');

    return parseStringify({
      publicTokenExchange: 'complete',
    });
  } catch (error) {
    console.error('An error occurred while creating exchanging token:', error);
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const client = await createAdminClient();

    const { data, error } = await client.from('banks').select('*').eq('user_id', userId);

    if (error) throw error;
    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const client = await createAdminClient();

    const { data, error } = await client.from('banks').select('*').eq('id', documentId).single();

    if (error) throw error;
    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};

export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  try {
    const client = await createAdminClient();

    const { data, error, count } = await client
      .from('banks')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (count !== 1) return null;

    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};
