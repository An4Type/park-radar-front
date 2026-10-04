import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import { supportsWebGL2 } from '../lib/webgl';
import { MapCanvas } from './MapCanvas';

const LeafletMap = lazy(() => import('../fallback/LeafletMap'));

class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function MapHost() {
  const [webgl] = useState(supportsWebGL2);
  const fallback = (
    <Suspense fallback={<div className="pr-map-host" />}>
      <LeafletMap />
    </Suspense>
  );

  if (!webgl) return fallback;
  return <WebGLBoundary fallback={fallback}>{<MapCanvas />}</WebGLBoundary>;
}
