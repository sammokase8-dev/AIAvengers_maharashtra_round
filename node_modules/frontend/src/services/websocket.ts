import { io, Socket } from 'socket.io-client';
import { RealTimeJob } from '../types';

export type JobEventHandler = (job: RealTimeJob) => void;
export type ConnectionStatusHandler = (connected: boolean) => void;

const getSocketUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const apiUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';
  if (/^https?:\/\//.test(apiUrl)) {
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  return window.location.origin;
};

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners = new Set<JobEventHandler>();
  private statusListeners = new Set<ConnectionStatusHandler>();
  private userId = 'usr_demo_01';
  private isConnected = false;
  private readonly url = getSocketUrl();

  public connect(userId = 'usr_demo_01'): void {
    this.userId = userId;
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('join_user', this.userId);
        this.notifyConnectionStatus();
      }
      return;
    }

    this.socket = io(this.url, { autoConnect: true });
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.socket?.emit('join_user', this.userId);
      this.notifyConnectionStatus();
    });
    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.notifyConnectionStatus();
    });
    this.socket.on('job:update', (job: RealTimeJob) => this.notifyListeners(job));
  }

  public subscribe(handler: JobEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  public subscribeStatus(handler: ConnectionStatusHandler): () => void {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  private notifyListeners(job: RealTimeJob): void {
    this.listeners.forEach((listener) => listener(job));
  }

  private notifyConnectionStatus(): void {
    this.statusListeners.forEach((listener) => listener(this.isConnected));
  }

  public disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
    this.notifyConnectionStatus();
  }
}

export const wsClient = new WebSocketClient();
export default wsClient;
