/**
 * Base Styles Service
 * Provides base/reset styles and common layout styles used across the application
 */

/**
 * Get base reset styles
 * @returns {string} - CSS string
 */
export function getBaseResetCSS() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }

        body {
            font-family: Georgia, "Times New Roman", Times, serif;
            line-height: 1.75;
            color: #111111;
            background-color: #ffffff;
        }
    `;
}

/**
 * Get canvas area styles
 * @returns {string} - CSS string
 */
export function getCanvasAreaCSS() {
    return `
        .canvas-area {
            width: 100%;
            background-color: transparent;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            margin: 0;
            padding: 0;
        }
    `;
}

/**
 * Get section block styles
 * @returns {string} - CSS string
 */
export function getSectionBlockCSS() {
    return `
        .section-block {
            /* Section should always fill full width */
            width: 100%;
            max-width: 100%;
            flex-shrink: 0;
            min-height: 200px;
            box-sizing: border-box;
            padding: 0;
            margin: 0;
            /* Default white background - ensures full-width background coverage */
            /* Individual sections can override this via inline styles */
            background-color: #fff;
            /* Smooth transition for real-time responsiveness */
            transition: all 0.2s ease;
        }

        .section-block img,
        .section-block video {
            max-width: 100%;
            height: auto;
            display: block;
            transition: all 0.2s ease;
        }
    `;
}

/**
 * Get section styles (for export)
 * @returns {string} - CSS string
 */
export function getSectionCSS() {
    return `
        .section {
            margin: 0;
            box-sizing: border-box;
            position: relative;
            border-top: 2px solid #e5e7eb;
            /* Remove padding to let background color/image extend to edges */
            padding: 0;
            overflow: visible;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            /* Full width, no max-width restriction */
            width: 100%;
            max-width: 100%;
            /* Default white background - ensures full-width background coverage */
            /* Individual sections can override this via inline styles */
            background-color: #fff;
            /* Smooth transition for real-time responsiveness */
            transition: all 0.2s ease;
        }
    `;
}

/**
 * Get block wrapper styles
 * @returns {string} - CSS string
 */
export function getBlockWrapperCSS() {
    return `
        .block-wrapper {
            /* Add horizontal and vertical padding to content blocks */
            padding: clamp(12px, 2vw, 24px) clamp(16px, 3vw, 32px);
            transition: padding 0.2s ease;
            /* Center content and limit max-width for readability on large screens */
            margin: 0 auto;
            max-width: 960px;
        }
    `;
}

/**
 * Get article container styles (for export)
 * @returns {string} - CSS string
 */
export function getArticleContainerCSS() {
    return `
        .article-container {
            width: 100%;
            background-color: transparent;
            display: flex;
            flex-direction: column;
            align-items: stretch;
        }
    `;
}

/**
 * Get info banner styles
 * @returns {string} - CSS string
 */
export function getInfoBannerCSS() {
    return `
        .info-banner {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 12px 20px;
            margin: 0;
            text-align: center;
            font-size: 14px;
            line-height: 1.5;
            width: 100%;
        }

        .info-banner a {
            color: #004085;
            text-decoration: underline;
        }

        .close-banner {
            background: transparent;
            border: none;
            color: #856404;
            font-size: 20px;
            cursor: pointer;
            float: right;
            padding: 0;
            margin: -4px 0 0 10px;
        }
    `;
}

/**
 * Get responsive media queries
 * @returns {string} - CSS string
 */
export function getResponsiveMediaQueries() {
    return `
        /* All screen sizes: section stretches to full width */
        .section,
        .section-block {
            max-width: 100%;
            width: 100%;
        }

        /* Mobile: 0 - 479px */
        @media (max-width: 479px) {
            .section {
                min-height: auto !important;
            }

            .section-block {
                min-height: auto;
            }

            .info-banner {
                font-size: clamp(11px, 2.5vw, 14px);
                padding: clamp(6px, 1.5vw, 12px);
            }
        }
    `;
}

/**
 * Get all base styles combined
 * @param {object} options - Options for which styles to include
 * @returns {string} - Combined CSS string
 */
export function getAllBaseStyles(options = {}) {
    const {
        includeReset = true,
        includeCanvas = true,
        includeSection = true,
        includeBlockWrapper = true,
        includeArticleContainer = false,
        includeInfoBanner = false,
        includeResponsive = true,
    } = options;

    let css = '';

    if (includeReset) css += getBaseResetCSS();
    if (includeCanvas) css += getCanvasAreaCSS();
    if (includeSection) css += getSectionBlockCSS();
    if (includeBlockWrapper) css += getBlockWrapperCSS();
    if (includeArticleContainer) css += getArticleContainerCSS();
    if (includeInfoBanner) css += getInfoBannerCSS();
    if (includeResponsive) css += getResponsiveMediaQueries();

    return css;
}

