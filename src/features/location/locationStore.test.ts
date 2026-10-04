import { useLocationStore } from './locationStore';

const fix = { lat: 50.06, lng: 19.94, accuracy: 20, heading: null };

describe('locationStore', () => {
  beforeEach(() => useLocationStore.setState({ status: 'idle', blocked: false, attempt: 0, position: null, accuracy: null, heading: null }));

  it('keeps tracking when a later fix times out', () => {
    const { setFix, setError } = useLocationStore.getState();
    setFix(fix);
    setError('unavailable');
    expect(useLocationStore.getState().status).toBe('tracking');
  });

  it('records a browser block only for denials', () => {
    useLocationStore.getState().setError('denied', true);
    expect(useLocationStore.getState()).toMatchObject({ status: 'denied', blocked: true });
    useLocationStore.getState().setError('unavailable', true);
    expect(useLocationStore.getState()).toMatchObject({ status: 'unavailable', blocked: false });
  });

  it('retry starts a new attempt', () => {
    useLocationStore.getState().setError('denied');
    useLocationStore.getState().retry();
    expect(useLocationStore.getState()).toMatchObject({ attempt: 1, status: 'locating' });
  });
});
