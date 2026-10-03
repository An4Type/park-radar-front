import { heatWeight } from './geojson';
import { HEAT_ALPHA_STOPS } from './layers';

describe('heat map', () => {
  it('gives full and closed lots no weight, so they stay transparent', () => {
    expect(heatWeight({ free: 0, active: true })).toBe(0);
    expect(heatWeight({ free: 40, active: false })).toBe(0);
  });

  it('grows with free spaces and saturates', () => {
    const w = [1, 10, 100, 1000].map((free) => heatWeight({ free, active: true }));
    expect(w[0]).toBeGreaterThan(0);
    expect(w[1]).toBeGreaterThan(w[0]);
    expect(w[2]).toBe(1);
    expect(w[3]).toBe(1);
  });

  it('uses one hue whose opacity only ever increases with density', () => {
    expect(HEAT_ALPHA_STOPS[0]).toEqual([0, 0]);
    for (let i = 1; i < HEAT_ALPHA_STOPS.length; i++) {
      expect(HEAT_ALPHA_STOPS[i][0]).toBeGreaterThan(HEAT_ALPHA_STOPS[i - 1][0]);
      expect(HEAT_ALPHA_STOPS[i][1]).toBeGreaterThan(HEAT_ALPHA_STOPS[i - 1][1]);
    }
  });
});
