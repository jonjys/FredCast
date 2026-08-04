import { CastAdapter, CastDevice, MediaItem, PlaybackCommand } from '../types';

/**
 * TODO(v1 real-device milestone): wire up react-native-google-cast (wraps the
 * Google Cast Android/iOS Sender SDK). This requires ejecting from Expo Go
 * to a custom dev client (native module), see PRODUCT_PLAN.md §8. Discovery
 * should call `GoogleCast.getCastState()` / session manager listeners and
 * map `CastDevice` from the SDK's `CastDevice` (id, friendlyName) — merge by
 * room using the same logic as CastEngine.dedupe().
 *
 * Left as a structural stub (not registered in CastEngine yet) so the
 * interface shape is proven out; swapping MockAdapter for this one requires
 * zero UI changes per the Epic 1 acceptance criteria.
 */
export class GoogleCastAdapter implements CastAdapter {
  readonly protocol = 'cast' as const;

  startDiscovery(_onChange: (devices: CastDevice[]) => void): () => void {
    throw new Error('GoogleCastAdapter requires a custom native dev client — not available in Expo Go.');
  }

  async connect(_deviceId: string): Promise<void> {
    throw new Error('Not implemented — see TODO at top of file.');
  }

  async sendMedia(_deviceId: string, _item: MediaItem): Promise<void> {
    throw new Error('Not implemented — see TODO at top of file.');
  }

  async control(_deviceId: string, _command: PlaybackCommand, _value?: number): Promise<void> {
    throw new Error('Not implemented — see TODO at top of file.');
  }

  async disconnect(_deviceId: string): Promise<void> {
    throw new Error('Not implemented — see TODO at top of file.');
  }
}
