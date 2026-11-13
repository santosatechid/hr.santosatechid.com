"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/notifications/useNotifications";
import { cn } from "@/lib/shadcn/utils";

const timeFormat = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function NotificationBell() {
  const router = useRouter();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={
          unread > 0 ? `${unread} notifikasi belum terbaca` : "Notifikasi"
        }
        className="text-muted-foreground hover:bg-secondary hover:text-foreground relative flex size-8 items-center justify-center rounded-lg transition-colors"
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex min-w-3.5 items-center justify-center rounded-full bg-[#E5484D] px-1 text-[8px] font-extrabold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-[12px] font-extrabold">Notifikasi</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markRead.mutate(undefined)}
              disabled={markRead.isPending}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[10.5px] font-semibold"
            >
              <CheckCheck className="size-3" aria-hidden />
              Tandai semua
            </button>
          )}
        </div>

        <div className="max-h-[340px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-[11px]">
              Belum ada notifikasi.
            </p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.isRead) markRead.mutate(item.id);
                      if (item.link) router.push(item.link);
                    }}
                    className={cn(
                      "hover:bg-secondary flex w-full flex-col gap-0.5 border-b px-3 py-2.5 text-left last:border-b-0",
                      !item.isRead && "bg-[#F4F8FF]",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {!item.isRead && (
                        <span
                          aria-hidden
                          className="size-1.5 shrink-0 rounded-full bg-[#2F80ED]"
                        />
                      )}
                      <span className="text-[11.5px] font-bold">
                        {item.title}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-[10.5px] leading-[15px]">
                      {item.message}
                    </span>
                    <span className="text-muted-foreground/70 text-[9.5px] font-semibold">
                      {timeFormat.format(new Date(item.createdAt))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
