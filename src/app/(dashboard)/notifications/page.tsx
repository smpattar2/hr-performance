import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Bell,
  Target,
  ClipboardCheck,
  MessageSquare,
  UserPlus,
  Info,
} from "lucide-react";
import { NotificationActions } from "./notification-actions";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "OKR_UPDATE":
      case "OKR_CREATED":
        return <Target className="w-5 h-5 text-blue-500" />;
      case "REVIEW_STATUS":
      case "REVIEW_ASSIGNED":
        return <ClipboardCheck className="w-5 h-5 text-amber-500" />;
      case "FEEDBACK_REQUEST":
      case "FEEDBACK_RECEIVED":
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case "NOMINATION":
        return <UserPlus className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notifications
          </h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && <NotificationActions />}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {notifications.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">
              You&apos;ll see updates about OKRs, reviews, and feedback here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`px-6 py-4 flex items-start gap-4 transition-colors ${
                  !notif.read ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`text-sm ${
                          !notif.read
                            ? "font-semibold text-slate-800"
                            : "font-medium text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.read && (
                    <div className="mt-1">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
