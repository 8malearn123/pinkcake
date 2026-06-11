import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create a Supabase client with the user's token to verify they're admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Check if the requesting user is an admin
    const { data: roles, error: rolesError } = await userClient.rpc('get_my_roles')
    if (rolesError) throw rolesError

    const isAdmin = roles?.includes('admin')
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح لك بإنشاء مستخدمين جدد' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the request body
    const { email, password, full_name, phone, roles: userRoles, branch_id } = await req.json()

    // Validate required fields
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'البريد الإلكتروني وكلمة المرور والاسم مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'صيغة البريد الإلكتروني غير صحيحة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate roles
    if (!userRoles || userRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'يجب تحديد دور واحد على الأقل' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Create the user
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        phone
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      
      // Handle specific errors
      if (createError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'هذا البريد الإلكتروني مسجل بالفعل' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      throw createError
    }

    const newUserId = userData.user?.id
    if (!newUserId) {
      throw new Error('Failed to get new user ID')
    }

    // Update the profile with phone number if provided
    if (phone) {
      await adminClient
        .from('profiles')
        .update({ phone, full_name })
        .eq('id', newUserId)
    }

    // Assign roles
    const roleInserts = userRoles.map((role: string) => ({
      user_id: newUserId,
      role
    }))

    const { error: rolesInsertError } = await adminClient
      .from('user_roles')
      .insert(roleInserts)

    if (rolesInsertError) {
      console.error('Error assigning roles:', rolesInsertError)
    }

    // If customer role and branch_id provided, create customer record
    if (userRoles.includes('customer')) {
      const { error: customerError } = await adminClient
        .from('customers')
        .insert({
          name: full_name,
          phone: phone || '',
          user_id: newUserId,
        })

      if (customerError) {
        console.error('Error creating customer record:', customerError)
      }
    }

    // If branch role and branch_id provided, assign to branch
    if (userRoles.includes('branch') && branch_id) {
      const { error: branchError } = await adminClient
        .from('user_branch_assignments')
        .insert({
          user_id: newUserId,
          branch_id: branch_id,
        })

      if (branchError) {
        console.error('Error assigning branch:', branchError)
      }
    }

    // If driver role and branch_id provided, assign to branch (optional)
    if (userRoles.includes('driver') && branch_id) {
      const { error: driverBranchError } = await adminClient
        .from('user_branch_assignments')
        .insert({
          user_id: newUserId,
          branch_id: branch_id,
        })

      if (driverBranchError) {
        console.error('Error assigning driver to branch:', driverBranchError)
      }
    }

    console.log('User created successfully:', newUserId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم إنشاء المستخدم بنجاح',
        user_id: newUserId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
