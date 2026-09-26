import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TwoDSky } from './TwoDSky'

type Props = { children: ReactNode; date?: string | null; golden?: boolean }
type State = { hasError: boolean }

/**
 * Hand-rolled error boundary for the 3D dome — a context loss or canvas
 * crash swaps in the 2D projection of the SAME starfield. Never a black void.
 * The selected night (date/golden) is forwarded to the fallback so the
 * crash path renders exactly like the WebGL-null path.
 */
export default class SkyErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[SkyErrorBoundary] 3D canvas failed, falling back to TwoDSky', error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <TwoDSky date={this.props.date} golden={this.props.golden} />
    }
    return this.props.children
  }
}