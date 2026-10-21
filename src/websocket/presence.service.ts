import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PresenceService {
  private sockets = new Map<string, Set<string>>();
  private offlineTimers = new Map<string, NodeJS.Timeout>();

  // true return kare agar user abhi-abhi online hua
  add(userId: string, socketId: string): boolean {
    // reconnect hua to pending offline timer cancel
    const timer = this.offlineTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.offlineTimers.delete(userId);
    }

    const set = this.sockets.get(userId) ?? new Set<string>();
    const wasOffline = set.size === 0;
    set.add(socketId);
    this.sockets.set(userId, set);
    return wasOffline;
  }
  // true sirf tab jab aakhri socket gaya. Matlab user ke baaki devices/tabs bhi band ho chuke hain. Tabhi offline process shuru karna hai, warna return.
  remove(userid: string, socketid: string): boolean {
    const set = this.sockets.get(userid);
    if (!set) return false;
    set.delete(socketid);
    if (set.size === 0) {
      this.sockets.delete(userid);
      return true;
    }
    return false;
  }

  isOnline(userid: string): boolean {
    return this.sockets.has(userid);
  }

  // grace period ke baad offline ka kaam chalao (agar user tab tak wapas nahi aaya)
  scheduleOffline(userId: string, cb: () => Promise<void>, delay = 5000) {
    this.cancelOffline(userId); // purana timer overwrite na ho, leak na ho
    const t = setTimeout(async () => {
      this.offlineTimers.delete(userId);
      await cb();
    }, delay);
    this.offlineTimers.set(userId, t);
  }

  cancelOffline(userId: string) {
    const t = this.offlineTimers.get(userId);
    if (t) {
      clearTimeout(t);
      this.offlineTimers.delete(userId);
    }
  }
}
