import type { Role } from "@/lib/roles";
import type { NotificationTopics } from "@/lib/types";


type RoleToNotificationTopicsMap = Record<Role, NotificationTopics>;
export const defaultNotifcationTopics: NotificationTopics = ["aktiwiteit-broadcast","aktiwiteit-updates", "all"]
export const roleToNotificationTopicsMap: RoleToNotificationTopicsMap = {
  "ouer": ["divisie",...defaultNotifcationTopics],
  "spanoffisier":["divisie",...defaultNotifcationTopics],
  "verkenner":["divisie",...defaultNotifcationTopics],
  "pd":["divisie",...defaultNotifcationTopics],

  "logistiek":["offisier",...defaultNotifcationTopics],
  "kombuis":["offisier",...defaultNotifcationTopics],
  "wagstaan": ["nood","offisier",...defaultNotifcationTopics],
  "noodoffisier": ["nood","offisier",...defaultNotifcationTopics],
  "divisieoffisier": ["divisie","offisier",...defaultNotifcationTopics],
  "divisieleier": ["nood:divisie","divisie","offisier",...defaultNotifcationTopics],
  "kampraad": ["nood","offisier",...defaultNotifcationTopics],
  "kampleier": ["nood","offisier",...defaultNotifcationTopics],
  "admin": ["test","divisie","offisier",...defaultNotifcationTopics],
  "besoeker":defaultNotifcationTopics,
  "candidate":defaultNotifcationTopics,
  "default":defaultNotifcationTopics
};
