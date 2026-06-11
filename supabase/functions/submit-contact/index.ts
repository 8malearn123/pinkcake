import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Simple in-memory rate limiting (resets on function cold start)
// For production, consider using Redis or a database table
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5 // Max 5 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }
  
  record.count++
  return { allowed: true }
}

// Validation schemas
const SUBMISSION_TYPES = ['contact', 'custom_order', 'complaint'] as const
const MAX_NAME_LENGTH = 100
const MAX_PHONE_LENGTH = 15
const MAX_EMAIL_LENGTH = 255
const MAX_MESSAGE_LENGTH = 1000
const MIN_MESSAGE_LENGTH = 10
const MIN_NAME_LENGTH = 2
const MIN_PHONE_LENGTH = 9

function validateSubmission(data: Record<string, unknown>): { valid: boolean; error?: string } {
  const { submission_type, customer_name, phone, email, message, website } = data
  
  // Honeypot check - if website field is filled, it's a bot
  if (website && typeof website === 'string' && website.trim() !== '') {
    console.log('Bot detected via honeypot field')
    // Return success to fool the bot, but don't save
    return { valid: false, error: 'BOT_DETECTED' }
  }
  
  // Validate submission type
  if (!submission_type || !SUBMISSION_TYPES.includes(submission_type as typeof SUBMISSION_TYPES[number])) {
    return { valid: false, error: 'نوع الطلب غير صالح' }
  }
  
  // Validate customer name
  if (!customer_name || typeof customer_name !== 'string') {
    return { valid: false, error: 'الاسم مطلوب' }
  }
  const trimmedName = customer_name.trim()
  if (trimmedName.length < MIN_NAME_LENGTH) {
    return { valid: false, error: 'الاسم قصير جداً (حرفين على الأقل)' }
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return { valid: false, error: 'الاسم طويل جداً' }
  }
  
  // Validate phone
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'رقم الجوال مطلوب' }
  }
  const trimmedPhone = phone.trim()
  if (trimmedPhone.length < MIN_PHONE_LENGTH || trimmedPhone.length > MAX_PHONE_LENGTH) {
    return { valid: false, error: 'رقم الجوال غير صحيح' }
  }
  // Basic phone format validation
  if (!/^[0-9+\-\s()]+$/.test(trimmedPhone)) {
    return { valid: false, error: 'رقم الجوال يحتوي على أحرف غير صالحة' }
  }
  
  // Validate email (optional)
  if (email && typeof email === 'string' && email.trim() !== '') {
    const trimmedEmail = email.trim()
    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      return { valid: false, error: 'البريد الإلكتروني طويل جداً' }
    }
    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { valid: false, error: 'البريد الإلكتروني غير صحيح' }
    }
  }
  
  // Validate message
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'الرسالة مطلوبة' }
  }
  const trimmedMessage = message.trim()
  if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
    return { valid: false, error: 'الرسالة قصيرة جداً (10 أحرف على الأقل)' }
  }
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: 'الرسالة طويلة جداً' }
  }
  
  return { valid: true }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown'
    
    // Check rate limit
    const rateCheck = checkRateLimit(clientIP)
    if (!rateCheck.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck.retryAfter || 60)
          } 
        }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    
    const validation = validateSubmission(body)
    if (!validation.valid) {
      // If bot detected, return fake success
      if (validation.error === 'BOT_DETECTED') {
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if request has auth header for logged-in users
    let userId: string | null = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      // Create anon client to verify token
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const anonClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false }
      })
      
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await anonClient.auth.getUser(token)
      if (user) {
        userId = user.id
      }
    }

    // Insert the submission (sanitized data only) with optional user_id
    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        submission_type: body.submission_type,
        customer_name: body.customer_name.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        message: body.message.trim(),
        status: 'new',
        user_id: userId // Link to authenticated user if logged in
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: 'حدث خطأ أثناء إرسال النموذج' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Contact submission received from IP: ${clientIP}, type: ${body.submission_type}, user: ${userId || 'anonymous'}`)

    // Return success WITHOUT any stored data
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'حدث خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
