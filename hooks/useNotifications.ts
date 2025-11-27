import { LocalNotifications } from '@capacitor/local-notifications';
import { usePlatform } from './usePlatform';

export const useNotifications = () => {
    const { isNative } = usePlatform();

    const requestPermission = async () => {
        if (!isNative) return false;

        // 1. Create Channel (REQUIRED for Android 8+)
        await LocalNotifications.createChannel({
            id: 'bounce_reminders',
            name: 'Daily Check-ins',
            description: 'Reminders to check your energy',
            importance: 5, // High importance (Heads Up)
            visibility: 1,
            vibration: true,
        });

        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    };

    const scheduleReminder = async (hour: number, minute: number) => {
        if (!isNative) return;

        // Cancel old
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

        // Schedule New
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "Bounce Check-in",
                    body: "Feeling drained? Tap to activate Low Battery Mode.",
                    id: 1,
                    // 👇 Use the Channel we created
                    channelId: 'bounce_reminders',
                    schedule: {
                        on: { hour, minute },
                        allowWhileIdle: true
                    },
                }
            ]
        });
    };

    const clearReminders = async () => {
        if (!isNative) return;
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    };

    return { requestPermission, scheduleReminder, clearReminders };
};