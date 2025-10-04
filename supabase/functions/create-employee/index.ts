import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the request is from an authenticated HR user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is HR or admin
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'hr' && userData.role !== 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only HR can create employees' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const {
      email,
      password,
      fullName,
      employeeId,
      phone,
      department,
      designation,
      role,
      dateOfJoining,
      organizationId
    } = await req.json()

    // Validate organization matches
    if (organizationId !== userData.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Cannot create employee in different organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth user with metadata (trigger will create profile automatically)
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        employee_id: employeeId,
        phone: phone || null,
        role: role || 'employee',
      }
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Wait a bit for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Update profile with additional fields that trigger doesn't handle
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        department: department || null,
        designation: designation || null,
        date_of_joining: dateOfJoining || new Date().toISOString().split('T')[0],
        organization_id: organizationId,
        is_active: true,
      })
      .eq('id', authData.user.id)
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert into user_role_cache
    await supabaseAdmin
      .from('user_role_cache')
      .insert({
        user_id: authData.user.id,
        role: role || 'employee',
      })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          authUser: authData.user,
          user: profileData,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
