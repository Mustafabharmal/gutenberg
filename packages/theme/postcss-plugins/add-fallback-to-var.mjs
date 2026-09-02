/**
 * Matches a bare `var(--wpds-*)` reference.
 */
const VAR_PATTERN = /var\(\s*(--wpds-[\w-]+)\s*\)/g;

/**
 * Matches a quoted CSS string, or a bare `var(--wpds-*)` reference.
 *
 * Strings are listed first so that `var()`-like text inside them (e.g.
 * `content: "var(--wpds-border-radius-sm)"`) is consumed as a string and left
 * alone, the way a CSS parser would treat it.
 */
const STRING_OR_VAR_PATTERN =
	/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|var\(\s*(--wpds-[\w-]+)\s*\)/g;

/**
 * Replace bare `var(--wpds-*)` references in a CSS value string with
 * `var(--wpds-*, <fallback>)` using the provided token fallback map.
 *
 * Existing fallbacks (i.e. `var()` calls that already contain a comma)
 * are left untouched, making the function safe to run multiple times
 * (idempotent).
 *
 * This is the generic, reusable implementation that takes the fallback
 * map as an argument. For the variant prebound with the package's
 * generated token fallback map, see `./ds-token-fallbacks.mjs`.
 *
 * @param {string}                 cssValue               A CSS declaration value.
 * @param {Record<string, string>} tokenFallbacks         Map of CSS variable names to their fallback expressions.
 * @param {Object}                 [options]              Options.
 * @param {boolean}                [options.escapeQuotes] When true, escape `"` and `'` in fallback values.
 *                                                        Use this when the input is JS/TS source so that
 *                                                        injected quotes don't break string literals. JS
 *                                                        will unescape them at parse time, so the browser's
 *                                                        CSS engine still sees the correct value.
 * @param {boolean}                [options.skipStrings]  When true (the default), quoted CSS strings are
 *                                                        left untouched, so `var()`-like text inside them
 *                                                        is not rewritten. Set to false when the input is
 *                                                        JS/TS source, where the quotes are JS syntax
 *                                                        rather than CSS string delimiters.
 * @return {string} The value with fallbacks injected.
 */
export function addFallbackToVar(
	cssValue,
	tokenFallbacks,
	{ escapeQuotes = false, skipStrings = true } = {}
) {
	return cssValue.replace(
		skipStrings ? STRING_OR_VAR_PATTERN : VAR_PATTERN,
		( match, tokenName ) => {
			// A quoted string matched rather than a `var()` reference.
			if ( tokenName === undefined ) {
				return match;
			}
			let fallback = tokenFallbacks[ tokenName ];
			if ( fallback === undefined ) {
				throw new Error(
					`Unknown design token: ${ tokenName }. ` +
						'This token is not in the design system. ' +
						'If this token was recently renamed, update all references to use the new name.'
				);
			}
			if ( escapeQuotes ) {
				fallback = fallback
					.replaceAll( '"', '\\"' )
					.replaceAll( "'", "\\'" );
			}
			return `var(${ tokenName }, ${ fallback })`;
		}
	);
}
