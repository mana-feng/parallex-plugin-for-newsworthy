/**
 * HTML Builder
 * Builds HTML content from sections for export
 */

import { getAllBaseStyles, getSectionCSS } from '@/services/baseStylesService'
import { getTextBlockCSS, buildTextBlockHTML } from '@/services/textBlockService'
import { 
    getImageBlockCSS, 
    buildImageBlockHTML, 
    buildFullwidthImageBlockHTML, 
    buildFloatImageBlockHTML 
} from '@/services/imageBlockService'
import { getVideoBlockCSS, getVideoBlockJavaScript, buildVideoBlockHTML } from '@/services/videoBlockService'
import { buildSectionHTMLForExport } from '@/services/sectionService'
import * as parallaxService from '@/services/parallaxService'

/**
 * Build HTML head section with styles and scripts
 * @returns {string} - HTML head content
 */
function buildHTMLHead() {
    return `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <title>Exported Article</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: transparent;
            padding: 0;
            margin: 0;
        }
        /* Text alignment classes (for compatibility) */
        .text-align-left {
            text-align: left;
        }
        .text-align-center {
            text-align: center;
        }
        
        /* Text alignment inline styles (TipTap uses inline styles) */
        [style*="text-align: left"],
        [style*="text-align:left"] {
            text-align: left !important;
        }
        [style*="text-align: center"],
        [style*="text-align:center"] {
            text-align: center !important;
        }
        ${getAllBaseStyles({
            includeReset: true,
            includeCanvas: false,
            includeSection: true,
            includeBlockWrapper: true,
            includeArticleContainer: true,
            includeResponsive: true
        })}
        ${getSectionCSS()}
        ${getTextBlockCSS()}
        ${getImageBlockCSS()}
        ${getVideoBlockCSS()}
        ${parallaxService.getParallaxCSS()}
    </style>
    <script>
        ${getVideoBlockJavaScript()}
        ${parallaxService.getParallaxJavaScript()}
    </script>`
}

/**
 * Build HTML for image block
 * Uses the complete implementation from imageBlockService
 * @param {Object} block - Image block object
 * @returns {string} - HTML string
 */
function buildImageBlockHTMLForExport(block) {
    // Use the complete function from imageBlockService
    // This handles all images in the array, caption positions, bubble animations, etc.
    return buildImageBlockHTML(block)
}

/**
 * Build HTML for fullwidth image block
 * Uses the complete implementation from imageBlockService
 * @param {Object} block - Fullwidth image block object
 * @returns {string} - HTML string
 */
function buildFullwidthImageBlockHTMLForExport(block) {
    // Use the complete function from imageBlockService
    // This handles mode (auto/fixed), height, caption positions, bubble animations, etc.
    return buildFullwidthImageBlockHTML(block)
}

/**
 * Build HTML for float image block
 * Uses the complete implementation from imageBlockService
 * @param {Object} block - Float image block object
 * @returns {string} - HTML string
 */
function buildFloatImageBlockHTMLForExport(block) {
    // Use the complete function from imageBlockService
    // This handles align, widthPercent, caption positions, bubble animations, and text content
    // Note: local:// URLs are already converted to base64 by exportHelpers before this is called
    return buildFloatImageBlockHTML(block)
}

/**
 * Build HTML for section blocks
 * @param {Array} blocks - Array of block objects
 * @returns {string} - HTML string for blocks
 */
function buildSectionBlocksHTML(blocks) {
    if (!blocks || blocks.length === 0) {
        return ''
    }

    let blocksHTML = ''

    blocks.forEach(block => {
        if (block.type === 'text') {
            // TSB导出调用位置：文本块的静态HTML由 textBlockService.buildTextBlockHTML 生成
            blocksHTML += buildTextBlockHTML(block, false)
        } else if (block.type === 'image') {
            // Use complete image block builder with all properties
            blocksHTML += buildImageBlockHTMLForExport(block)
        } else if (block.type === 'fullwidth-image') {
            // Use complete fullwidth image block builder with all properties
            blocksHTML += buildFullwidthImageBlockHTMLForExport(block)
        } else if (block.type === 'float-image') {
            // Use enhanced float image block builder with caption support
            blocksHTML += buildFloatImageBlockHTMLForExport(block)
        } else if (block.type === 'video') {
            blocksHTML += buildVideoBlockHTML(block)
        }
    })

    return blocksHTML
}

/**
 * Build HTML body content from sections
 * @param {Array} sections - Processed sections array
 * @returns {string} - HTML body content
 */
export function buildHTMLBody(sections) {
    let bodyContent = '    <div class="article-container">\n'

    sections.forEach(section => {
        // Handle parallax sections
        if (section.type === 'parallax' && section.slides) {
            bodyContent += parallaxService.buildParallaxSectionForExport(section)
            return
        }

        // Build blocks HTML
        const blocksHTML = buildSectionBlocksHTML(section.blocks)

        // Build section HTML
        bodyContent += buildSectionHTMLForExport(section, blocksHTML)
    })

    bodyContent += '    </div>\n'
    return bodyContent
}

/**
 * Build complete HTML document
 * @param {Array} sections - Processed sections array
 * @returns {string} - Complete HTML document
 */
export function buildCompleteHTML(sections) {
    const head = buildHTMLHead()
    const body = buildHTMLBody(sections)

    return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>
<body>
${body}</body>
</html>`
}

