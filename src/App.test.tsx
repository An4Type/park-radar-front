import { render } from '@testing-library/react';
import App from './App';

vi.mock('@/features/map/components/MapHost', () => ({
  MapHost: () => <div data-testid="map" />,
}));

test('renders the home screen', async () => {
  const { findByText } = render(<App />);
  expect(await findByText('Where to?')).toBeInTheDocument();
});
