import { buildParallaxSectionHTML, getParallaxCSS, getParallaxJavaScript } from '@/services/parallaxService'
import { getImageBlockCSS, buildImageBlockHTML, buildFullwidthImageBlockHTML, buildFloatImageBlockHTML } from '@/services/imageBlockService'
import { getVideoBlockCSS, getVideoBlockJavaScript, buildSimpleVideoBlockHTML } from '@/services/videoBlockService'
import { getTextBlockCSS, buildTextBlockHTML } from '@/services/textBlockService'
import { getAllBaseStyles } from '@/services/baseStylesService'
import { buildSectionHTML } from '@/services/sectionService'

// converts editor data into a complete HTML page string
export function buildHtml(sections = []) {
  const head = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${getAllBaseStyles({
        includeReset: true,
        includeCanvas: true,
        includeSection: true,
        includeBlockWrapper: true,
        includeArticleContainer: false,
        includeInfoBanner: false,
        includeResponsive: false
      })}

      ${getTextBlockCSS()}
      ${getImageBlockCSS()}
      ${getVideoBlockCSS()}

      ${getParallaxCSS()}

      /* Responsive typography for parallax content */
      .parallax-slide-content h1 {
        font-size: clamp(1.5em, 4vw, 2em);
        line-height: 1.2;
      }

      .parallax-slide-content h2 {
        font-size: clamp(1.25em, 3vw, 1.5em);
        line-height: 1.3;
      }

      .parallax-slide-content p {
        font-size: clamp(0.95em, 1.5vw, 1em);
        line-height: 1.6;
      }
    </style>
  `

  // build HTML for each section
  const sectionHtml = (sections || []).map(sec => {
    // Handle parallax sections
    if (sec.type === 'parallax') {
      return buildParallaxSectionHTML(sec)
    }

    // Handle normal sections - generate inner blocks first
    const blocks = (sec.blocks || []).map(blk => {
      if (blk.type === 'text') {
        return buildTextBlockHTML(blk, true)
      }
      if (blk.type === 'image') {
        return buildImageBlockHTML(blk)
      }
      if (blk.type === 'fullwidth-image') {
        return buildFullwidthImageBlockHTML(blk)
      }
      if (blk.type === 'float-image') {
        return buildFloatImageBlockHTML(blk)
      }
      if (blk.type === 'video') {
        return buildSimpleVideoBlockHTML(blk)
      }
      return ''
    }).join('')

    // Use service to build section HTML
    return buildSectionHTML(sec, blocks)
  }).join('')

  // assemble the complete html
  return `<!doctype html>
  <html>
    <head>${head}</head>
    <body>
      <main class="canvas-area">
        ${sectionHtml}
      </main>
      <script>
        ${getVideoBlockJavaScript()}
        ${getParallaxJavaScript()}
      </script>
    </body>
  </html>`
}
