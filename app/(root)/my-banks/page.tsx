import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import Link from 'next/link'
import React from 'react'

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    // Render a simple prompt directing users to sign in instead of throwing a redirect
    return (
      <section className="flex-center size-full">
        <div className="text-center">
          <h2 className="header-2">Please sign in</h2>
          <p className="mt-2">You need to be signed in to view your bank accounts.</p>
          <div className="mt-4">
            <Link href="/sign-in" className="btn">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const accounts = await getAccounts({
    userId: loggedIn.$id
  })

  return (
    <section className='flex'>
      <div className="my-banks">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activites."
        />

        <div className="space-y-4">
          <h2 className="header-2">
            Your cards
          </h2>
          <div className="flex flex-wrap gap-6">
            {accounts && accounts.data.map((a: Account) => (
              <BankCard
                key={a.appwriteItemId || a.id}
                account={a}
                userName={loggedIn?.firstName}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MyBanks
