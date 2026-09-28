import { supabase } from './supabase'

export async function signIn(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured.') }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return { session: null, isAdmin: false }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { session: null, isAdmin: false }
  const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle()
  if (!data) return { session, isAdmin: false, profile: null, languages: [] }
  const [{ data: profile }, { data: languages }] = await Promise.all([
    supabase.from('admin_profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
    supabase.from('admin_languages').select('language_code').eq('user_id', session.user.id),
  ])
  return { session, isAdmin: true, profile, languages: languages?.map(({ language_code }) => language_code) || [] }
}

export async function saveAdminProfile(userId, profile, languageCodes) {
  const { error: profileError } = await supabase.from('admin_profiles').upsert({ ...profile, user_id: userId, onboarding_complete: true })
  if (profileError) return { error: profileError }
  await supabase.from('admin_languages').delete().eq('user_id', userId)
  return supabase.from('admin_languages').insert(languageCodes.map((language_code) => ({ user_id: userId, language_code })))
}

export async function listNotifications(userId) {
  return supabase.from('entry_notifications').select('*, entries(english)').eq('recipient_id', userId).order('created_at', { ascending: false })
}

export async function markNotificationRead(id) {
  return supabase.from('entry_notifications').update({ is_read: true }).eq('id', id)
}

export function subscribeToAuth(callback) {
  if (!supabase) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}