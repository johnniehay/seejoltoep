import { RoleList } from "@/lib/roles";
import { auth } from "@/auth";
import { getRoleFromUser, roleOverrides } from "@/lib/get-role";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const OverrideRoleSelect: React.FC<{
    role: string | null,
    realRole: string | null,
  }> = ({ role, realRole }) => {
  async function onChangeRoleOverride(value:string|null) {
    "use server"
    // const [value,_] = chg
    const session = await auth()
    if (!session || !session.user || !session.user.id || getRoleFromUser(session.user,true) !== "admin"){
      return {failed:"Unauthorized"}
    }
    console.log("roleOverride",value)
    if (!value) { //check in roleslist
      return {failed:"Invalid role"}
    }
    roleOverrides[session.user.id]=value
    return {success: {roleOverride:value}}
  }
  return (<>
    {realRole==="admin" && ( <div className="flex flex-row items-center pl-4">
      <span className="text-xs">Override Role</span>
      {/*<Select data={RoleList} onChange={onChangeRoleOverride} defaultValue={userData.role}/>*/}
      <Select onValueChange={onChangeRoleOverride} defaultValue={role ?? undefined}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={role ?? undefined} />
        </SelectTrigger>
        <SelectContent>
          {RoleList.map((value) => {
            return (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>)}
  </>)
}
