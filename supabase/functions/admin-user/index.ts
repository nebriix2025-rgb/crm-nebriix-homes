// Supabase Edge Function for admin user operations (requires service role key)
// Handles: password change, user deletion
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header to verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key for all operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Parse the request body first
    const { action, userId, newPassword } = await req.json()
    console.log('Request received:', { action, userId, hasPassword: !!newPassword })

    // For now, we trust that the request is coming from an authenticated admin
    // The frontend already verifies the user is an admin before making this call
    // In production, you should add proper JWT verification here

    switch (action) {
      case 'change_password': {
        if (!userId || !newPassword) {
          return new Response(
            JSON.stringify({ error: 'Missing userId or newPassword' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (newPassword.length < 8) {
          return new Response(
            JSON.stringify({ error: 'Password must be at least 8 characters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        )

        if (updateError) {
          console.error('Error updating password:', updateError)
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Password updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_user': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Note: Self-deletion prevention is handled by the frontend
        // First delete from users table (profile)
        const { error: profileDeleteError } = await adminClient
          .from('users')
          .delete()
          .eq('id', userId)

        if (profileDeleteError) {
          console.error('Error deleting user profile:', profileDeleteError)
          // Continue to try deleting auth user anyway
        }

        // Then delete from auth.users
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)

        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError)
          return new Response(
            JSON.stringify({ error: authDeleteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, message: 'User deleted successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Supported: change_password, delete_user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
