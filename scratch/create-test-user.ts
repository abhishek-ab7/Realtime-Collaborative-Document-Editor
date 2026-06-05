import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://trjloubazxygxfhxbtey.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  const email = 'testsprite@example.com';
  const password = 'TestPassword123!';

  console.log(`Creating/Ensuring user ${email} exists in Supabase...`);

  // Get all users
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.users.find((u) => u.email === email);
  if (user) {
    console.log(`User found (ID: ${user.id}). Resetting/Updating password to: ${password}`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Sprite',
      },
    });
    if (updateError) {
      console.error('Error updating user password:', updateError);
    } else {
      console.log('User password updated successfully.');
    }
  } else {
    console.log('User not found. Creating user...');
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Sprite',
      },
    });
    if (createError) {
      console.error('Error creating user:', createError);
    } else {
      console.log('User created successfully:', createData.user?.id);
    }
  }
}

run();
