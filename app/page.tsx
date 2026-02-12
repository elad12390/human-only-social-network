import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import RegistrationForm from '@/components/RegistrationForm'

export default async function Home() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (session?.user?.id) {
    redirect('/home.php')
  }
  return <RegistrationForm />
}
