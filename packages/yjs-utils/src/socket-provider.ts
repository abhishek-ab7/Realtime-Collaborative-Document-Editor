import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { io, type Socket } from 'socket.io-client';
import { Observable } from 'lib0/observable';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'synced';

export class SocketIOProvider extends Observable<string> {
  public readonly doc: Y.Doc;
  public readonly awareness: Awareness;
  public readonly documentId: string;

  private socket: Socket | null = null;
  private _status: ConnectionStatus = 'disconnected';
  private _synced = false;
  private serverUrl: string;
  private authToken: string;
  private _updateHandler: ((update: Uint8Array, origin: unknown) => void) | null = null;
  private _awarenessUpdateHandler:
    | ((changes: { added: number[]; updated: number[]; removed: number[] }, origin: string) => void)
    | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(
    serverUrl: string,
    documentId: string,
    doc: Y.Doc,
    options: {
      authToken: string;
      awareness?: Awareness;
      autoConnect?: boolean;
    },
  ) {
    super();
    this.serverUrl = serverUrl;
    this.documentId = documentId;
    this.doc = doc;
    this.authToken = options.authToken;
    this.awareness = options.awareness ?? new Awareness(doc);

    if (options.autoConnect !== false) {
      this.connect();
    }
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  get synced(): boolean {
    return this._synced;
  }

  connect(): void {
    if (this.socket?.connected) return;

    this._setStatus('connecting');

    this.socket = io(this.serverUrl, {
      auth: { token: this.authToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // ─── Socket Events ───
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this._joinRoom();
    });

    this.socket.on('disconnect', (_reason) => {
      this._setStatus('disconnected');
      this._synced = false;
    });

    this.socket.on('connect_error', (error) => {
      this._setStatus('disconnected');
      this.emit('connection-error', [error]);
    });

    // ─── Yjs Events from Server ───
    this.socket.on('yjs-update', (update: ArrayBuffer | Uint8Array) => {
      Y.applyUpdate(this.doc, new Uint8Array(update), 'remote');
    });

    this.socket.on('awareness-update', (update: ArrayBuffer | Uint8Array) => {
      applyAwarenessUpdate(this.awareness, new Uint8Array(update), 'remote');
    });

    this.socket.on('save-status', (status: 'saving' | 'saved' | 'error') => {
      this.emit('save-status', [status]);
    });

    // ─── User presence notifications ───
    this.socket.on(
      'user-joined',
      (user: { userId: string; name: string; avatarUrl: string | null }) => {
        this.emit('user-joined', [user]);
      },
    );

    this.socket.on('user-left', (user: { userId: string; name: string }) => {
      this.emit('user-left', [user]);
    });

    // ─── Listen for local doc changes → send to server ───
    this._updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin === 'remote') return; // Don't echo back remote updates
      this.socket?.emit('yjs-update', this.documentId, update);
    };
    this.doc.on('update', this._updateHandler);

    // ─── Listen for local awareness changes → send to server ───
    this._awarenessUpdateHandler = (
      _changes: { added: number[]; updated: number[]; removed: number[] },
      origin: string,
    ) => {
      if (origin === 'remote') return;
      const update = encodeAwarenessUpdate(this.awareness, [this.doc.clientID]);
      this.socket?.emit('awareness-update', this.documentId, update);
    };
    this.awareness.on('update', this._awarenessUpdateHandler);
  }

  private _joinRoom(): void {
    this._setStatus('syncing');

    this.socket?.emit(
      'join-room',
      this.documentId,
      (response: {
        success: boolean;
        error?: string;
        state?: ArrayBuffer | Uint8Array;
        users?: Array<{ userId: string; name: string; avatarUrl: string | null }>;
      }) => {
        if (!response.success) {
          this.emit('connection-error', [new Error(response.error || 'Failed to join room')]);
          return;
        }

        // Apply server state
        if (response.state) {
          Y.applyUpdate(this.doc, new Uint8Array(response.state), 'remote');
        }

        this._synced = true;
        this._setStatus('synced');
        this.emit('sync', [true]);

        // Emit initial users list
        if (response.users) {
          this.emit('users', [response.users]);
        }
      },
    );
  }

  private _setStatus(status: ConnectionStatus): void {
    this._status = status;
    this.emit('status', [status]);
  }

  /** Update auth token (e.g., after refresh) */
  updateToken(token: string): void {
    this.authToken = token;
    if (this.socket) {
      (this.socket as any).auth = { token };
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.emit('leave-room', this.documentId);
      this.socket.disconnect();
      this.socket = null;
    }

    if (this._updateHandler) {
      this.doc.off('update', this._updateHandler);
      this._updateHandler = null;
    }
    if (this._awarenessUpdateHandler) {
      this.awareness.off('update', this._awarenessUpdateHandler);
      this._awarenessUpdateHandler = null;
    }

    this._setStatus('disconnected');
    this._synced = false;
  }

  destroy(): void {
    this.disconnect();
    this.awareness.destroy();
    super.destroy();
  }
}
