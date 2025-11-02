// converts editor data into a complete HTML page string
export function buildHtml(sections = []) {
  const head = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      /* Base styles */
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
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", sans-serif;
        line-height: 1.65;
        color: #111827;
        background-color: #ffffff;
      }
      
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
      
      .section-block {
        width: 100%;
        flex-shrink: 0;
        min-height: 200px;
        box-sizing: border-box;
        /* Remove padding to let background color/image extend to edges */
        padding: 0;
        transition: all 0.2s ease;
      }
      
      .section-block img,
      .section-block video {
        max-width: 100%;
        height: auto;
        display: block;
        transition: all 0.2s ease;
      }
      
      .block-wrapper {
        /* Add horizontal and vertical padding to content blocks */
        padding: clamp(12px, 2vw, 24px) clamp(16px, 3vw, 32px);
        transition: padding 0.2s ease;
      }
      
      .prose {
        background: transparent;
        border: 1px solid transparent;
        min-height: 50px;
        padding: clamp(4px, 1vw, 8px);
        transition: padding 0.2s ease;
      }
      
      .prose h1 {
        font-size: clamp(1.5em, 4vw, 2em);
        font-weight: 700;
        margin: 0.67em 0;
        line-height: 1.2;
      }
      
      .prose h2 {
        font-size: clamp(1.25em, 3vw, 1.5em);
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
        font-size: clamp(0.95em, 1.5vw, 1em);
        line-height: 1.6;
        margin: 1em 0;
      }
      
      .prose ul, .prose ol {
        font-size: clamp(0.95em, 1.5vw, 1em);
        line-height: 1.6;
      }
      
      .image-block {
        display: flex;
        justify-content: center;
        align-items: center;
        /* Regular image blocks stay within content area */
        margin: clamp(8px, 1.5vw, 10px) 0;
        padding: 0;
      }
      
      .block-image {
        border-radius: 8px;
        box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
        object-fit: cover;
        max-width: 100%;
        height: auto;
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
      
      .fullwidth-image-block {
        width: 100%;
        /* Full-width images extend to edges with no left/right margins */
        margin: clamp(12px, 2vw, 24px) 0;
        padding: 0;
      }
      
      .fullwidth-image-block img {
        width: 100%;
        max-width: 100%;
        height: auto;
        /* Remove border radius to make image flush with edges */
        border-radius: 0;
        display: block;
        transition: all 0.2s ease;
      }
      
      .image-caption {
        font-size: clamp(0.85em, 1.2vw, 0.9em);
        color: #666;
        text-align: center;
        margin-top: 0.5em;
        font-style: italic;
        /* Image captions stay within content area */
        padding: 0 clamp(16px, 3vw, 32px);
      }
      
      .float-image-container {
        display: flex;
        gap: clamp(0.75rem, 2vw, 1rem);
        align-items: flex-start;
        flex-wrap: wrap;
      }
      
      .float-image-block {
        margin: clamp(8px, 1.5vw, 10px);
        transition: all 0.2s ease;
      }
      
      .float-text-content {
        flex: 1;
        min-width: 200px;
      }
      
      @media (max-width: 767px) {
        .float-image-container {
          flex-direction: column;
        }
        
        .float-image-block,
        .float-text-content {
          width: 100% !important;
          order: unset !important;
        }
        
        .text-wrapper {
          max-width: 95%;
        }
      }
      
      @media (max-width: 479px) {
        .section-block {
          min-height: auto;
        }
        
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
    </style>
    <style>
      /* Parallax Section Styles */
      .parallax-container {
        position: relative;
        width: 100%;
      }
      
      .parallax-bg-wrapper {
        position: sticky;
        top: 0;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        z-index: 0;
      }
      
      .parallax-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0;
        transition: opacity 0.6s ease-in-out;
      }
      
      .parallax-bg.active {
        opacity: 1;
      }
      
      .parallax-content {
        position: relative;
        z-index: 1;
        pointer-events: none;
      }
      
      .parallax-slide {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        /* Fluid padding for parallax slides */
        padding: clamp(1rem, 3vw, 2rem);
        transition: padding 0.2s ease;
      }
      
      .parallax-slide-content {
        /* Fluid max-width for parallax content */
        max-width: min(800px, 95%);
        width: 100%;
        background: rgba(255, 255, 255, 0.95);
        /* Fluid padding */
        padding: clamp(1.5rem, 4vw, 3rem);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        pointer-events: auto;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        transition: padding 0.2s ease;
      }
      
      .parallax-slide-content * {
          max-width: 100%; 
      }

      .parallax-slide-content.transparent {
        background: transparent;
        box-shadow: none;
      }
      
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
      
      /* Mobile optimization */
      @media (max-width: 479px) {
        .parallax-slide-content {
          max-width: 95%;
          border-radius: 4px;
        }
      }
    </style>
  `
  // build HTML for each section
  const sectionHtml = (sections || []).map(sec => {
    // Handle parallax sections
    if (sec.type === 'parallax') {
      return buildParallaxSection(sec)
    }
    
    // Handle normal sections
    const p = sec.props || {}
    const secStyle = []

    // background is img
    if (p.bgType === 'img' && p.bgImg) {
      secStyle.push(
        `background-image:url(${p.bgImg})`,
        'background-size:cover',
        'background-position:center',
        'background-repeat:no-repeat'
      )
    } else {
      secStyle.push(`background:${p.background || '#ffffff'}`)
    }

    // height & width
    if (p.height) secStyle.push(`min-height:${p.height}px`)
    secStyle.push('width:100%')

    // generate inner blocks(text/img)
    const blocks = (sec.blocks || []).map(blk => {
      if (blk.type === 'text') {
        const maxWidth = blk?.props?.width || '65ch'
        return `
          <div class="block-wrapper">
            <div class="text-wrapper" style="--block-max:${maxWidth};width:100%;margin:0 auto;padding:0.5rem 0;">
              <div class="prose max-w-none">${blk.html || '<p></p>'}</div>
            </div>
          </div>
        `
      }
      if (blk.type === 'image') {
        // Handle images array structure
        if (!blk.images || !Array.isArray(blk.images) || blk.images.length === 0) {
          return ''
        }
        
        // For now, render the first image from the images array
        const img = blk.images[0]
        const w = img.width ? `width:${img.width}px;` : ''
        const h = img.height ? `height:${img.height}px;` : ''
        const fit = img.keepRatio ? 'object-fit:contain;' : 'object-fit:fill;'
        const src = img.src || ''
        
        return `
          <div class="block-wrapper">
            <figure class="image-block">
              <img src="${src}" style="${w}${h}${fit}object-position:center;max-width:100%;display:block;" alt="" />
            </figure>
          </div>
        `
      }
      if (blk.type === 'fullwidth-image') {
        // Handle fullwidth image
        if (!blk.image || !blk.image.src) {
          return ''
        }
        
        const img = blk.image
        const src = img.src || ''
        const mode = img.mode || 'auto'
        const height = img.height || 400
        const fit = mode === 'fixed' ? 'object-fit:cover;' : 'object-fit:contain;'
        const heightStyle = mode === 'fixed' ? `height:${height}px;` : 'height:auto;'
        const caption = img.caption ? `<figcaption class="image-caption">${img.caption}</figcaption>` : ''
        
        return `
          <div class="block-wrapper">
            <figure class="fullwidth-image-block">
              <img src="${src}" class="fullwidth-image" style="width:100%;display:block;${fit}${heightStyle}" alt="" />
              ${caption}
            </figure>
          </div>
        `
      }
      if (blk.type === 'float-image') {
        // Handle float image with text
        if (!blk.image || !blk.image.src) {
          return ''
        }
        
        const img = blk.image
        const src = img.src || ''
        const align = img.align || 'right'
        const widthPercent = img.widthPercent || 45
        const caption = img.caption ? `<figcaption class="image-caption">${img.caption}</figcaption>` : ''
        const text = blk.text || '<p></p>'
        
        return `
          <div class="block-wrapper">
            <div class="float-image-container" style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;">
              <figure class="float-image-block" style="width:${widthPercent}%;margin:0;${align === 'left' ? 'order:1;' : 'order:2;'}">
                <img src="${src}" style="width:100%;height:auto;display:block;" alt="" />
                ${caption}
              </figure>
              <div class="float-text-content" style="flex:1;min-width:200px;${align === 'left' ? 'order:2;' : 'order:1;'}">
                <div class="prose max-w-none">${text}</div>
              </div>
            </div>
          </div>
        `
      }
      return ''
    }).join('')

    // combine bg style and blocks
    return `<section class="section-block" style="${secStyle.join(';')}">${blocks}</section>`
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
        // Parallax scrolling effect
        document.addEventListener('DOMContentLoaded', function() {
          const parallaxContainers = document.querySelectorAll('.parallax-container');
          
          parallaxContainers.forEach(container => {
            const backgrounds = container.querySelectorAll('.parallax-bg');
            const slides = container.querySelectorAll('.parallax-slide');
            
            if (backgrounds.length === 0 || slides.length === 0) return;
            
            function updateParallax() {
              const containerTop = container.getBoundingClientRect().top;
              const containerHeight = container.offsetHeight;
              const windowHeight = window.innerHeight;
              
              // Calculate scroll progress within container
              const scrollProgress = -containerTop / (containerHeight - windowHeight);
              const clampedProgress = Math.max(0, Math.min(1, scrollProgress));
              
              // Calculate which slide should be active
              const slideIndex = Math.floor(clampedProgress * slides.length);
              const activeIndex = Math.min(slideIndex, slides.length - 1);
              
              // Update background visibility
              backgrounds.forEach((bg, index) => {
                if (index === activeIndex) {
                  bg.classList.add('active');
                } else {
                  bg.classList.remove('active');
                }
              });
            }
            
            // Initial update
            updateParallax();
            
            // Update on scroll
            window.addEventListener('scroll', updateParallax, { passive: true });
            window.addEventListener('resize', updateParallax, { passive: true });
          });
        });
      </script>
    </body>
  </html>`
}

// Build parallax section HTML
function buildParallaxSection(sec) {
  if (!sec.slides || sec.slides.length === 0) {
    return ''
  }
  
  const parallaxId = 'parallax-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  
  // Build background layers
  const backgrounds = sec.slides.map((slide, index) => {
    const bgImg = slide.bgImg || ''
    const activeClass = index === 0 ? ' active' : ''
    return `<div class="parallax-bg${activeClass}" style="background-image: url('${bgImg}');"></div>`
  }).join('')
  
  // Build slide content
  const slideContent = sec.slides.map((slide, index) => {
    const blocks = (slide.blocks || []).map(blk => {
      if (blk.type === 'text') {
        return `<div class="prose max-w-none">${blk.html || '<p></p>'}</div>`
      }
      return ''
    }).join('')
    
    return `
      <div class="parallax-slide" data-slide-index="${index}">
        <div class="parallax-slide-content ${!blocks ? 'transparent' : ''}">
          ${blocks}
        </div>
      </div>
    `
  }).join('')
  
  return `
    <div class="parallax-container" id="${parallaxId}">
      <div class="parallax-bg-wrapper">
        ${backgrounds}
      </div>
      <div class="parallax-content">
        ${slideContent}
      </div>
    </div>
  `
}
