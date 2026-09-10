/* eslint-disable @wordpress/use-recommended-components */
/* eslint-disable react/jsx-filename-extension */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { MenuItem, Modal, Button, TextControl } from '@wordpress/components';
import { search } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { create, replace, toHTMLString } from '@wordpress/rich-text';

export default function FindReplaceMenuItem() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ findText, setFindText ] = useState( '' );
	const [ replaceText, setReplaceText ] = useState( '' );

	const blocks = useSelect( ( select ) =>
		select( blockEditorStore ).getBlocks()
	);
	const { resetBlocks } = useDispatch( blockEditorStore );

	const handleReplaceAll = () => {
		if ( ! findText ) {
			return;
		}

		// Basic regex for all occurrences (case-insensitive)
		const regex = new RegExp( findText, 'gi' );

		const replaceInBlocks = ( blockList ) => {
			return blockList.map( ( block ) => {
				const blockType = getBlockType( block.name );
				const newAttributes = { ...block.attributes };
				let changed = false;

				for ( const key in newAttributes ) {
					if ( typeof newAttributes[ key ] === 'string' ) {
						const attrDef = blockType?.attributes?.[ key ];
						const source = attrDef?.source;

						// If it's rich text or HTML, safely replace text nodes
						if ( source === 'html' || source === 'rich-text' ) {
							const record = create( {
								html: newAttributes[ key ],
							} );
							const newRecord = replace(
								record,
								regex,
								replaceText
							);
							const newVal = toHTMLString( { value: newRecord } );
							if ( newVal !== newAttributes[ key ] ) {
								newAttributes[ key ] = newVal;
								changed = true;
							}
						} else if ( ! source || source === 'text' ) {
							// Plain text replace
							const newVal = newAttributes[ key ].replace(
								regex,
								replaceText
							);
							if ( newVal !== newAttributes[ key ] ) {
								newAttributes[ key ] = newVal;
								changed = true;
							}
						}
					}
				}

				const newInnerBlocks =
					block.innerBlocks.length > 0
						? replaceInBlocks( block.innerBlocks )
						: block.innerBlocks;

				if ( changed || newInnerBlocks !== block.innerBlocks ) {
					return {
						...block,
						attributes: newAttributes,
						innerBlocks: newInnerBlocks,
					};
				}
				return block;
			} );
		};

		const newBlocks = replaceInBlocks( blocks );
		resetBlocks( newBlocks );
		setIsModalOpen( false );
	};

	return (
		<>
			<MenuItem icon={ search } onClick={ () => setIsModalOpen( true ) }>
				{ __( 'Find and Replace' ) }
			</MenuItem>
			{ isModalOpen && (
				<Modal
					title={ __( 'Find and Replace' ) }
					onRequestClose={ () => setIsModalOpen( false ) }
					style={ { width: '400px' } }
				>
					<div
						style={ {
							display: 'flex',
							flexDirection: 'column',
							gap: '16px',
						} }
					>
						<div>
							<TextControl
								label={ __( 'Find' ) }
								value={ findText }
								onChange={ setFindText }
							/>
						</div>
						<div>
							<TextControl
								label={ __( 'Replace with' ) }
								value={ replaceText }
								onChange={ setReplaceText }
							/>
						</div>
						<div>
							<Button
								variant="primary"
								__next40pxDefaultSize
								onClick={ handleReplaceAll }
							>
								{ __( 'Replace All' ) }
							</Button>
						</div>
					</div>
				</Modal>
			) }
		</>
	);
}
/* eslint-enable @wordpress/use-recommended-components */
/* eslint-enable react/jsx-filename-extension */
