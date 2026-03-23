import { registerBlockType } from '@wordpress/blocks'
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls
} from '@wordpress/block-editor'
import { PanelBody, RangeControl } from '@wordpress/components'
import { __ } from '@wordpress/i18n'

registerBlockType('infinite-scroll/row', {
	title: __('Infinite Scroll', 'infinite-scroll'),
	icon: 'arrow-right-alt2',
	category: 'layout',
	supports: {
		align: ['wide', 'full'],
		color: {
			background: true,
			text: true
		}
	},
	attributes: {
		secondsPerWidth: {
			type: 'number',
			default: 10
		}
	},
	edit({ attributes, setAttributes }) {
		const blockProps = useBlockProps({
			className: 'infinite-scroll-row wp-block-infinite-scroll-row',
			style: {
				display: 'flex',
				flexDirection: 'row',
				overflow: 'hidden'
			}
		})
		return (
			<>
				<InspectorControls>
					<PanelBody title={__('Settings', 'infinite-scroll')}>
						<RangeControl
							label={__(
								'Seconds to scroll 1 content width',
								'infinite-scroll'
							)}
							value={attributes.secondsPerWidth}
							onChange={(value) =>
								setAttributes({ secondsPerWidth: value })
							}
							min={1}
							max={60}
						/>
					</PanelBody>
				</InspectorControls>
				<div
					{...blockProps}
					data-seconds-per-width={attributes.secondsPerWidth}
				>
					<InnerBlocks
						allowedBlocks={['core/paragraph', 'core/heading']}
						orientation='horizontal'
					/>
				</div>
			</>
		)
	},
	save({ attributes }) {
		const blockProps = useBlockProps.save({
			className: 'infinite-scroll-row wp-block-infinite-scroll-row'
		})
		return (
			<div
				{...blockProps}
				data-seconds-per-width={attributes.secondsPerWidth}
			>
				<InnerBlocks.Content />
			</div>
		)
	}
})
