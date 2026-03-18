import type { Role } from "@/lib/roles";
import type { NotificationTopics } from "@/lib/types";


type RoleToNotificationTopicsMap = Record<Role, NotificationTopics>;
export const defaultNotifcationTopics: NotificationTopics = ["aktiwiteit-broadcast","aktiwiteit-updates","kamp:inligting", "all"]
export const kamperNotifcationTopics: NotificationTopics = ["aktiwiteit-broadcast","aktiwiteit-updates","kamp:inligting", "kamp", "groep", "all"]
export const roleToNotificationTopicsMap: RoleToNotificationTopicsMap = {
  "ouer": [...defaultNotifcationTopics],
  "offisier":["divisie",...kamperNotifcationTopics],
  "verkenner":["divisie",...kamperNotifcationTopics],
  "pd":["divisie",...kamperNotifcationTopics],

  "logistiek":["offisier",...kamperNotifcationTopics],
  "kombuis":["offisier",...kamperNotifcationTopics],
  "wagstaan": ["nood","offisier",...kamperNotifcationTopics],
  "noodoffisier": ["nood","offisier",...kamperNotifcationTopics],
  "divisieoffisier": ["divisie","offisier",...kamperNotifcationTopics],
  "divisieleier": ["nood:divisie","divisie","offisier",...kamperNotifcationTopics],
  "kampraad": ["test","nood","offisier",...kamperNotifcationTopics],
  "kampleier": ["test","nood","offisier",...kamperNotifcationTopics],
  "admin": ["test","nood","divisie","offisier",...kamperNotifcationTopics],
  "besoeker":defaultNotifcationTopics,
  "kanidaat-jeuglid":defaultNotifcationTopics,
  "kanidaat-offisier":defaultNotifcationTopics,
  "default":defaultNotifcationTopics
};
