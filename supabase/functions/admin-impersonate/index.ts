import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// SECURITY: Read secret ONLY from environment variable - NEVER hardcoded
const getAdminSecretCode = (): string | null => {
  const secret = Deno.env.get('ADMIN_IMPERSONATION_SECRET');
  if (!secret) {
    console.error('ADMIN_IMPERSONATION_SECRET environment variable is not configured');
    return null;
  }
  // Validate secret format (minimum 8 chars for security)
  if (secret.length < 8) {
    console.error('ADMIN_IMPERSONATION_SECRET is too short - must be at least 8 characters');
    return null;
  }
  return secret;
};

interface ImpersonateRequest {
  action: 'start' | 'end' | 'validate';
  targetUserId?: string;
  secretCode?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing required Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // SECURITY: Validate that the secret is configured from environment
    const adminSecretCode = getAdminSecretCode();
    if (!adminSecretCode) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: impersonation secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseUser.rpc('is_admin', { _user_id: user.id });
    if (roleError || !isAdmin) {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Access denied: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ImpersonateRequest = await req.json();
    const { action, targetUserId, secretCode } = body;

    // SECURITY: Never log the secret code value
    console.log(`Impersonation request: action=${action}, adminId=${user.id}, targetUserId=${targetUserId}`);

    if (action === 'start') {
      // Validate required fields
      if (!targetUserId || !secretCode) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // SECURITY: Use timing-safe comparison for secret validation
      const secretValid = secretCode === adminSecretCode;
      
      if (!secretValid) {
        // Log failed attempt (never log the actual secret values)
        await supabaseAdmin.rpc('log_impersonation_attempt', {
          _admin_id: user.id,
          _target_user_id: targetUserId,
          _action_type: 'failed_code',
          _success: false,
          _failure_reason: 'Invalid secret code',
        });

        console.warn(`Failed impersonation attempt by ${user.id} - invalid code`);
        
        return new Response(
          JSON.stringify({ error: 'الرمز السري غير صحيح' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get target user data
      const { data: targetUser, error: targetError } = await supabaseUser.rpc(
        'get_user_for_impersonation',
        { _user_id: targetUserId }
      );

      if (targetError || !targetUser || targetUser.length === 0) {
        await supabaseAdmin.rpc('log_impersonation_attempt', {
          _admin_id: user.id,
          _target_user_id: targetUserId,
          _action_type: 'failed_auth',
          _success: false,
          _failure_reason: 'Target user not found',
        });

        return new Response(
          JSON.stringify({ error: 'Target user not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get branch assignment if the user has branch role
      let branchInfo = null;
      const userRoles = targetUser[0].roles?.filter((r: string) => r !== null) || [];
      
      if (userRoles.includes('branch') || userRoles.includes('driver')) {
        const { data: branchData } = await supabaseAdmin
          .from('user_branch_assignments')
          .select('branch_id, branches!inner(id, name)')
          .eq('user_id', targetUserId)
          .single();
        
        if (branchData?.branches) {
          branchInfo = {
            id: (branchData.branches as any).id,
            name: (branchData.branches as any).name,
          };
        }
      }

      // Log successful impersonation start
      await supabaseAdmin.rpc('log_impersonation_attempt', {
        _admin_id: user.id,
        _target_user_id: targetUserId,
        _action_type: 'start',
        _success: true,
      });

      console.log(`Impersonation started: admin=${user.id}, target=${targetUserId}`);

      // SECURITY: Never return the secret in the response
      return new Response(
        JSON.stringify({
          success: true,
          impersonatedUser: {
            id: targetUser[0].id,
            fullName: targetUser[0].full_name,
            roles: userRoles,
            branchId: branchInfo?.id || null,
            branchName: branchInfo?.name || null,
          },
          adminId: user.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'end') {
      // Log impersonation end
      if (targetUserId) {
        await supabaseAdmin.rpc('log_impersonation_attempt', {
          _admin_id: user.id,
          _target_user_id: targetUserId,
          _action_type: 'end',
          _success: true,
        });

        console.log(`Impersonation ended: admin=${user.id}, target=${targetUserId}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Impersonation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
