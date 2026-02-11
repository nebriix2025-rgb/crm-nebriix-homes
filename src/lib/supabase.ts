import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file:\n' +
    'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helper functions
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, metadata?: { full_name?: string; role?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) return null;

  // Fetch user profile from users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Avatar upload function
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    // If bucket doesn't exist, provide helpful error
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error('Avatar storage is not configured. Please create an "avatars" bucket in Supabase Storage.');
    }
    throw uploadError;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
}

// Property file upload functions
export async function uploadPropertyFile(
  propertyId: string,
  file: File,
  fileType: 'image' | 'video' | 'document'
): Promise<{ url: string; path: string }> {
  const fileName = `${propertyId}/${fileType}s/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('property-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error('Property storage is not configured. Please create a "property-files" bucket in Supabase Storage.');
    }
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('property-files')
    .getPublicUrl(fileName);

  return { url: publicUrl, path: fileName };
}

export async function deletePropertyFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('property-files')
    .remove([filePath]);

  if (error) throw error;
}

// Deal file upload functions
export async function uploadDealFile(
  dealId: string,
  file: File
): Promise<{ url: string; path: string; name: string; size: number }> {
  const fileName = `${dealId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('deal-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error('Deal storage is not configured. Please create a "deal-files" bucket in Supabase Storage.');
    }
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('deal-files')
    .getPublicUrl(fileName);

  return {
    url: publicUrl,
    path: fileName,
    name: file.name,
    size: file.size
  };
}

export async function deleteDealFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('deal-files')
    .remove([filePath]);

  if (error) throw error;
}

// Admin function to create user with password
export async function createUserWithPassword(
  email: string,
  password: string,
  userData: { full_name: string; role: string; phone?: string }
) {
  // First create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userData,
  });

  if (authError) throw authError;

  // Then create the user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      full_name: userData.full_name,
      role: userData.role,
      phone: userData.phone,
      status: 'active',
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return profile;
}
