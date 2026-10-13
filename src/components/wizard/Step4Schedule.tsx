import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../services/api';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  Bell,
  CheckCircle2,
  Zap,
  Globe,
  ArrowRight
} from 'lucide-react';

export const Step4Schedule: React.FC = () => {
  const {
    currentUser,
    selectedCompany,
    selectedRole,
    interviewType,
    difficulty,
    durationMinutes,
    language,
    scheduleMode,
    setScheduleMode,
    scheduledDate,
    setScheduledDate,
    scheduledSlot,
    setScheduledSlot,
    timezone,
    setTimezone,
    setWizardStep,
    setActiveSession,
    addToast
  } = useAppStore();

  const [isBookedConfirmed, setIsBookedConfirmed] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const availableSlots = [
    '09:30 - 10:00',
    '11:00 - 11:30',
    '14:00 - 14:30',
    '15:30 - 16:00',
    '17:00 - 17:30'
  ];

  const handleStartNow = async () => {
    try {
      setIsCreatingSession(true);
      const session = await api.createInterview({
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: selectedCompany?.id || 'google',
        companyName: selectedCompany?.name || 'Google',
        roleId: selectedRole?.id || 'sde-2',
        roleTitle: selectedRole?.title || 'SDE II',
        type: interviewType,
        difficulty,
        durationMinutes,
        language,
        status: 'lobby',
        scheduledAt: new Date().toISOString()
      });
      setActiveSession(session);
      addToast('success', 'Interview session created! Proceeding to device calibration.');
      setWizardStep(5);
    } catch (err: any) {
      addToast('error', 'Could not initialize session.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleScheduleConfirm = async () => {
    try {
      setIsCreatingSession(true);
      const session = await api.createInterview({
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: selectedCompany?.id || 'google',
        companyName: selectedCompany?.name || 'Google',
        roleId: selectedRole?.id || 'sde-2',
        roleTitle: selectedRole?.title || 'SDE II',
        type: interviewType,
        difficulty,
        durationMinutes,
        language,
        status: 'scheduled',
        scheduledAt: `${scheduledDate}T${scheduledSlot.split(' - ')[0]}:00Z`
      });
      setActiveSession(session);
      setIsBookedConfirmed(true);
      addToast('success', 'Interview scheduled! Calendar invite ready.');
    } catch (err) {
      addToast('error', 'Failed to schedule slot.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Generate .ics calendar file
  const handleDownloadIcs = () => {
    const startTimeStr = `${scheduledDate.replace(/-/g, '')}T${scheduledSlot.split(' - ')[0].replace(':', '')}00Z`;
    const endTimeStr = `${scheduledDate.replace(/-/g, '')}T${scheduledSlot.split(' - ')[1].replace(':', '')}00Z`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//InterviewIQ//AI Mock Interview Platform//EN',
      'BEGIN:VEVENT',
      `SUMMARY:InterviewIQ Mock Interview - ${selectedCompany?.name || 'Tech'} (${selectedRole?.title || 'Engineer'})`,
      `DESCRIPTION:AI Live Voice Mock Interview with real-time barge-in conversation and comprehensive 12-section performance evaluation.`,
      `DTSTART:${startTimeStr}`,
      `DTEND:${endTimeStr}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Your live AI mock interview begins in 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `interviewiq_${selectedCompany?.id || 'session'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Calendar .ics downloaded!');
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">Schedule Your Call</h2>
        <p className="text-sm text-text-secondary mt-1">
          Choose whether to take the mock interview immediately or reserve a calendar slot.
        </p>
      </div>

      {!isBookedConfirmed ? (
        <div className="space-y-6">
          {/* Choice: Start Now vs Schedule Later */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard
              interactive
              onClick={() => setScheduleMode('now')}
              className={`p-6 transition-all ${
                scheduleMode === 'now'
                  ? 'border-2 border-sage-400 bg-sage-500/20 ring-1 ring-sage-400/40 shadow-lg'
                  : 'border border-sage-300/15'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sage-500/20 text-sage-300 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-mint" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary">Start Live Call Now</h3>
                  <p className="text-xs text-text-muted">No waiting — calibrate mic and begin immediately</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Connect directly with the AI interviewer. Ensure you are in a quiet room with a working microphone.
              </p>
            </GlassCard>

            <GlassCard
              interactive
              onClick={() => setScheduleMode('later')}
              className={`p-6 transition-all ${
                scheduleMode === 'later'
                  ? 'border-2 border-sage-400 bg-sage-500/20 ring-1 ring-sage-400/40 shadow-lg'
                  : 'border border-sage-300/15'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-sage-500/20 text-sage-300 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary">Schedule for Later</h3>
                  <p className="text-xs text-text-muted">Add to Google/Outlook calendar + get reminders</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Pick a designated time slot. Automated notifications sent 24h, 1h, and 10 minutes prior to call.
              </p>
            </GlassCard>
          </div>

          {/* Schedule Later slot picker */}
          {scheduleMode === 'later' && (
            <GlassCard className="p-6 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sage-300/15">
                <span className="font-semibold text-sm text-text-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sage-400" />
                  Select Date & Time Window
                </span>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Timezone: <strong>{timezone}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full text-xs rounded-xl bg-sage-950/40 border border-sage-300/20 px-3.5 py-2.5 text-text-primary focus:outline-none focus:border-sage-400"
                  />
                </div>

                {/* Slots */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Available Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setScheduledSlot(slot)}
                        className={`px-3 py-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                          scheduledSlot === slot
                            ? 'bg-sage-500/25 border-sage-300/80 dark:border-sage-300/50 text-text-primary font-bold shadow-[0_2px_8px_rgba(40,55,35,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]'
                            : 'bg-white dark:bg-sage-950/40 border-sage-300/40 dark:border-sage-700/40 text-text-secondary hover:border-sage-400/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4">
            <GlassButton variant="ghost" size="sm" onClick={() => setWizardStep(3)}>
              ← Back to Role
            </GlassButton>

            {scheduleMode === 'now' ? (
              <GlassButton
                variant="primary"
                size="md"
                onClick={handleStartNow}
                loading={isCreatingSession}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Pre-Interview Lobby
              </GlassButton>
            ) : (
              <GlassButton
                variant="primary"
                size="md"
                onClick={handleScheduleConfirm}
                loading={isCreatingSession}
                icon={<CalendarIcon className="w-4 h-4" />}
              >
                Confirm Scheduled Slot
              </GlassButton>
            )}
          </div>
        </div>
      ) : (
        /* Confirmation Screen */
        <GlassCard className="p-8 space-y-6 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-status-success/20 text-status-success mx-auto flex items-center justify-center border border-status-success/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-text-primary">
              Your Mock Interview is Confirmed!
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Scheduled for <strong>{scheduledDate}</strong> at <strong>{scheduledSlot}</strong> ({timezone})
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-sage-950/35 border border-sage-300/15 text-xs text-left">
            <div>
              <span className="text-[10px] uppercase text-text-muted block">Company</span>
              <span className="font-semibold text-text-primary">{selectedCompany?.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-text-muted block">Role</span>
              <span className="font-semibold text-text-primary">{selectedRole?.title}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-text-muted block">Difficulty</span>
              <span className="font-semibold text-text-primary">{difficulty}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-text-muted block">Duration</span>
              <span className="font-semibold text-text-primary">{durationMinutes} min</span>
            </div>
          </div>

          {/* Reminders summary */}
          <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
            <Bell className="w-4 h-4 text-mint" />
            <span>Automated reminders scheduled: 24h, 1h, and 10 minutes before call</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <GlassButton
              variant="secondary"
              size="md"
              onClick={handleDownloadIcs}
              icon={<Download className="w-4 h-4" />}
            >
              Download .ICS Calendar File
            </GlassButton>

            <GlassButton
              variant="primary"
              size="md"
              onClick={() => setWizardStep(5)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Enter Pre-Interview Lobby Now
            </GlassButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
