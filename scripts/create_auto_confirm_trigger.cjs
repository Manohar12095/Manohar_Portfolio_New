const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('Creating auto-confirm trigger on auth.users...');

  await client.query(`
    CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
      NEW.confirmed_at = COALESCE(NEW.confirmed_at, now());
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS tr_auto_confirm_new_users ON auth.users;
    CREATE TRIGGER tr_auto_confirm_new_users
    BEFORE INSERT OR UPDATE OF encrypted_password, email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_new_users();
  `);

  console.log('Auto-confirm trigger created!');
  await client.end();
}

main().catch(console.error);
