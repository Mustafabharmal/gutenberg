import { addFallbackToVar } from '../postcss-plugins/ds-token-fallbacks.mjs';

/**
 * Vite plugin that injects design-system token fallbacks into JS/TS files.
 *
 * Replaces bare `var(--wpds-*)` references in string literals with
 * `var(--wpds-*, <fallback>)` so components render correctly without
 * a ThemeProvider.
 *
 * @type {() => import('vite').Plugin}
 */
const plugin = () => ( {
	name: 'ds-token-fallbacks-js',
	transform( code, id ) {
		if ( ! /\.[mc]?[jt]sx?$/.test( id ) ) {
			return null;
		}
		if ( id.includes( 'node_modules' ) ) {
			return null;
		}
		if ( ! code.includes( '--wpds-' ) ) {
			return null;
		}
		// Sourcemap omitted: replacements are small, inline substitutions
		// that preserve line structure, so the debugging impact is negligible.
		return {
			code: addFallbackToVar( code, {
				escapeQuotes: true,
				// Quotes in JS source delimit JS strings, which is where CSS
				// values live. Skipping quoted text here would drop fallbacks
				// from ordinary CSS-in-JS such as
				// `gap: 'var(--wpds-dimension-gap-sm)'`, so the rare
				// `var()`-like text inside a CSS string nested in a JS string
				// is knowingly still rewritten. Telling the two apart would
				// require parsing the JS.
				skipStrings: false,
			} ),
			map: null,
		};
	},
} );

export default plugin;
