// export const VolunteerPermissions = ["view:divisie:details:basic","view:volunteer", "view:schedule:robotgame", "view:schedule:judgingroom","view:users:basic"] as const

export const NonPublicPermissions = ["view:nonpublic"] as const

// export const BaseDivisiePermissions = [...NonPublicPermissions] as const
// export const CoachPermissions = [...NonPublicPermissions] as const
// export const AllDivisiePermissions = [...BaseDivisiePermissions,...CoachPermissions] as const

export const PagesPermissions = ["create:pages","update:pages","remove:pages","create:media","all:forms"] as const
export const UpdateManagementPermissions = ["create:update","update:update","remove:update"] as const
export const AktiwiteitManagementPermissions = ["create:aktiwiteit","update:aktiwiteit","remove:aktiwiteit"] as const
export const LocationManagementPermissions = ["create:location","update:location","remove:location"] as const
export const InklokManagementPermissions = ["create:inklok","update:inklok","remove:inklok", "view:inklok"] as const
export const LedeManagementPermissions = ["create:lede", "update:lede", "remove:lede", "view:lede", "import:lede", "export:lede"] as const
export const DivisieManagementPermissions = ["create:divisie", "update:divisie", "remove:divisie", "view:divisie", "view:divisie:details"] as const
export const WinkelManagementPermissions = ["admin:winkel"] as const

// export const MCPermissions = ["view:queuing:status", ...VolunteerPermissions] as const
// export const TechnicalPermissions = ["view:queuing:status", "view:checkin", "view:judging", "view:scoring",...VolunteerPermissions]
// export const QueuerPermissions = ["view:queuing:status", "checkin:robotgame","checkin:judgingroom", "checkin:queuing", ...VolunteerPermissions]
// export const ScoreKeeperPermissions = ["view:score:resubmit", "view:scoring", ...QueuerPermissions, ...VolunteerPermissions]
// export const RefereePermissions = ["view:schedule:robotgame", "checkin:robotgame","view:score:submissions", "view:scoring", "view:score:resubmit", ...VolunteerPermissions] as const
// export const JudgePermissions = ["view:schedule:judgingroom", "checkin:judgingroom", "view:judging", ...VolunteerPermissions] as const
// export const JudgeAdvisorPermissions = [...JudgePermissions, "view:judgingroom:status", "update:judgingroom:judges", ...VolunteerPermissions] as const
// export const FieldManagerPermissions = [ "update:location", ...RefereePermissions, ...QueuerPermissions, ...VolunteerPermissions] as const
// export const DivisieAssistPermissions = ["view:divisie:details", "view:checkin", "view:lede", ...VolunteerPermissions] as const
// export const DivisieAdminAssistPermissions = ["view:users","update:divisie", "view:divisie:details", "view:checkin", ...DivisieAssistPermissions, ...LedeManagementPermissions, ...PagesPermissions, ...UpdateManagementPermissions, ...VolunteerPermissions] as const
// export const DivisieAdminPermissions = ["view:users", "update:user:role", "create:divisie", "update:location", ...DivisieAdminAssistPermissions] as const
// export const VolunteerAssistPermissions = ["view:users", "view:checkin", "view:lede", ...DivisieAssistPermissions, ...VolunteerPermissions] as const
// export const VolunteerAdminPermissions = ["update:user:role", "update:location", ...DivisieAdminAssistPermissions, ...VolunteerAssistPermissions, ...VolunteerPermissions] as const
// export const EventOrganizerPermissions = ["update:user:role", "create:divisie", "update:location", ...DivisieAdminAssistPermissions, ...QueuerPermissions , ...VolunteerPermissions] as const
// export const AdminPermissions = [...AdminOnlyPermissions, ...VolunteerAdminPermissions, ...JudgeAdvisorPermissions, ...FieldManagerPermissions, ...DivisieAdminPermissions] as const
// export const AllPermissions = [...VolunteerAdminPermissions, ...JudgeAdvisorPermissions, ...FieldManagerPermissions, ...DivisieAdminPermissions, ...AdminPermissions, ...AllDivisiePermissions, ...NonPublicPermissions] as const


