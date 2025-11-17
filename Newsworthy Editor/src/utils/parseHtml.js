import { parseVideoBlockFromHTML } from '@/services/videoBlockService'
import { parseSectionFromHTML } from '@/services/sectionService'

export function parseHtmlToSections(htmlContent) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const sections = [];
    
    let sectionElements = doc.querySelectorAll('.section-block');
    if (sectionElements.length === 0) {
      sectionElements = doc.querySelectorAll('.section');
    }
    
    sectionElements.forEach((sectionEl, index) => {
      // Use service to parse section
      const section = parseSectionFromHTML(sectionEl, index);
      
      const blockWrappers = sectionEl.querySelectorAll('.block-wrapper');
      
      blockWrappers.forEach((wrapper, blockIndex) => {
        const textWrapper = wrapper.querySelector('.text-wrapper');
        if (textWrapper) {
          const prose = textWrapper.querySelector('.prose');
          const block = {
            id: Date.now() + index * 1000 + blockIndex,
            type: 'text',
            html: prose ? prose.innerHTML : '<p></p>',
            align: 'left',
            props: {
              width: '65ch'
            }
          };
          
          const wrapperStyle = textWrapper.getAttribute('style') || '';
          const widthMatch = wrapperStyle.match(/--block-max:\s*([^;]+)/);
          if (widthMatch) {
            block.props.width = widthMatch[1].trim();
          }
          
          section.blocks.push(block);
        }
        
        const imageBlock = wrapper.querySelector('.image-block');
        if (imageBlock) {
          const imageCells = imageBlock.querySelectorAll('.image-cell');
          if (imageCells.length > 0) {
            // Handle multiple images in a grid
            const images = [];
            imageCells.forEach((cell, imgIndex) => {
              const img = cell.querySelector('img');
              if (img) {
                const imgStyle = img.getAttribute('style') || '';
                const src = img.getAttribute('src') || '';
                const captionEl = cell.querySelector('.image-caption');
                
                // Extract caption and its properties
                const caption = captionEl ? captionEl.textContent : '';
                let captionPosition = 'bottom';
                let captionBubbleAnimated = false;
                
                if (captionEl) {
                  const captionClasses = captionEl.className || '';
                  // Check for bubble position
                  if (captionClasses.includes('bubble')) {
                    captionPosition = 'bubble';
                    captionBubbleAnimated = captionClasses.includes('animated');
                  } else if (captionClasses.includes('bottom')) {
                    captionPosition = 'bottom';
                  } else if (captionClasses.includes('top')) {
                    captionPosition = 'top';
                  }
                }
                
                const widthMatch = imgStyle.match(/width:\s*(\d+)px/);
                const heightMatch = imgStyle.match(/height:\s*(\d+)px/);
                const objectFit = imgStyle.includes('object-fit:contain');
                
                const width = widthMatch ? parseInt(widthMatch[1], 10) : 300;
                const height = heightMatch ? parseInt(heightMatch[1], 10) : 300;
                const aspectRatio = width / height;
                
                images.push({
                  id: Date.now() + index * 1000 + blockIndex + imgIndex * 0.1,
                  src: src,
                  width: width,
                  height: height,
                  aspectRatio: aspectRatio,
                  keepRatio: objectFit,
                  caption: caption,
                  captionPosition: captionPosition,
                  captionBubbleAnimated: captionBubbleAnimated,
                });
              }
            });
            
            if (images.length > 0) {
              const block = {
                id: Date.now() + index * 1000 + blockIndex,
                type: 'image',
                images: images,
                layout: 'inline'
              };
              section.blocks.push(block);
            }
          } else {
            // Handle single image (backward compatibility)
            const img = imageBlock.querySelector('img');
            if (img) {
              const imgStyle = img.getAttribute('style') || '';
              const src = img.getAttribute('src') || '';
              const captionEl = imageBlock.querySelector('.image-caption');
              
              // Extract caption and its properties
              const caption = captionEl ? captionEl.textContent : '';
              let captionPosition = 'bottom';
              let captionBubbleAnimated = false;
              
              if (captionEl) {
                const captionClasses = captionEl.className || '';
                if (captionClasses.includes('bubble')) {
                  captionPosition = 'bubble';
                  captionBubbleAnimated = captionClasses.includes('animated');
                } else if (captionClasses.includes('bottom')) {
                  captionPosition = 'bottom';
                } else if (captionClasses.includes('top')) {
                  captionPosition = 'top';
                }
              }
              
              const widthMatch = imgStyle.match(/width:\s*(\d+)px/);
              const heightMatch = imgStyle.match(/height:\s*(\d+)px/);
              const objectFit = imgStyle.includes('object-fit:contain');
              
              const width = widthMatch ? parseInt(widthMatch[1], 10) : 300;
              const height = heightMatch ? parseInt(heightMatch[1], 10) : 300;
              const aspectRatio = width / height;
              
              const block = {
                id: Date.now() + index * 1000 + blockIndex,
                type: 'image',
                images: [{
                  id: Date.now() + index * 1000 + blockIndex + 0.1,
                  src: src,
                  width: width,
                  height: height,
                  aspectRatio: aspectRatio,
                  keepRatio: objectFit,
                  caption: caption,
                  captionPosition: captionPosition,
                  captionBubbleAnimated: captionBubbleAnimated,
                }],
                layout: 'inline'
              };
              
              section.blocks.push(block);
            }
          }
        }
        
        const fullwidthImageBlock = wrapper.querySelector('.fullwidth-image-block');
        if (fullwidthImageBlock) {
          const img = fullwidthImageBlock.querySelector('img');
          if (img) {
            const imgStyle = img.getAttribute('style') || '';
            const src = img.getAttribute('src') || '';
            const captionEl = fullwidthImageBlock.querySelector('.image-caption');
            
            // Extract caption and its properties
            const caption = captionEl ? captionEl.textContent : '';
            let captionPosition = 'bottom';
            let captionBubbleAnimated = false;
            
            if (captionEl) {
              const captionClasses = captionEl.className || '';
              if (captionClasses.includes('bubble')) {
                captionPosition = 'bubble';
                captionBubbleAnimated = captionClasses.includes('animated');
              } else if (captionClasses.includes('bottom')) {
                captionPosition = 'bottom';
              } else if (captionClasses.includes('top')) {
                captionPosition = 'top';
              }
            }
            
            const isCover = imgStyle.includes('object-fit:cover');
            const heightMatch = imgStyle.match(/height:\s*(\d+)px/);
            
            // Try to calculate aspectRatio from width/height in style, or use default 16:9
            let aspectRatio = 16 / 9; // default
            const widthMatch = imgStyle.match(/width:\s*(\d+)(?:px|%)/);
            if (widthMatch && heightMatch) {
              // If both width and height are specified, calculate ratio
              const width = parseInt(widthMatch[1], 10);
              const height = parseInt(heightMatch[1], 10);
              if (width > 0 && height > 0) {
                aspectRatio = width / height;
              }
            }
            
            const block = {
              id: Date.now() + index * 1000 + blockIndex,
              type: 'fullwidth-image',
              image: {
                id: Date.now() + index * 1000 + blockIndex + 0.1,
                src: src,
                mode: isCover ? 'fixed' : 'auto',
                height: heightMatch ? parseInt(heightMatch[1], 10) : 400,
                aspectRatio: aspectRatio,
                caption: caption,
                captionPosition: captionPosition,
                captionBubbleAnimated: captionBubbleAnimated,
              }
            };
            
            section.blocks.push(block);
          }
        }
        
        const floatImageContainer = wrapper.querySelector('.float-image-container');
        if (floatImageContainer) {
          const floatImageBlock = floatImageContainer.querySelector('.float-image-block');
          const floatTextContent = floatImageContainer.querySelector('.float-text-content');
          
          if (floatImageBlock) {
            const img = floatImageBlock.querySelector('img');
            if (img) {
              const src = img.getAttribute('src') || '';
              const captionEl = floatImageBlock.querySelector('.image-caption');
              const blockStyle = floatImageBlock.getAttribute('style') || '';
              
              // Extract caption and its properties
              const caption = captionEl ? captionEl.textContent : '';
              let captionPosition = 'bottom';
              let captionBubbleAnimated = false;
              
              if (captionEl) {
                const captionClasses = captionEl.className || '';
                if (captionClasses.includes('bubble')) {
                  captionPosition = 'bubble';
                  captionBubbleAnimated = captionClasses.includes('animated');
                } else if (captionClasses.includes('bottom')) {
                  captionPosition = 'bottom';
                } else if (captionClasses.includes('top')) {
                  captionPosition = 'top';
                } else if (captionClasses.includes('right')) {
                  captionPosition = 'right';
                }
              }
              
              const widthMatch = blockStyle.match(/width:\s*(\d+)%/);
              const widthPercent = widthMatch ? parseInt(widthMatch[1], 10) : 45;
              const align = blockStyle.includes('order:1') ? 'left' : 'right';
              
              const prose = floatTextContent ? floatTextContent.querySelector('.prose') : null;
              const text = prose ? prose.innerHTML : '<p></p>';
              
              const block = {
                id: Date.now() + index * 1000 + blockIndex,
                type: 'float-image',
                image: {
                  id: Date.now() + index * 1000 + blockIndex + 0.1,
                  src: src,
                  align: align,
                  widthPercent: widthPercent,
                  keepRatio: true,
                  aspectRatio: 1,
                  caption: caption,
                  captionPosition: captionPosition,
                  captionBubbleAnimated: captionBubbleAnimated,
                },
                text: text
              };
              
              section.blocks.push(block);
            }
          }
        }
      });
      
      const textBlocks = sectionEl.querySelectorAll('.text-block');
      textBlocks.forEach((textEl, blockIndex) => {
        if (textEl.closest('.block-wrapper')) return;
        
        const block = {
          id: Date.now() + index * 2000 + blockIndex,
          type: 'text',
          html: textEl.innerHTML,
          align: 'left',
          props: {
            width: '65ch'
          }
        };
        
        const style = textEl.getAttribute('style') || '';
        const widthMatch = style.match(/max-width:\s*([^;]+)/);
        if (widthMatch) {
          block.props.width = widthMatch[1].trim();
        }
        
        section.blocks.push(block);
      });
      
      const imageBlocks = sectionEl.querySelectorAll('figure.image-block');
      imageBlocks.forEach((figureEl, blockIndex) => {
        if (figureEl.closest('.block-wrapper')) return;
        
        const imageCells = figureEl.querySelectorAll('.image-cell');
        if (imageCells.length > 0) {
          // Handle multiple images in a grid
          const images = [];
          imageCells.forEach((cell, imgIndex) => {
            const img = cell.querySelector('img');
            if (img) {
              const imgStyle = img.getAttribute('style') || '';
              const src = img.getAttribute('src') || '';
              const captionEl = cell.querySelector('.image-caption');
              
              // Extract caption and its properties
              const caption = captionEl ? captionEl.textContent : '';
              let captionPosition = 'bottom';
              let captionBubbleAnimated = false;
              
              if (captionEl) {
                const captionClasses = captionEl.className || '';
                if (captionClasses.includes('bubble')) {
                  captionPosition = 'bubble';
                  captionBubbleAnimated = captionClasses.includes('animated');
                } else if (captionClasses.includes('bottom')) {
                  captionPosition = 'bottom';
                } else if (captionClasses.includes('top')) {
                  captionPosition = 'top';
                }
              }
              
              const widthMatch = imgStyle.match(/width:\s*(\d+)px/);
              const heightMatch = imgStyle.match(/height:\s*(\d+)px/);
              const objectFit = imgStyle.includes('object-fit:contain') || imgStyle.includes('object-fit: contain');
              
              const width = widthMatch ? parseInt(widthMatch[1], 10) : 300;
              const height = heightMatch ? parseInt(heightMatch[1], 10) : 300;
              const aspectRatio = width / height;
              
              images.push({
                id: Date.now() + index * 2000 + blockIndex + 500 + imgIndex * 0.1,
                src: src,
                width: width,
                height: height,
                aspectRatio: aspectRatio,
                keepRatio: objectFit,
                caption: caption,
                captionPosition: captionPosition,
                captionBubbleAnimated: captionBubbleAnimated,
              });
            }
          });
          
          if (images.length > 0) {
            const block = {
              id: Date.now() + index * 2000 + blockIndex + 500,
              type: 'image',
              images: images,
              layout: 'inline'
            };
            section.blocks.push(block);
          }
        } else {
          // Handle single image (backward compatibility)
          const img = figureEl.querySelector('img');
          if (img) {
            const imgStyle = img.getAttribute('style') || '';
            const src = img.getAttribute('src') || '';
            const captionEl = figureEl.querySelector('.image-caption');
            
            // Extract caption and its properties
            const caption = captionEl ? captionEl.textContent : '';
            let captionPosition = 'bottom';
            let captionBubbleAnimated = false;
            
            if (captionEl) {
              const captionClasses = captionEl.className || '';
              if (captionClasses.includes('bubble')) {
                captionPosition = 'bubble';
                captionBubbleAnimated = captionClasses.includes('animated');
              } else if (captionClasses.includes('bottom')) {
                captionPosition = 'bottom';
              } else if (captionClasses.includes('top')) {
                captionPosition = 'top';
              }
            }
            
            const widthMatch = imgStyle.match(/width:\s*(\d+)px/);
            const heightMatch = imgStyle.match(/height:\s*(\d+)px/);
            const objectFit = imgStyle.includes('object-fit:contain') || imgStyle.includes('object-fit: contain');
            
            const width = widthMatch ? parseInt(widthMatch[1], 10) : 300;
            const height = heightMatch ? parseInt(heightMatch[1], 10) : 300;
            const aspectRatio = width / height;
            
            const block = {
              id: Date.now() + index * 2000 + blockIndex + 500,
              type: 'image',
              images: [{
                id: Date.now() + index * 2000 + blockIndex + 500.1,
                src: src,
                width: width,
                height: height,
                aspectRatio: aspectRatio,
                keepRatio: objectFit,
                caption: caption,
                captionPosition: captionPosition,
                captionBubbleAnimated: captionBubbleAnimated,
              }],
              layout: 'inline'
            };
            
            section.blocks.push(block);
          }
        }
      });
      
      const videoBlocks = sectionEl.querySelectorAll('.video-block');
      videoBlocks.forEach((videoEl, blockIndex) => {
        const block = parseVideoBlockFromHTML(videoEl, index * 3000 + blockIndex);
        if (block) {
          section.blocks.push(block);
        }
      });
      
      sections.push(section);
    });
    
    return sections;
  } catch (error) {
    console.error('Failed to parse HTML:', error);
    throw new Error('Failed to parse HTML content: ' + error.message);
  }
}

export function isEditableHtml(htmlContent) {
  if (!htmlContent) return false;
  
  const hasExpectedStructure = 
    htmlContent.includes('section') ||
    htmlContent.includes('canvas-area') ||
    htmlContent.includes('block-wrapper') ||
    htmlContent.includes('text-wrapper');
    
  return hasExpectedStructure;
}

