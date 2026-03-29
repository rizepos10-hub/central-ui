import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { INotification, NotificationCategoryEnum } from 'app/shared/model/notification.model';
import { useNavigate } from 'react-router-dom';
import { getEntities, NOTIFICATION_PAGE_SIZE } from './notifications.reducer';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { Bell, Download, Loader2, RefreshCw, ShoppingBag, Wallet, WifiOff } from 'lucide-react';

/** Strip decorative emoji often embedded in API messages (e.g. status dots). */
function cleanNotificationText(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u2600-\u26FF]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function notificationIcon(category: INotification['category']) {
  const wrap = (node: React.ReactNode) => (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground shadow-inner">
      {node}
    </span>
  );
  switch (category) {
    case NotificationCategoryEnum.DOWNLOAD_FILE:
      return wrap(<Download className="h-4 w-4" aria-hidden />);
    case NotificationCategoryEnum.ON_ACCOUNT_DEBIT:
      return wrap(<Wallet className="h-4 w-4" aria-hidden />);
    case NotificationCategoryEnum.ORDER:
      return wrap(<ShoppingBag className="h-4 w-4" aria-hidden />);
    default:
      return wrap(<Bell className="h-4 w-4" aria-hidden />);
  }
}

const NotificationsCenter = ({
  showMenu,
  setShowMenu,
}: {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notifications: INotification[] = useAppSelector(state => state.notification.entities);
  const totalItems = useAppSelector(state => state.notification.totalItems ?? 0);
  const loading = useAppSelector(state => state.notification.loading);
  const loadingMore = useAppSelector(state => state.notification.loadingMore);
  const loadMoreFailed = useAppSelector(state => state.notification.loadMoreFailed);
  const [unreadCount, setUnreadCount] = useState<number>(parseInt(localStorage.getItem('notificationsCount'), 10) || 0);
  const listInnerRef = useRef<HTMLDivElement>(null);

  const hasMore = notifications.length > 0 && notifications.length < totalItems;

  const dispatchLoadMoreAppend = useCallback(() => {
    const nextPage = Math.ceil(notifications.length / NOTIFICATION_PAGE_SIZE);
    dispatch(
      getEntities({
        page: nextPage,
        size: NOTIFICATION_PAGE_SIZE,
        sort: 'sentAt,desc',
        append: true,
      })
    );
  }, [dispatch, notifications.length]);

  useEffect(() => {
    dispatch(
      getEntities({
        page: 0,
        size: NOTIFICATION_PAGE_SIZE,
        sort: 'sentAt,desc',
        append: false,
      })
    );
  }, [dispatch]);

  useEffect(() => {
    if (showMenu && listInnerRef.current) {
      listInnerRef.current.scrollTop = 0;
    }
  }, [showMenu]);

  const isAbsoluteHttpUrl = (url?: string) => !!url && /^(https?:)\/\//i.test(url);

  const handleNotificationClick = (notification: INotification) => {
    const isDownload = notification?.category === NotificationCategoryEnum.DOWNLOAD_FILE;
    const url = notification?.url;

    if (isDownload && url) {
      if (isAbsoluteHttpUrl(url)) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = url.split('/').pop() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = url.split('/').pop() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setShowMenu(false);
      return;
    }

    if (url) {
      if (isAbsoluteHttpUrl(url)) {
        window.open(url, '_blank', 'noopener');
      } else {
        navigate(url);
      }
    }
  };

  const onScroll = useCallback(() => {
    const el = listInnerRef.current;
    if (!el || !hasMore || loading || loadingMore || loadMoreFailed) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceToBottom > 120) {
      return;
    }
    dispatchLoadMoreAppend();
  }, [dispatchLoadMoreAppend, hasMore, loadMoreFailed, loading, loadingMore]);

  useEffect(() => {
    if (unreadCount > 0) {
      localStorage.removeItem('notificationsCount');
      const event = new CustomEvent('notificationsCountUpdated', { detail: 0 });
      window.dispatchEvent(event);
    }
  }, [unreadCount]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-muted/30 via-card to-card">
      <div className="shrink-0 space-y-1 px-5 pb-4 pt-2">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {notifications.length === 0 && !loading
                ? 'No alerts right now'
                : notifications.length === 0 && loading
                  ? 'Loading…'
                  : totalItems > notifications.length
                    ? `Showing ${notifications.length} of ${totalItems}`
                    : `${notifications.length} update${notifications.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <Separator className="opacity-60" />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2"
        ref={listInnerRef}
        onScroll={onScroll}
      >
        <div className="space-y-2 pb-4 pr-1" data-cy="notification-scroll">
          {notifications.length === 0 && !loading ? (
            <div className="mx-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <Bell className="h-6 w-6 opacity-70" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
              <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
                New account, order, and file alerts will show up here.
              </p>
            </div>
          ) : null}
          {notifications.length === 0 && loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            </div>
          ) : null}
          {notifications.length > 0
            ? notifications.map((notification, key) => {
              const isUnread = key < unreadCount;
              const body = cleanNotificationText(notification.message);
              return (
                <button
                  key={notification.id ?? key}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'flex w-full gap-3 rounded-2xl border border-transparent p-3 text-left transition-all',
                    'hover:border-border/80 hover:bg-muted/50 hover:shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isUnread && 'border-primary/20 bg-primary/[0.06] shadow-sm ring-1 ring-primary/10'
                  )}
                >
                  {notificationIcon(notification.category)}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm font-medium leading-snug text-foreground">{body || 'Notification'}</p>
                    <time
                      className="block text-xs font-normal text-muted-foreground tabular-nums"
                      dateTime={notification.sentAt}
                    >
                      {formatDateForDisplay(notification.sentAt)}
                    </time>
                  </div>
                </button>
              );
            })
            : null}
          {loadingMore ? (
            <div className="flex justify-center py-4 text-muted-foreground" data-cy="notification-loading-more">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              <span className="sr-only">Loading more notifications</span>
            </div>
          ) : null}
          {loadMoreFailed && hasMore ? (
            <div
              className="mx-1 rounded-2xl border border-destructive/25 bg-destructive/5 px-3 py-4 text-center"
              data-cy="notification-load-more-error"
            >
              <div className="mb-2 flex justify-center text-destructive">
                <WifiOff className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-xs font-medium text-foreground">Couldn&apos;t load more</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Check your connection. Scroll won&apos;t fetch again until you retry.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 h-8 w-full text-xs"
                disabled={loadingMore}
                onClick={() => dispatchLoadMoreAppend()}
                data-cy="notification-retry-load-more"
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden />
                )}
                Try again
              </Button>
            </div>
          ) : null}
          {notifications.length > 0 && !hasMore && !loadingMore ? (
            <p className="pb-2 text-center text-[11px] text-muted-foreground">End of list</p>
          ) : null}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="shrink-0 border-t border-border/60 bg-muted/20 px-4 py-3">
          <Button variant="ghost" size="sm" className="h-8 w-full text-xs text-muted-foreground" onClick={() => setShowMenu(false)}>
            Close panel
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationsCenter;