export const AlgemeneOffisierPermission = ["view:offisier"] as const

export const OuerPermissions = [...NonPublicPermissions] as const
export const VerkennerPermissions = [...NonPublicPermissions] as const
export const PdPermissions = [...NonPublicPermissions] as const
export const KanidaatJeuglidPermissions = [...NonPublicPermissions] as const
export const KanidaatVolwassenePermissions = [...NonPublicPermissions] as const

export const OffisierPermissions = ["view:presensie",...AlgemeneOffisierPermission] as const
export const WagstaanPermissions = [...AlgemeneOffisierPermission] as const
export const NoodOffisierPermissions = ["view:lede",...AlgemeneOffisierPermission] as const
export const KombuisPermissions = [...AlgemeneOffisierPermission] as const
export const LogistiekPermissions = [...AlgemeneOffisierPermission] as const
export const DivisieOffisierPermissions = ["view:divisie:lede", "create:presensie", "update:presensie", "view:presensie",...AlgemeneOffisierPermission] as const
export const DivisieLeierPermissions = ["view:divisie:users","view:divisie:lede","update:divisie:lede","remove:presensie", ...AktiwiteitManagementPermissions, ...PagesPermissions,...DivisieOffisierPermissions] as const
export const KampRaadPermissions = ["view:users", "create:users", "update:users", "update:user:role", "remove:users", ...LedeManagementPermissions , ...DivisieLeierPermissions, ...AktiwiteitManagementPermissions,...LocationManagementPermissions,...InklokManagementPermissions,...WinkelManagementPermissions] as const
export const KampLeierPermissions = ["admin", ...DivisieManagementPermissions, ...KampRaadPermissions, ...DivisieLeierPermissions, ...LogistiekPermissions, ...KombuisPermissions, ...NoodOffisierPermissions] as const
export const AdminOnlyPermissions = ["admin", "view:users", "create:users", "update:users", "remove:users",...AktiwiteitManagementPermissions,...LocationManagementPermissions,...InklokManagementPermissions] as const
export const AdminPermissions = [...AdminOnlyPermissions, ...KampLeierPermissions] as const
export const AllPermissions = [...AdminPermissions, ...NonPublicPermissions] as const
export type Permission = typeof AllPermissions[number]
export type PermissionList = readonly Permission[]

export const OffisiereRolLys = [ "wagstaan","offisier","divisieoffisier","kombuis","logistiek","noodoffisier","divisieleier","kampraad","kampleier"] as const
export type OffisiereRol = typeof OffisiereRolLys[number]

export const RoleList = [
  "default",// default empty role
  // "candidate",// default setup pending confirmation
  "besoeker",
  "ouer",
  "kanidaat-jeuglid", "kanidaat-offisier",
  "pd", "verkenner",
  ...OffisiereRolLys, "admin" ] as const
// when changing the above also update roleToNotificationTopicsMap in components/push-notification-settings.tsx

export type Role = typeof RoleList[number]
export const rolePermissions: Record<Role, PermissionList> = {
  "ouer": OuerPermissions,
  "pd": PdPermissions,
  "verkenner": VerkennerPermissions,

  "kanidaat-jeuglid": KanidaatJeuglidPermissions,
  "kanidaat-offisier": KanidaatVolwassenePermissions,
  "offisier": OffisierPermissions,

  "wagstaan": WagstaanPermissions,
  "noodoffisier": NoodOffisierPermissions,
  "kombuis": KombuisPermissions,
  "logistiek": LogistiekPermissions,
  "divisieoffisier": DivisieOffisierPermissions,
  "divisieleier": DivisieLeierPermissions,
  "kampraad": KampRaadPermissions,
  "kampleier": KampLeierPermissions,
  "admin": AllPermissions,

  "besoeker": NonPublicPermissions,
  "default": NonPublicPermissions
} as const
