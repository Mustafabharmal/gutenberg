import { addFallbackToVar } from '../add-fallback-to-var.mjs';

const mockFallbacks: Record< string, string > = {
	'--wpds-border-radius-sm': '2px',
	'--wpds-dimension-gap-sm': '8px',
	'--wpds-dimension-gap-lg': '16px',
	'--wpds-color-background-interactive-brand-strong':
		'var(--wp-admin-theme-color, #3858e9)',
	'--wpds-color-background-interactive-brand-strong-active':
		'color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 92%, black)',
	'--wpds-typography-font-family-body':
		'-apple-system, system-ui, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif',
	'--wpds-typography-font-family-mono':
		'"Menlo", "Consolas", monaco, monospace',
};

describe( 'addFallbackToVar', () => {
	it( 'injects a fallback for a known token', () => {
		expect(
			addFallbackToVar( 'var(--wpds-border-radius-sm)', mockFallbacks )
		).toBe( 'var(--wpds-border-radius-sm, 2px)' );
	} );

	it( 'throws for unknown tokens', () => {
		expect( () =>
			addFallbackToVar( 'var(--wpds-nonexistent-token)', mockFallbacks )
		).toThrow( /Unknown design token: --wpds-nonexistent-token/ );
	} );

	it( 'leaves non-wpds custom properties untouched', () => {
		expect(
			addFallbackToVar( 'var(--my-custom-prop)', mockFallbacks )
		).toBe( 'var(--my-custom-prop)' );
	} );

	it( 'does not double-wrap a var() that already has a fallback', () => {
		expect(
			addFallbackToVar(
				'var(--wpds-border-radius-sm, 999px)',
				mockFallbacks
			)
		).toBe( 'var(--wpds-border-radius-sm, 999px)' );
	} );

	it( 'leaves a var() with an empty fallback untouched', () => {
		expect(
			addFallbackToVar( 'var(--wpds-dimension-gap-sm,)', mockFallbacks )
		).toBe( 'var(--wpds-dimension-gap-sm,)' );
	} );

	it( 'handles multiple var() calls in one value', () => {
		const input =
			'var(--wpds-dimension-gap-sm) var(--wpds-dimension-gap-lg)';
		const result = addFallbackToVar( input, mockFallbacks );
		expect( result ).toBe(
			'var(--wpds-dimension-gap-sm, 8px) var(--wpds-dimension-gap-lg, 16px)'
		);
	} );

	it( 'injects a brand token fallback with var(--wp-admin-theme-color)', () => {
		const result = addFallbackToVar(
			'var(--wpds-color-background-interactive-brand-strong)',
			mockFallbacks
		);
		expect( result ).toBe(
			'var(--wpds-color-background-interactive-brand-strong, var(--wp-admin-theme-color, #3858e9))'
		);
	} );

	it( 'injects a color-mix fallback for a derived brand token', () => {
		const result = addFallbackToVar(
			'var(--wpds-color-background-interactive-brand-strong-active)',
			mockFallbacks
		);
		expect( result ).toBe(
			'var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 92%, black))'
		);
	} );

	it( 'returns the original string when there are no var() calls', () => {
		expect( addFallbackToVar( '10px solid red', mockFallbacks ) ).toBe(
			'10px solid red'
		);
	} );

	it( 'injects a fallback inside calc()', () => {
		expect(
			addFallbackToVar(
				'calc(var(--wpds-dimension-gap-sm) * 2)',
				mockFallbacks
			)
		).toBe( 'calc(var(--wpds-dimension-gap-sm, 8px) * 2)' );
	} );

	it( 'is idempotent — running twice gives the same result', () => {
		const input = 'var(--wpds-border-radius-sm)';
		const first = addFallbackToVar( input, mockFallbacks );
		const second = addFallbackToVar( first, mockFallbacks );
		expect( second ).toBe( first );
	} );

	describe( 'skipStrings', () => {
		it( 'leaves var()-like text inside a double-quoted string untouched', () => {
			expect(
				addFallbackToVar(
					'"var(--wpds-border-radius-sm)"',
					mockFallbacks
				)
			).toBe( '"var(--wpds-border-radius-sm)"' );
		} );

		it( 'leaves var()-like text inside a single-quoted string untouched', () => {
			expect(
				addFallbackToVar(
					"'var(--wpds-border-radius-sm)'",
					mockFallbacks
				)
			).toBe( "'var(--wpds-border-radius-sm)'" );
		} );

		it( 'still injects fallbacks outside of strings', () => {
			expect(
				addFallbackToVar(
					'"var(--wpds-dimension-gap-sm)" var(--wpds-dimension-gap-lg)',
					mockFallbacks
				)
			).toBe(
				'"var(--wpds-dimension-gap-sm)" var(--wpds-dimension-gap-lg, 16px)'
			);
		} );

		it( 'respects escaped quotes when skipping a string', () => {
			expect(
				addFallbackToVar(
					'"he said \\"var(--wpds-dimension-gap-sm)\\"" var(--wpds-dimension-gap-lg)',
					mockFallbacks
				)
			).toBe(
				'"he said \\"var(--wpds-dimension-gap-sm)\\"" var(--wpds-dimension-gap-lg, 16px)'
			);
		} );

		it( 'does not throw for an unknown token inside a string', () => {
			expect(
				addFallbackToVar( '"var(--wpds-nonexistent)"', mockFallbacks )
			).toBe( '"var(--wpds-nonexistent)"' );
		} );

		it( 'rewrites inside strings when disabled, for JS/TS source', () => {
			expect(
				addFallbackToVar(
					"const style = { borderRadius: 'var(--wpds-border-radius-sm)' };",
					mockFallbacks,
					{ skipStrings: false }
				)
			).toBe(
				"const style = { borderRadius: 'var(--wpds-border-radius-sm, 2px)' };"
			);
		} );
	} );

	describe( 'escapeQuotes', () => {
		it( 'does not escape quotes by default', () => {
			expect(
				addFallbackToVar(
					'var(--wpds-typography-font-family-body)',
					mockFallbacks
				)
			).toBe(
				'var(--wpds-typography-font-family-body, -apple-system, system-ui, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif)'
			);
		} );

		it( 'escapes double quotes when enabled', () => {
			expect(
				addFallbackToVar(
					'var(--wpds-typography-font-family-mono)',
					mockFallbacks,
					{ escapeQuotes: true }
				)
			).toBe(
				'var(--wpds-typography-font-family-mono, \\"Menlo\\", \\"Consolas\\", monaco, monospace)'
			);
		} );

		it( 'escapes both double and single quotes in the same value', () => {
			const fallbacks: Record< string, string > = {
				'--wpds-test-token': `"double" and 'single'`,
			};
			const result = addFallbackToVar(
				'var(--wpds-test-token)',
				fallbacks,
				{ escapeQuotes: true }
			);
			expect( result ).toBe(
				`var(--wpds-test-token, \\"double\\" and \\'single\\')`
			);
		} );

		it( 'leaves values without quotes unchanged when enabled', () => {
			expect(
				addFallbackToVar(
					'var(--wpds-border-radius-sm)',
					mockFallbacks,
					{ escapeQuotes: true }
				)
			).toBe( 'var(--wpds-border-radius-sm, 2px)' );
		} );
	} );
} );
