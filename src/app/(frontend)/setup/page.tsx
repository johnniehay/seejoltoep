import { redirect } from 'next/navigation'
import { SetupForm } from './SetupForm'
import { auth } from "@/auth";
import type { User } from "@/payload-types"

export default async function SetupPage() {
  const session  = await auth()

  if (!session || !(session.user)) {
    redirect('/admin/login') // Or your frontend login route
  }
  const fulluser = session.user as User
  const  { id, name, tipe, self_lid, gekoppelde_lede, candidate_self_lid_nommer, candidate_self_lid_dob, candidate_gekoppelde_lede } = fulluser
  const partialuser = { id, name, tipe, self_lid, gekoppelde_lede, candidate_self_lid_nommer, candidate_self_lid_dob, candidate_gekoppelde_lede }
  return (
    <div className="container mx-auto py-10">
      <SetupForm user={partialuser} />
    </div>
  )
}
