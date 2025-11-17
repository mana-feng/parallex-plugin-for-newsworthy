/**
 * Section Service
 * Handles section-related functionality including:
 * - Section HTML generation
 * - Section style generation
 */

/**
 * Generate inline styles for a section based on its properties
 * @param {object} props - Section properties
 * @returns {string} - Inline style string
 */
export function generateSectionStyles(props = {}) {
    const styles = [];
    
    // Height
    if (props.height) {
        styles.push(`min-height:${props.height}px`);
    }
    
    // Width
    styles.push('width:100%');
    
    // Background
    if (props.bgType === 'img' && props.bgImg) {
        styles.push(
            `background-image:url(${props.bgImg})`,
            'background-size:cover',
            'background-position:center',
            'background-repeat:no-repeat'
        );
    } else {
        styles.push(`background:${props.background || '#ffffff'}`);
    }
    
    return styles.join(';');
}

/**
 * Generate section HTML for buildHtml.js
 * @param {object} section - Section object
 * @param {string} blocksHTML - HTML string for section blocks
 * @returns {string} - HTML string
 */
export function buildSectionHTML(section, blocksHTML) {
    const props = section.props || {};
    const styles = generateSectionStyles(props);
    
    return `<section class="section-block" style="${styles}">${blocksHTML}</section>`;
}

/**
 * Generate section HTML for export (with article-container wrapper)
 * @param {object} section - Section object
 * @param {string} blocksHTML - HTML string for section blocks
 * @returns {string} - HTML string
 */
export function buildSectionHTMLForExport(section, blocksHTML) {
    const props = section.props || {};
    const minHeight = props.height || 800;
    const bgColor = props.background || '#ffffff';
    const bgImg = props.bgImg || '';
    const bgType = props.bgType || 'color';
    
    let sectionStyle = `min-height: ${minHeight}px;`;
    
    if (bgType === 'img' && bgImg) {
        sectionStyle += ` background-image: url('${bgImg}');`;
    } else {
        sectionStyle += ` background-color: ${bgColor};`;
    }
    
    return `
        <section class="section" style="${sectionStyle}">
            ${blocksHTML}
        </section>
    `;
}

/**
 * Parse section from HTML element
 * @param {Element} sectionEl - Section DOM element
 * @param {number} index - Index for generating unique IDs
 * @returns {object} - Section object
 */
export function parseSectionFromHTML(sectionEl, index = 0) {
    const section = {
        id: Date.now() + index,
        type: 'section',
        blocks: [],
        props: {
            height: 300,
            bgType: 'color',
            background: '#ffffff',
            bgImg: '',
            bgVideo: '',
            _blobUrl: '',
        }
    };
    
    const sectionStyle = sectionEl.getAttribute('style') || '';
    
    // Parse background image
    if (sectionStyle.includes('background-image')) {
        const bgImgMatch = sectionStyle.match(/background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/);
        if (bgImgMatch) {
            section.props.bgType = 'img';
            section.props.bgImg = bgImgMatch[1];
        }
    } else {
        // Parse background color
        const bgColorMatch = sectionStyle.match(/background(?:-color)?:\s*([^;]+)/);
        if (bgColorMatch) {
            section.props.background = bgColorMatch[1].trim();
        }
    }
    
    // Parse height
    const heightMatch = sectionStyle.match(/min-height:\s*(\d+)px/);
    if (heightMatch) {
        section.props.height = parseInt(heightMatch[1], 10);
    }
    
    return section;
}

