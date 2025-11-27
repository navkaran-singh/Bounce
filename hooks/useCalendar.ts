import { useStore } from '../store';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { usePlatform } from './usePlatform';

export const useCalendar = () => {
    const { identity, energyTime, microHabits, currentHabitIndex } = useStore();
    const { isNative } = usePlatform();

    // Helper: Format date for ICS standard (YYYYMMDDTHHmmssZ)
    const formatICSDate = (date: Date) => {
        if (isNaN(date.getTime())) throw new Error("Invalid Date generated");
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const downloadCalendarFile = async () => {
        // 1. INTELLIGENT SOURCE SELECTION
        // We check both sources. We prefer the one that actually looks like a time (00:00).

        const storeTime = energyTime;
        const localTime = localStorage.getItem('bounce_reminder');

        // Regex to check if string contains numbers (e.g. "09:00" or "9:00")
        const isValidTime = (t: string | null) => t && /\d/.test(t);

        let finalTime = '';

        if (isValidTime(localTime)) {
            finalTime = localTime!; // Prefer the one you just edited in Settings
        } else if (isValidTime(storeTime)) {
            finalTime = storeTime;
        }

        // 2. DEBUG ALERT (Tell us exactly what we found)
        // alert(`DEBUG: Using time: "${finalTime}"`); 

        if (!finalTime) {
            alert("⚠️ No valid time found. Please set a time in Settings > Daily Check-in.");
            return;
        }

        try {
            // 3. ROBUST PARSING (Handle 12h and 24h)
            // This regex finds the first two numbers in the string
            const match = finalTime.match(/(\d{1,2}):(\d{2})/);

            if (!match) {
                throw new Error(`Could not parse time format: "${finalTime}"`);
            }

            let hour = parseInt(match[1]);
            const minute = parseInt(match[2]);

            // Handle AM/PM if present in string
            if (finalTime.toLowerCase().includes('pm') && hour < 12) hour += 12;
            if (finalTime.toLowerCase().includes('am') && hour === 12) hour = 0;

            // 4. Create Date
            const startDate = new Date();
            startDate.setHours(hour, minute, 0, 0);

            // Safety: If time passed today, just use today (calendars handle past events fine)

            const currentHabit = microHabits[currentHabitIndex] || "Bounce Habit";
            const cleanIdentity = identity || "Bounce User";

            // 5. Construct ICS Content
            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Bounce//Habit Tracker//EN',
                'BEGIN:VEVENT',
                `UID:${Date.now()}@bounce.app`,
                `DTSTAMP:${formatICSDate(new Date())}`,
                `DTSTART:${formatICSDate(startDate)}`,
                `RRULE:FREQ=DAILY`,
                `SUMMARY:🏀 Bounce: ${cleanIdentity}`,
                `DESCRIPTION:Micro-Habit: ${currentHabit}`,
                'DURATION:PT15M',
                'BEGIN:VALARM',
                'TRIGGER:-PT0M',
                'ACTION:DISPLAY',
                'DESCRIPTION:Bounce Time',
                'END:VALARM',
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');

            if (isNative) {
                // 📱 NATIVE: Write & Share
                try {
                    const fileName = 'bounce-invite.ics';

                    await Filesystem.writeFile({
                        path: fileName,
                        data: icsContent,
                        directory: Directory.Cache,
                        encoding: Encoding.UTF8,
                    });

                    const uriResult = await Filesystem.getUri({
                        directory: Directory.Cache,
                        path: fileName,
                    });

                    await Share.share({
                        title: 'Add to Calendar',
                        text: 'Add your Bounce habit to your calendar.',
                        files: [uriResult.uri],
                        dialogTitle: 'Add to Calendar',
                    });

                } catch (e: any) {
                    alert(`❌ Share Error: ${e.message}`);
                }
            } else {
                // 💻 WEB: Download
                const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'bounce-schedule.ics');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (e: any) {
            alert(`❌ Error: ${e.message}`);
        }
    };

    return { downloadCalendarFile };
};