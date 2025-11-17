import { localhostToLocal, localToLocalhost } from '@/utils/imageUrlUtils'
import * as dialog from '@/utils/dialog'
import { uploadImage } from '@/services/imageProcessingService'

/**
 * Parallax Section Service
 * Handles all parallax/scrollytelling section operations
 */

/**
 * Create a new parallax section
 * @returns {Object} New parallax section object
 */
export function createParallaxSection() {
  return {
    id: Date.now(),
    type: 'parallax',
    slides: [
      {
        id: Date.now(),
        bgImg: '',
        sourceType: 'url',
        _blobUrl: '',
        blocks: []
      }
    ],
    props: {
      height: 800, // minimum height for each slide
    }
  }
}

/**
 * Add a new slide to a parallax section
 * @param {Object} section - The parallax section
 */
export function addSlide(section) {
  if (!section || !section.slides) return
  
  section.slides.push({
    id: Date.now(),
    bgImg: '',
    sourceType: 'url',
    _blobUrl: '',
    blocks: []
  })
}

/**
 * Remove a slide from a parallax section
 * @param {Object} section - The parallax section
 * @param {number} index - Index of the slide to remove
 */
export function removeSlide(section, index) {
  if (!section || !section.slides || section.slides.length <= 1) return
  
  // Revoke blob URL if exists
  const slide = section.slides[index]
  if (slide && slide._blobUrl && slide._blobUrl.startsWith('blob:')) {
    try { 
      URL.revokeObjectURL(slide._blobUrl) 
    } catch { }
  }
  
  section.slides.splice(index, 1)
}

/**
 * Update slide background image URL
 * @param {Object} section - The parallax section
 * @param {number} index - Index of the slide
 * @param {string} url - New background image URL
 */
export function updateSlideBg(section, index, url) {
  if (!section || !section.slides) return
  
  const slide = section.slides[index]
  if (!slide) return
  
  slide.bgImg = url
  slide.sourceType = 'url'
}

/**
 * Handle background image upload for a slide
 * @param {Object} section - The parallax section
 * @param {number} index - Index of the slide
 * @param {File} file - The image file to upload
 * @returns {Promise<void>}
 */
export async function handleUploadBg(section, index, file) {
  if (!section || !section.slides || !file) return
  
  const slide = section.slides[index]
  if (!slide) return
  
  // Revoke old blob URL
  if (slide._blobUrl && slide._blobUrl.startsWith('blob:')) {
    try { 
      URL.revokeObjectURL(slide._blobUrl) 
    } catch { }
  }
  
  try {
    // Use unified image upload service (converts to AVIF, saves to local database)
    const result = await uploadImage(file, file.name)
    
    if (!result.success) {
      console.error('Parallax background upload failed:', result.error)
      return
    }
    
    // The editor stores local://<id> format, and converts to display URL for display
    slide.bgImg = result.localUrl
    slide.sourceType = 'local'
    slide._blobUrl = ''
  } catch (error) {
    console.error('Parallax background upload error:', error)
    await dialog.error('Failed to process image. An error occurred while processing the image.', {
      title: 'Processing Error'
    })
  }
}

/**
 * Add a text block to a slide
 * @param {Object} section - The parallax section
 * @param {number} slideIndex - Index of the slide
 */
export function addTextToSlide(section, slideIndex) {
  if (!section || !section.slides) return
  
  const slide = section.slides[slideIndex]
  if (!slide) return
  
  if (!slide.blocks) {
    slide.blocks = []
  }
  
  slide.blocks.push({
    id: Date.now(),
    type: 'text',
    html: '<p>Enter your text here...</p>',
  })
}

/**
 * Remove a block from a slide
 * @param {Object} section - The parallax section
 * @param {number} slideIndex - Index of the slide
 * @param {number} blockId - ID of the block to remove
 */
export function removeBlockFromSlide(section, slideIndex, blockId) {
  if (!section || !section.slides) return
  
  const slide = section.slides[slideIndex]
  if (!slide || !slide.blocks) return
  
  slide.blocks = slide.blocks.filter(b => b.id !== blockId)
}

/**
 * Revoke all blob URLs in parallax sections
 * @param {Array} sections - Array of all sections
 */
export function revokeParallaxBlobs(sections) {
  if (!sections || !Array.isArray(sections)) return
  
  sections.forEach(s => {
    if (s.type === 'parallax' && s.slides) {
      s.slides.forEach(slide => {
        const u = slide._blobUrl
        if (u && u.startsWith('blob:')) {
          try { 
            URL.revokeObjectURL(u) 
          } catch { }
          slide._blobUrl = ''
        }
      })
    }
  })
}

/**
 * Build HTML for a parallax section
 * @param {Object} section - The parallax section
 * @returns {string} HTML string for the parallax section
 */
