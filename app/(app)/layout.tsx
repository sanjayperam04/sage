import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GlobalNav from '@/components/GlobalNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <>
      <GlobalNav />
      <main>{children}</main>
    </>
  )
}
