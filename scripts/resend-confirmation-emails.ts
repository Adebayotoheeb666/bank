import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function resendConfirmationEmails() {
  console.log('🔄 Fetching users with unconfirmed emails...\n');

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      process.exit(1);
    }

    // Filter unconfirmed users
    const unconfirmedUsers = users.users.filter(
      (user) => !user.email_confirmed_at && user.email
    );

    console.log(`📊 Found ${unconfirmedUsers.length} users with unconfirmed emails\n`);

    if (unconfirmedUsers.length === 0) {
      console.log('✅ All users have confirmed their emails!');
      process.exit(0);
    }

    console.log('📧 Resending confirmation emails...\n');

    let resent = 0;
    let failed = 0;

    for (const user of unconfirmedUsers) {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email!,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        });

        if (error) {
          console.log(`❌ Failed: ${user.email} - ${error.message}`);
          failed++;
        } else {
          console.log(`✅ Sent: ${user.email}`);
          resent++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ Error: ${user.email} - ${errorMessage}`);
        failed++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📈 Summary:`);
    console.log(`   ✅ Resent: ${resent}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total: ${unconfirmedUsers.length}`);
    console.log(`${'='.repeat(50)}\n`);

    if (failed === 0) {
      console.log('🎉 All confirmation emails resent successfully!');
      process.exit(0);
    } else {
      console.log(`⚠️  ${failed} emails failed to resend. Please check the logs above.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the function
resendConfirmationEmails();
