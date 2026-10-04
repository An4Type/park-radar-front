import { useMapStore } from './mapStore';

describe('mapStore', () => {
  it('toggles each label kind independently', () => {
    const { setLabel } = useMapStore.getState();
    setLabel('ev', true);
    setLabel('free', false);
    expect(useMapStore.getState().labels).toEqual({ free: false, accessible: false, ev: true });
  });
});
