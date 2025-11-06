interface FakeCallSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'random';
  timeRange: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  lastCall?: Date;
}

interface FakeCall {
  id: string;
  scheduledTime: Date;
  answered: boolean;
  redirectAction: 'mood_check' | 'breathing_exercise' | 'daily_tracking';
}

class FakeCallService {
  private readonly STORAGE_KEY = 'sereno-fake-call-settings';
  private readonly CALLS_KEY = 'sereno-fake-calls';
  private settings: FakeCallSettings;
  private scheduledCalls: FakeCall[] = [];

  constructor() {
    this.settings = this.loadSettings();
    this.scheduledCalls = this.loadScheduledCalls();
    this.initializeService();
  }

  private loadSettings(): FakeCallSettings {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default settings
    return {
      enabled: true,
      frequency: 'random',
      timeRange: {
        start: '09:00',
        end: '21:00'
      }
    };
  }

  private loadScheduledCalls(): FakeCall[] {
    const saved = localStorage.getItem(this.CALLS_KEY);
    if (saved) {
      return JSON.parse(saved).map((call: any) => ({
        ...call,
        scheduledTime: new Date(call.scheduledTime)
      }));
    }
    return [];
  }

  private saveSettings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
  }

  private saveScheduledCalls(): void {
    localStorage.setItem(this.CALLS_KEY, JSON.stringify(this.scheduledCalls));
  }

  private initializeService(): void {
    if (this.settings.enabled) {
      this.scheduleNextCall();
      this.startCallChecker();
    }
  }

  public getSettings(): FakeCallSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<FakeCallSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    if (this.settings.enabled) {
      this.scheduleNextCall();
    } else {
      this.clearScheduledCalls();
    }
  }

  private scheduleNextCall(): void {
    if (!this.settings.enabled) return;

    const now = new Date();
    let nextCallTime: Date;

    switch (this.settings.frequency) {
      case 'daily':
        nextCallTime = this.getNextDailyCall(now);
        break;
      case 'weekly':
        nextCallTime = this.getNextWeeklyCall(now);
        break;
      case 'random':
      default:
        nextCallTime = this.getNextRandomCall(now);
        break;
    }

    const newCall: FakeCall = {
      id: `call-${Date.now()}`,
      scheduledTime: nextCallTime,
      answered: false,
      redirectAction: this.getRandomRedirectAction()
    };

    this.scheduledCalls.push(newCall);
    this.saveScheduledCalls();
  }

  private getNextDailyCall(from: Date): Date {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    
    const [startHour, startMinute] = this.settings.timeRange.start.split(':').map(Number);
    const [endHour, endMinute] = this.settings.timeRange.end.split(':').map(Number);
    
    // Random time within the allowed range
    const randomHour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
    const randomMinute = Math.floor(Math.random() * 60);
    
    next.setHours(randomHour, randomMinute, 0, 0);
    return next;
  }

  private getNextWeeklyCall(from: Date): Date {
    const next = new Date(from);
    next.setDate(next.getDate() + 7);
    
    const [startHour, startMinute] = this.settings.timeRange.start.split(':').map(Number);
    const [endHour, endMinute] = this.settings.timeRange.end.split(':').map(Number);
    
    const randomHour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
    const randomMinute = Math.floor(Math.random() * 60);
    
    next.setHours(randomHour, randomMinute, 0, 0);
    return next;
  }

  private getNextRandomCall(from: Date): Date {
    const next = new Date(from);
    
    // Random between 1-3 days from now
    const daysToAdd = Math.floor(Math.random() * 3) + 1;
    next.setDate(next.getDate() + daysToAdd);
    
    const [startHour, startMinute] = this.settings.timeRange.start.split(':').map(Number);
    const [endHour, endMinute] = this.settings.timeRange.end.split(':').map(Number);
    
    const randomHour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
    const randomMinute = Math.floor(Math.random() * 60);
    
    next.setHours(randomHour, randomMinute, 0, 0);
    return next;
  }

  private getRandomRedirectAction(): 'mood_check' | 'breathing_exercise' | 'daily_tracking' {
    const actions: ('mood_check' | 'breathing_exercise' | 'daily_tracking')[] = [
      'mood_check',
      'breathing_exercise',
      'daily_tracking'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  private startCallChecker(): void {
    // Check every minute for scheduled calls
    setInterval(() => {
      this.checkForScheduledCalls();
    }, 60000);
  }

  private checkForScheduledCalls(): void {
    const now = new Date();
    const pendingCalls = this.scheduledCalls.filter(
      call => !call.answered && call.scheduledTime <= now
    );

    if (pendingCalls.length > 0) {
      const call = pendingCalls[0];
      this.triggerFakeCall(call);
    }
  }

  private triggerFakeCall(call: FakeCall): void {
    // Mark call as triggered
    call.answered = true;
    this.saveScheduledCalls();

    // Update last call time
    this.settings.lastCall = new Date();
    this.saveSettings();

    // Trigger the fake call UI
    this.showFakeCallInterface(call);

    // Schedule next call
    this.scheduleNextCall();
  }

  private showFakeCallInterface(call: FakeCall): void {
    // Create a custom event to trigger the fake call interface
    const event = new CustomEvent('fakeCallTriggered', {
      detail: {
        callId: call.id,
        redirectAction: call.redirectAction
      }
    });
    window.dispatchEvent(event);
  }

  public triggerManualCall(): void {
    const manualCall: FakeCall = {
      id: `manual-${Date.now()}`,
      scheduledTime: new Date(),
      answered: false,
      redirectAction: 'mood_check'
    };

    this.triggerFakeCall(manualCall);
  }

  public getNextScheduledCall(): Date | null {
    const upcomingCalls = this.scheduledCalls
      .filter(call => !call.answered && call.scheduledTime > new Date())
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    return upcomingCalls.length > 0 ? upcomingCalls[0].scheduledTime : null;
  }

  public clearScheduledCalls(): void {
    this.scheduledCalls = [];
    this.saveScheduledCalls();
  }

  public getCallHistory(): FakeCall[] {
    return this.scheduledCalls
      .filter(call => call.answered)
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
  }
}

export const fakeCallService = new FakeCallService();