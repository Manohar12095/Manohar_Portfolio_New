const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:AAmanohar1.60@db.sqbrczfojykfhfugbisr.supabase.co:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL');

  const sql = `
CREATE OR REPLACE FUNCTION public.create_or_update_admin_user(
  new_email TEXT,
  new_password TEXT,
  new_role TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid;
  v_encrypted_pw text;
  v_existing_id uuid;
BEGIN
  new_email := lower(trim(new_email));
  v_encrypted_pw := crypt(new_password, gen_salt('bf'));
  
  SELECT id INTO v_existing_id FROM auth.users WHERE lower(email) = new_email;
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_existing_id;
    
    v_user_id := v_existing_id;
  ELSE
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      new_email,
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('email', new_email),
      now(),
      now()
    );
    
    -- In auth.identities, email is a generated column from identity_data->>'email', so omit it from column list!
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', new_email, 'email_verified', true),
      'email',
      new_email,
      now(),
      now(),
      now()
    );
  END IF;
  
  INSERT INTO public.admin_roles (user_id, email, role, updated_at)
  VALUES (v_user_id, new_email, new_role, now())
  ON CONFLICT (email)
  DO UPDATE SET role = EXCLUDED.role, user_id = EXCLUDED.user_id, updated_at = now();
  
  RETURN json_build_object('success', true, 'user_id', v_user_id, 'email', new_email, 'role', new_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_or_update_admin_user(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
`;

  await client.query(sql);
  console.log('Successfully recreated public.create_or_update_admin_user without email in identities');

  await client.end();
}

main().catch(console.error);