export function buildParallaxSectionHTML(section) {
  if (!section || !section.slides || section.slides.length === 0) {
    return ''
  }

  const parallaxId = 'parallax-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

  // Build background layers
  const backgrounds = section.slides.map((slide, index) => {
    const bgImg = localToLocalhost(slide.bgImg || '')
    const activeClass = index === 0 ? ' active' : ''
    return `<div class="parallax-bg${activeClass}" style="background-image: url('${bgImg}');"></div>`
  }).join('')

  // Build slide content
  const slideContent = section.slides.map((slide, index) => {
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

/**
 * Build HTML for parallax section (for exportToHTML function)
 * @param {Object} section - The parallax section
 * @returns {string} HTML string for the parallax section
 */
export function buildParallaxSectionForExport(section) {
  if (!section || !section.slides || section.slides.length === 0) {
    return ''
  }

  const parallaxId = 'parallax-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

  // Build background layers
  let backgrounds = ''
  section.slides.forEach((slide, index) => {
    const bgImg = localToLocalhost(slide.bgImg || '')
    const activeClass = index === 0 ? ' active' : ''
    backgrounds += `            <div class="parallax-bg${activeClass}" style="background-image: url('${bgImg}');"></div>\n`
  })

  // Build slide content
  let slideContent = ''
  section.slides.forEach((slide, index) => {
    let blocks = ''
    if (slide.blocks && slide.blocks.length > 0) {
      slide.blocks.forEach(blk => {
        if (blk.type === 'text') {
          blocks += `                    ${blk.html || '<p></p>'}\n`
        }
      })
    }

    const transparentClass = !blocks ? ' transparent' : ''
    slideContent += `            <div class="parallax-slide" data-slide-index="${index}">\n`
    slideContent += `                <div class="parallax-slide-content${transparentClass}">\n`
    slideContent += blocks
    slideContent += `                </div>\n`
    slideContent += `            </div>\n`
  })

  let htmlContent = `        <div class="parallax-container" id="${parallaxId}">\n`
  htmlContent += `            <div class="parallax-bg-wrapper">\n`
  htmlContent += backgrounds
  htmlContent += `            </div>\n`
  htmlContent += `            <div class="parallax-content">\n`
  htmlContent += slideContent
  htmlContent += `            </div>\n`
  htmlContent += `        </div>\n`

  return htmlContent
}

/**
 * Collect local image IDs from parallax sections
 * @param {Array} sections - Array of all sections
 * @param {Function} extractImageId - Function to extract image ID from URL
 * @returns {Set} Set of image IDs
 */
export function collectParallaxImageIds(sections, extractImageId) {
  const imageIds = new Set()

  if (!sections || !Array.isArray(sections)) return imageIds

  sections.forEach(section => {
    if (section.type === 'parallax' && section.slides) {
      section.slides.forEach(slide => {
        const id = extractImageId(slide.bgImg)
        if (id) {
          imageIds.add(id)
        }
      })
    }
  })

  return imageIds
}

/**
 * Collect detailed information about local images in parallax sections
 * @param {Array} sections - Array of all sections
 * @param {Function} extractImageId - Function to extract image ID from URL
 * @returns {Array} Array of image detail objects
 */
export function collectParallaxImageDetails(sections, extractImageId) {
  const details = []

  if (!sections || !Array.isArray(sections)) return details

  sections.forEach((section, sectionIdx) => {
    if (section.type === 'parallax' && section.slides) {
      section.slides.forEach((slide, slideIdx) => {
        const id = extractImageId(slide.bgImg)
        if (id) {
          details.push({
            imageId: id,
            location: `Section ${sectionIdx + 1} (Parallax) - Slide ${slideIdx + 1} background`,
            url: slide.bgImg
          })
        }
      })
    }
  })

  return details
}

/**
 * Replace local URLs with GitHub URLs in parallax sections
 * @param {Array} sections - Array of all sections
 * @param {Object} urlMapping - Mapping of local image IDs to GitHub URLs
 * @param {Function} extractImageId - Function to extract image ID from URL
 */
export function replaceParallaxLocalUrls(sections, urlMapping, extractImageId) {
  if (!sections || !Array.isArray(sections)) return

  sections.forEach(section => {
    if (section.type === 'parallax' && section.slides) {
      section.slides.forEach(slide => {
        const id = extractImageId(slide.bgImg)
        if (id && urlMapping[id]) {
          slide.bgImg = urlMapping[id]
          slide.sourceType = 'github'
        }
      })
    }
  })
}

/**
 * Prepare parallax sections for save (convert blob URLs to base64)
 * @param {Array} sections - Array of all sections
 * @param {Function} blobUrlToBase64 - Function to convert blob URL to base64
 * @returns {Promise<Array>} Promise resolving to prepared sections
 */
export async function prepareParallaxSectionsForSave(sections, blobUrlToBase64) {
  const sectionsClone = JSON.parse(JSON.stringify(sections))

  for (const section of sectionsClone) {
    if (section.type === 'parallax' && section.slides) {
      for (const slide of section.slides) {
        // Convert blob URLs only, preserve GitHub URLs and data URLs
        if (slide.bgImg && slide.bgImg.startsWith('blob:')) {
          slide.bgImg = await blobUrlToBase64(slide.bgImg)
        }
      }
    }
  }

  return sectionsClone
}

/**
 * Generate CSS styles for parallax sections (for HTML export)
 * @returns {string} CSS string for parallax sections
 */
export function getParallaxCSS() {
  return `
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

        /* Responsive Design - Media Queries for Parallax */
        /* Laptop/Tablet landscape: 768px - 1199px */
        @media (min-width: 768px) and (max-width: 1199px) {
            .parallax-slide-content {
                max-width: min(600px, 90%);
            }
        }

        /* Tablet portrait: 480px - 767px */
        @media (min-width: 480px) and (max-width: 767px) {
            .parallax-slide-content {
                max-width: 95%;
            }
        }

        /* Mobile: 0 - 479px */
        @media (max-width: 479px) {
            .parallax-slide-content {
                max-width: 95%;
                border-radius: 4px;
            }
        }
    `
}

/**
 * Generate JavaScript code for parallax scrolling effect (for HTML export)
 * @returns {string} JavaScript code string for parallax effect
 */
export function getParallaxJavaScript() {
  return `
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
    `
}

