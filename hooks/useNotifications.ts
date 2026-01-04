import { LocalNotifications } from '@capacitor/local-notifications';
import { usePlatform } from './usePlatform';

export const useNotifications = () => {
    const { isNative, isPWA } = usePlatform();

    const requestPermission = async (): Promise<boolean> => {
        // Native app - use Capacitor LocalNotifications
        if (isNative) {
            // Create Channel (REQUIRED for Android 8+)
            await LocalNotifications.createChannel({
                id: 'bounce_reminders',
                name: 'Daily Check-ins',
                description: 'Reminders to check your energy',
                importance: 5,
                visibility: 1,
                vibration: true,
            });

            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        }

        // PWA/Web - use Web Notification API
        if ('Notification' in window) {
            // Check if already granted
            if (Notification.permission === 'granted') {
                return true;
            }

            // Check if denied (can't re-ask)
            if (Notification.permission === 'denied') {
                return false;
            }

            // Request permission
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        // Notifications not supported
        return false;
    };

    const scheduleReminder = async (hour: number, minute: number) => {
        if (isNative) {
            // Native: Use Capacitor
            await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: "Bounce Check-in",
                        body: "Feeling drained? Tap to activate Low Battery Mode.",
                        id: 1,
                        channelId: 'bounce_reminders',
                        schedule: {
                            on: { hour, minute },
                            allowWhileIdle: true
                        },
                    }
                ]
            });
        } else if (isPWA && 'Notification' in window && Notification.permission === 'granted') {
            // PWA: Store the time and use service worker for scheduling
            // For now, store in localStorage - a service worker can pick this up
            localStorage.setItem('bounce_reminder_time', `${hour}:${minute}`);

            // Show a confirmation notification
            new Notification("Bounce Reminder Set", {
                body: `We'll remind you at ${hour}:${minute.toString().padStart(2, '0')}`,
                icon: '/pwa-192x192.png',
                tag: 'bounce-reminder-confirmation'
            });
        }
    };

    const clearReminders = async () => {
        if (isNative) {
            await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        } else {
            localStorage.removeItem('bounce_reminder_time');
        }
    };

    return { requestPermission, scheduleReminder, clearReminders };
};
