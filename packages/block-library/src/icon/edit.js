/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	TextControl,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Placeholder,
} from '@wordpress/components';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import HtmlRenderer from '../utils/html-renderer';
import { CustomInserterModal } from './components';
import { unlock } from '../lock-unlock';

export function Edit( { attributes, setAttributes } ) {
	const { icon, ariaLabel } = attributes;

	const [ isInserterOpen, setInserterOpen ] = useState( false );

	const isContentOnlyMode = useBlockEditingMode() === 'contentOnly';

	const allIcons = useSelect( ( select ) => {
		return unlock( select( coreDataStore ) ).getIcons();
	}, [] );

	const iconToDisplay =
		allIcons?.length > 0
			? allIcons?.find( ( { name } ) => name === icon )?.content
			: '';

	const blockControls = (
		<>
			<BlockControls group={ isContentOnlyMode ? 'inline' : 'other' }>
				<ToolbarButton
					onClick={ () => {
						setInserterOpen( true );
					} }
				>
					{ icon ? __( 'Replace' ) : __( 'Choose icon' ) }
				</ToolbarButton>
			</BlockControls>
			{ isContentOnlyMode && icon && (
				// Add some extra controls for content attributes when content only mode is active.
				// With content only mode active, the inspector is hidden, so users need another way
				// to edit these attributes.
				<BlockControls group="other">
					<ToolbarGroup className="components-toolbar-group">
						<DropdownMenu
							icon=""
							popoverProps={ {
								className: 'is-alternate',
							} }
							text={ __( 'Label' ) }
						>
							{ () => (
								<TextControl
									className="wp-block-icon__toolbar-content"
									label={ __( 'Label' ) }
									value={ ariaLabel || '' }
									onChange={ ( value ) =>
										setAttributes( { ariaLabel: value } )
									}
									help={ __(
										'Briefly describe the icon to help screen reader users. Leave blank for decorative icons.'
									) }
									__next40pxDefaultSize
								/>
							) }
						</DropdownMenu>
					</ToolbarGroup>
				</BlockControls>
			) }
		</>
	);
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const inspectorControls = icon && (
		<>
			<InspectorControls group="settings">
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () =>
						setAttributes( {
							ariaLabel: undefined,
						} )
					}
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Label' ) }
						isShownByDefault
						hasValue={ () => !! ariaLabel }
						onDeselect={ () =>
							setAttributes( { ariaLabel: undefined } )
						}
					>
						<TextControl
							label={ __( 'Label' ) }
							help={ __(
								'Briefly describe the icon to help screen reader users. Leave blank for decorative icons.'
							) }
							value={ ariaLabel || '' }
							onChange={ ( value ) =>
								setAttributes( { ariaLabel: value } )
							}
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<div { ...useBlockProps() }>
				{ icon ? (
					<HtmlRenderer html={ iconToDisplay } />
				) : (
					<Placeholder
						withIllustration
						style={ {
							height: attributes?.style?.dimensions?.width,
							width: attributes?.style?.dimensions?.width,
						} }
					/>
				) }
			</div>
			{ isInserterOpen && (
				<CustomInserterModal
					icons={ allIcons }
					setInserterOpen={ setInserterOpen }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
}

export default Edit;
