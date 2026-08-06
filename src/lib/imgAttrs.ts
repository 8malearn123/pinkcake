/**
 * `fetchpriority`, spelled so it actually reaches the DOM on React 18.
 *
 * The trap: `@types/react` 18.3 declares a camelCase `fetchPriority` prop, so
 * writing `fetchPriority="high"` type-checks cleanly — but react-dom 18 has no
 * mapping for it (React 19 added one), logs "React does not recognize the
 * fetchPriority prop", and drops the attribute. The hint arrives as a console
 * warning in a test run, which is easy to never see; the cost is a silently
 * de-prioritised LCP image.
 *
 * Spreading the lowercase attribute is what works today: JSX spread attributes
 * skip excess-property checking, so this compiles AND renders
 * `fetchpriority="high"`. Delete this module when the app moves to React 19 and
 * use the prop directly.
 */
export function fetchPriority(value: 'high' | 'low' | 'auto') {
  return { fetchpriority: value };
}
