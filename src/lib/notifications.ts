import { prisma } from "./db";
import { sendSms } from "./sms";

type NotifyArgs = {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  sms?: boolean; // envoyer aussi un SMS
  smsMessage?: string;
};

/** Crée une notification in-app, et envoie un SMS si demandé et autorisé. */
export async function notify({ userId, type, title, body, link, sms, smsMessage }: NotifyArgs) {
  await prisma.notification.create({
    data: { userId, type, title, body, link },
  });

  if (sms) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.smsEnabled && user.phone) {
      await sendSms(user.phone, smsMessage || body);
    }
  }
}

/** Notifie plusieurs utilisateurs (ex: alertes de retour en stock). */
export async function notifyMany(userIds: string[], payload: Omit<NotifyArgs, "userId">) {
  for (const id of userIds) {
    await notify({ userId: id, ...payload });
  }
}
