import { createEvents, EventAttributes } from 'ics';
import { useStore } from '../store';

export const useCalendar = () => {
    const { identity, energyTime, microHabits, currentHabitIndex } = useStore();

    const downloadCalendarFile = () => {
        if (!energyTime) {
            alert("Please set an Energy Time in settings first.");
            return;
        }

        // Parse the Energy Time (e.g. "08:30")
        const [hour, minute] = energyTime.split(':').map(Number);

        // Get current Habit
        const currentHabit = microHabits[currentHabitIndex] || "Bounce Habit";

        // Create the Event Object
        const event: EventAttributes = {
            start: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate(), hour, minute],
            duration: { minutes: 15 }, // Time boxing logic
            title: `🏀 Bounce: ${identity}`,
            description: `Your Daily Micro-Habit: ${currentHabit}\n\nRemember: Consistency > Intensity.`,
            url: 'https://bounce-app.com', // Link back to PWA
            // Recurring Rule: Daily
            recurrenceRule: 'FREQ=DAILY',
            status: 'CONFIRMED',
            busyStatus: 'FREE', // Don't block work calendars, just a reminder
            alarms: [
                { action: 'display', description: 'Bounce Time', trigger: { minutes: 0, before: true } }
            ]
        };

        // Generate the file
        createEvents([event], (error, value) => {
            if (error) {
                console.error(error);
                return;
            }

            // Trigger Download / Open in Native App
            const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'bounce-schedule.ics');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    return { downloadCalendarFile };
};