/**
 * Text Block Service
 * Handles all text block related functionality including:
 * - CSS styles for text blocks
 * - HTML generation for text blocks
 */

/**
 * Get CSS styles for text blocks
 * @returns {string} - CSS string
 */
export function getTextBlockCSS() {
    return `
        .prose {
            background: transparent;
            border: 1px solid transparent;
            min-height: 50px;
            padding: clamp(4px, 1vw, 8px);
            transition: padding 0.2s ease;
        }

        .prose h1 {
            font-size: clamp(1.5em, 4vw, 2.5em);
            font-weight: 700;
            margin: 0.67em 0;
            line-height: 1.2;
        }

        .prose h2 {
            font-size: clamp(1.25em, 3vw, 2em);
            font-weight: 700;
            margin: 0.83em 0;
            line-height: 1.3;
        }

        .prose h3 {
            font-size: clamp(1.15em, 2.5vw, 1.3em);
            font-weight: 700;
            margin: 1em 0;
            line-height: 1.4;
        }

        .prose p {
            font-size: clamp(0.9em, 2vw, 1.2em);
            line-height: 1.6;
            margin: 1em 0;
        }

        .prose ul, .prose ol {
            font-size: clamp(0.95em, 1.5vw, 1em);
            line-height: 1.6;
        }

        .text-wrapper {
            transition: max-width 0.25s ease, padding 0.2s ease;
            padding: clamp(0.25rem, 1vw, 0.5rem) 0;
            width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
            overflow-wrap: anywhere;
            word-break: break-word;
            max-width: min(var(--block-max, 65ch), var(--device-text-max, 65ch), 95%);
        }

        .text-block {
            /* Width is controlled by inline style, not hardcoded here */
            width: 100%;
            margin: 0 auto;
            /* Padding is provided by block-wrapper */
            padding: 0;
        }

        .text-block h1 {
            /* Fluid font size: scales between 1.5em and 2em based on viewport */
            font-size: clamp(1.5em, 4vw, 2em);
            font-weight: 700;
            margin: 0.67em 0;
            line-height: 1.2;
        }

        .text-block h2 {
            /* Fluid font size: scales between 1.25em and 1.5em */
            font-size: clamp(1.25em, 3vw, 1.5em);
            font-weight: 700;
            margin: 0.83em 0;
            line-height: 1.3;
        }

        .text-block p {
            /* Fluid font size for better readability on all screens */
            font-size: clamp(0.95em, 1.5vw, 1em);
            line-height: 1.6;
            margin: 1em 0;
        }

        .text-block strong {
            font-weight: 700;
        }

        .text-block em {
            font-style: italic;
        }

        .text-block a {
            color: #2563eb;
            text-decoration: underline;
        }

        .text-block a:hover {
            color: #1d4ed8;
        }

        .text-block ul, .text-block ol {
            margin: 1em 0;
            padding-left: 2em;
        }

        .text-block li {
            margin: 0.5em 0;
        }

        /* Responsive adjustments */
        @media (max-width: 767px) {
            .text-wrapper {
                max-width: 95%;
            }
        }

        @media (max-width: 479px) {
            .text-wrapper {
                max-width: 100%;
            }

            .prose {
                padding: clamp(2px, 0.5vw, 4px);
            }
        }

        @media (min-width: 1920px) {
            .text-wrapper {
                max-width: min(var(--block-max, 75ch), var(--device-text-max, 75ch), 95%);
            }
        }

        @media (max-width: 1024px) {
            [style*="font-size"] {
                font-size: calc(0.95 * 1em) !important;
            }
        }

        @media (max-width: 768px) {
            [style*="font-size"] {
                font-size: calc(0.8 * 1em) !important;
            }
        }

        @media (max-width: 480px) {
            [style*="font-size"] {
                font-size: calc(0.65 * 1em) !important;
            }
        }
    `;
}

/**
 * Build text block HTML
 * @param {object} block - Text block object
 * @param {boolean} useProseClass - Whether to use .prose class (for buildHtml) or .text-block (for export)
 * @returns {string} - HTML string
 */
export function buildTextBlockHTML(block, useProseClass = true) {
    if (!block || block.type !== 'text') {
        return '';
    }

    const maxWidth = block?.props?.width || '65ch';
    const html = block.html || '<p></p>';
    const className = useProseClass ? 'prose max-w-none' : 'text-block';

    if (useProseClass) {
        // For buildHtml.js - uses .prose class
        return `
            <div class="block-wrapper">
                <div class="text-wrapper" style="--block-max:${maxWidth};width:100%;margin:0 auto;padding:0.5rem 0;">
                    <div class="${className}">${html}</div>
                </div>
            </div>
        `;
    } else {
        // For exportToHTML - uses .text-block class
        return `
            <div class="block-wrapper">
                <div class="${className}" style="max-width: ${maxWidth};">
                    ${html}
                </div>
            </div>
        `;
    }
}

