/**
 * Image Block Service
 * 
 * This service handles all image block operations including:
 * - Adding normal image blocks
 * - Adding fullwidth image blocks
 * - Adding float image blocks
 * - Image upload and processing
 */

import * as dialog from '@/utils/dialog'
import { localhostToLocal, localToLocalhost } from '@/utils/imageUrlUtils'
import { checkImageConflict } from '@/services/apiService'
import { promptInput } from '@/utils/inputModal'
import { uploadImage } from '@/services/imageProcessingService'

/**
 * Add a normal image block to the current section
 * @param {Object} context - Editor context { sections, currSection, currBlock, selected }
 * @param {string} src - Image source URL
 * @param {string} sourceType - Source type: 'url', 'local', or 'upload'
 * @returns {Promise<void>}
 */
export async function addImageBlock(context, src, sourceType = 'url') {
    const { currSection, currBlock, selected } = context

    const sec = currSection.value
    if (!sec) {
        await dialog.warning('Please select a section first.\n\nClick on a section to select it before adding content.', {
            title: 'No Section Selected',
            icon: '⚠️'
        })
        return
    }

    const imgEl = new Image()

    // Convert internal URL to display URL for loading
    // For 'local' sourceType, convert local:// to display URL
    let displayUrl = src
    if (sourceType === 'local') {
        displayUrl = localToLocalhost(src)
    }

    // Handle image load error
    imgEl.onerror = async () => {
        let errorMessage = 'Failed to load image.\n\nThe image URL may be invalid or the image may not be accessible.'
        if (sourceType === 'local') {
            errorMessage = 'Failed to load image from local storage.\n\nPlease ensure the backend server is running (localhost:3001).'
        } else if (sourceType === 'upload') {
            errorMessage = 'Failed to load uploaded image.\n\nThe image file may be corrupted or invalid.'
        }
        await dialog.error(errorMessage, {
            title: 'Image Load Error',
            icon: '⚠️'
        })
    }

    imgEl.onload = () => {
        const naturalW = imgEl.naturalWidth || 300
        const naturalH = imgEl.naturalHeight || 300
        const ratio = naturalW / naturalH || 1

        const imageObj = {
            id: Date.now() + Math.random(),
            src,
            sourceType, // 'url' for external URLs, 'upload' for uploaded files (data URLs)
            width: naturalW,
            height: naturalH,
            aspectRatio: ratio,
            keepRatio: true,
            caption: '',
            captionPosition: 'bottom',
            captionBubbleAnimated: false,
            captionFontSize: '0.9rem',
        }

        const blk = currBlock.value
        if (blk && blk.type === 'image') {
            ensureImagesArray(blk)
            if (blk.images.length < 4) {
                blk.images.push(imageObj)
                selected.value = { type: 'image', sectionId: sec.id, blockId: blk.id, imageIndex: blk.images.length - 1 }
                return
            }
        }

        const newBlock = {
            id: Date.now(),
            type: 'image',
            images: [imageObj],
            layout: 'inline'
        }
        sec.blocks.push(newBlock)
        selected.value = { type: 'image', sectionId: sec.id, blockId: newBlock.id, imageIndex: 0 }
    }
    imgEl.src = displayUrl
}

/**
 * Add a fullwidth image block to the current section
 * @param {Object} context - Editor context { sections, currSection, currBlock, selected }
 * @param {string} src - Image source URL
 * @param {string} sourceType - Source type: 'url', 'local', or 'upload'
 * @returns {Promise<void>}
 */
export async function addFullWidthImageBlock(context, src, sourceType = 'url') {
    const { currSection, currBlock, selected } = context

    const sec = currSection.value
    if (!sec) {
        await dialog.warning('Please select a section first.\n\nClick on a section to select it before adding content.', {
            title: 'No Section Selected',
            icon: '⚠️'
        })
        return
    }

    const imgEl = new Image()

    // Convert internal URL to display URL for loading
    // For 'local' sourceType, convert local:// to display URL
    let displayUrl = src
    if (sourceType === 'local') {
        displayUrl = localToLocalhost(src)
    }

    // Handle image load error
    imgEl.onerror = async () => {
        let errorMessage = 'Failed to load image.\n\nThe image URL may be invalid or the image may not be accessible.'
        if (sourceType === 'local') {
            errorMessage = 'Failed to load image from local storage.\n\nPlease ensure the backend server is running (localhost:3001).'
        } else if (sourceType === 'upload') {
            errorMessage = 'Failed to load uploaded image.\n\nThe image file may be corrupted or invalid.'
        }
        await dialog.error(errorMessage, {
            title: 'Image Load Error',
            icon: '⚠️'
        })
    }

    imgEl.onload = () => {
        const naturalW = imgEl.naturalWidth || 1
        const naturalH = imgEl.naturalHeight || 1
        const aspectRatio = naturalW / naturalH

        // Check if there's an existing fullwidth-image block selected
        // If so, update it instead of creating a new one (preserves mode and height settings)
        const existingBlk = currBlock.value
        if (existingBlk && existingBlk.type === 'fullwidth-image' && existingBlk.image) {
            // Update existing block - preserve mode, height, and caption settings
            existingBlk.image.src = src
            existingBlk.image.sourceType = sourceType
            existingBlk.image.aspectRatio = aspectRatio
            // Preserve existing mode, height, caption, and caption properties
            if (existingBlk.image.mode == null) {
                existingBlk.image.mode = 'auto'
            }
            if (existingBlk.image.height == null) {
                existingBlk.image.height = 400
            }
            if (existingBlk.image.captionPosition == null) {
                existingBlk.image.captionPosition = 'bottom'
            }
            if (existingBlk.image.captionBubbleAnimated == null) {
                existingBlk.image.captionBubbleAnimated = false
            }
            if (existingBlk.image.caption == null) {
                existingBlk.image.caption = ''
            }
            return
        }

        // Create new block if no existing fullwidth-image block is selected
        const blk = {
            id: Date.now(),
            type: 'fullwidth-image',
            image: {
                id: Date.now() + Math.random(),
                src,
                sourceType, // 'url' for external URLs, 'upload' for uploaded files
                aspectRatio,
                captionPosition: 'bottom',
                captionBubbleAnimated: false,
                captionFontSize: '0.9rem',
                mode: 'auto',
                height: 400,      // only in mode='fixed'
                caption: '',
            }
        }

        sec.blocks.push(blk)
        selected.value = { type: 'fullwidth-image', sectionId: sec.id, blockId: blk.id }
    }
    imgEl.src = displayUrl
}

/**
 * Add a float image block to the current section
 * @param {Object} context - Editor context { sections, currSection, currBlock, selected }
 * @param {string} src - Image source URL
 * @param {string} sourceType - Source type: 'url', 'local', or 'upload'
 * @returns {Promise<void>}
 */
export async function addFloatImageBlock(context, src, sourceType = 'url') {
    const { currSection, selected } = context

    const sec = currSection.value
    if (!sec) {
        await dialog.warning('Please select a section first.\n\nClick on a section to select it before adding content.', {
            title: 'No Section Selected',
            icon: '⚠️'
        })
        return
    }

    const imgEl = new Image()

    // Convert internal URL to display URL for loading
    // For 'local' sourceType, convert local:// to display URL
    let displayUrl = src
    if (sourceType === 'local') {
        displayUrl = localToLocalhost(src)
    }

    // Handle image load error
    imgEl.onerror = async () => {
        let errorMessage = 'Failed to load image.\n\nThe image URL may be invalid or the image may not be accessible.'
        if (sourceType === 'local') {
            errorMessage = 'Failed to load image from local storage.\n\nPlease ensure the backend server is running (localhost:3001).'
        } else if (sourceType === 'upload') {
            errorMessage = 'Failed to load uploaded image.\n\nThe image file may be corrupted or invalid.'
        }
        await dialog.error(errorMessage, {
            title: 'Image Load Error',
            icon: '⚠️'
        })
    }

    imgEl.onload = () => {
        const naturalW = imgEl.naturalWidth || 1
        const naturalH = imgEl.naturalHeight || 1
        const aspectRatio = naturalW / naturalH || 1

        const blk = {
            id: Date.now(),
            type: 'float-image',
            image: {
                id: Date.now() + Math.random(),
                src,
                sourceType, // 'url' for external URLs, 'upload' for uploaded files
                align: 'right',
                widthPercent: 45,
                keepRatio: true,
                aspectRatio: aspectRatio,
                caption: '',
                captionFontSize: '0.9rem',
            },
            text: '<p>Enter your text here…</p>',
        }

        sec.blocks.push(blk)
        selected.value = { type: 'float-image', sectionId: sec.id, blockId: blk.id }
    }
    imgEl.src = displayUrl
}

/**
 * Helper function to ensure images array exists in image block
 * @param {Object} blk - Image block
 */
function ensureImagesArray(blk) {
    if (!blk || blk.type !== 'image') return
    if (Array.isArray(blk.images)) {
        blk.images.forEach(img => {
            if (img && img.captionPosition == null) {
                img.captionPosition = 'bottom'
            }
        })
        return
    }

    const { src, width, height, aspectRatio, keepRatio, caption, captionPosition, captionBubbleAnimated } = blk
    const img = src ? {
        id: Date.now(),
        src,
        width,
        height,
        aspectRatio,
        keepRatio,
        caption: caption || '',
        captionPosition: captionPosition || 'bottom',
        captionBubbleAnimated: captionBubbleAnimated || false,
    } : null

    blk.images = img ? [img] : []

    delete blk.src
    delete blk.width
    delete blk.height
    delete blk.aspectRatio
    delete blk.keepRatio
    delete blk.caption
    delete blk.captionPosition
}

/**
 * Process and upload image file
 * Uses unified image processing service (converts to AVIF, saves to local database)
 * @param {File} file - Image file to upload
 * @param {string} imageType - Type of image: 'normal', 'fullwidth', or 'float'
 * @param {Object} context - Editor context
 * @param {Function} onSuccess - Callback when upload succeeds
 * @param {Function} onError - Callback when upload fails
 * @returns {Promise<void>}
 */
export async function processImageUpload(file, imageType, context, onSuccess, onError) {
    try {
        const originalFileName = file.name

        // Check if file with same name exists in GitHub before uploading (optional check)
        // Note: This is just a warning, actual GitHub upload happens separately via Storage Manager
        try {
            const conflictCheck = await checkImageConflict(originalFileName)
            if (conflictCheck.ok && conflictCheck.data?.exists) {
                // File exists in GitHub, ask user what to do
                const conflictInfo = conflictCheck.data

                // First, ask user if they want to overwrite or rename
                const overwriteChoice = await dialog.warning(
                    `File "${originalFileName}" already exists on GitHub.\n\nPath: ${conflictInfo.path}\n\nPlease select the operation:`,
                    {
                        title: 'File name conflict',
                        icon: '⚠️',
                        confirmText: 'Overwrite',
                        cancelText: 'Rename'
                    }
                )

                if (!overwriteChoice) {
                    // User chose to rename (or cancelled) - prompt for new filename
                    const newFilename = await promptInput({
                        icon: '✎',
                        title: 'Rename File',
                        label: 'New File Name',
                        placeholder: 'Enter a new file name...',
                        defaultValue: originalFileName,
                        confirmText: 'Confirm',
                        cancelText: 'Cancel',
                        required: true
                    })

                    if (!newFilename || !newFilename.trim()) {
                        // User cancelled renaming
                        if (onError) onError(new Error('Upload cancelled by user'))
                        return
                    }

                    // Use the new filename
                    file.renamedFilename = newFilename.trim()
                }
            }
        } catch (checkError) {
            // If conflict check fails (e.g., GitHub not configured), continue anyway
            console.warn('Failed to check image conflict:', checkError)
            // Don't block upload if conflict check fails
        }

        // Use unified image upload service (converts to AVIF, saves to local database)
        const fileNameToUse = file.renamedFilename || originalFileName
        const result = await uploadImage(file, fileNameToUse)

        // Call the appropriate add function based on image type
        // sourceType: 'local' for localhost (internal storage)
        if (imageType === 'normal') {
            await addImageBlock(context, result.localUrl, 'local')
        } else if (imageType === 'fullwidth') {
            await addFullWidthImageBlock(context, result.localUrl, 'local')
        }

        if (onSuccess) onSuccess(result.localUrl)
    } catch (error) {
        console.error('Image processing error:', error)
        await dialog.error('Failed to process image.\n\nAn error occurred while processing the image.', {
            title: 'Processing Error'
        })
        if (onError) onError(error)
    }
}

/**
 * Add image from URL
 * @param {string} url - Image URL
 * @param {string} imageType - Type of image: 'normal', 'fullwidth', or 'float'
 * @param {Object} context - Editor context
 * @returns {Promise<void>}
 */
export async function addImageFromUrl(url, imageType, context) {
    try {
        // Validate URL
        new URL(url)

        if (imageType === 'normal') {
            await addImageBlock(context, url, 'url')
        } else if (imageType === 'fullwidth') {
            await addFullWidthImageBlock(context, url, 'url')
        } else if (imageType === 'float') {
            await addFloatImageBlock(context, url, 'url')
        }
    } catch (error) {
        await dialog.warning('Please enter a valid URL.\n\nThe URL must start with http:// or https://', {
            title: 'Invalid URL',
            icon: '⚠️'
        })
    }
}

/**
 * Generate CSS styles for image blocks (for HTML export)
 * Uses styles from the editor for consistency
 * @returns {string} CSS string for image blocks
 */
export function getImageBlockCSS() {
    return `
        /* Base Image Block */
        .image-block {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: clamp(8px, 1.5vw, 10px) 0;
            padding: 0;
        }

        .block-wrapper.fullwidth-wrapper {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        .image-block img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            object-fit: cover;
            transition: all 0.2s ease;
        }

        /* Multi-Image Grid */
        .image-grid {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: center;
        }


        .image-cell {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .image-selected {
            outline: 2px solid #8ab4ff;
            outline-offset: 2px;
        }

        /* Caption Styles */
        .image-caption {
            font-size: 0.9rem;
            color: #666;
            margin-top: 4px;
            line-height: 1.4;
            text-align: center;
            font-style: italic;
        }

        /* bottom caption */
        .image-caption.bottom {
            text-align: center;
            margin-top: 6px;
            display: block;
            width: 100%;
        }

        /* bubble caption */
        .image-caption.bubble {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.65);
            color: #fff;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.85rem;
            line-height: 1.3;
            max-width: 70%;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        .image-block:hover .image-caption.bubble,
        .fullwidth-image-block:hover .image-caption.bubble {
            opacity: 1;
        }

        .image-caption.bubble.animated {
            animation: fadeInBubble 0.4s ease-in-out forwards;
        }

        @keyframes fadeInBubble {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Fullwidth Image Block */
        .fullwidth-image-block {
            width: 100%;
            max-width: 100%;
            display: block;
            position: relative;
            margin: 0;
            padding: 0;
        }

        .fullwidth-image-block img {
            width: 100%;
            max-width: 100%;
            height: auto;
            border-radius: 0;
            display: block;
            position: relative;
            transition: all 0.2s ease;
        }

        .fullwidth-image-block .image-caption {
            font-size: 0.9rem;
            color: #666;
            margin-top: 4px;
            line-height: 1.4;
            text-align: center;
            font-style: italic;
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
            .image-cell {
                max-width: 100%;
            }
        }

        @media (max-width: 767px) {
            .float-image-block,
            .float-image-text {
                width: 100% !important;
            }

            .float-image-block {
                margin: 10px auto !important;
                text-align: center;
                max-width: 90%;
            }
        }

        @media (max-width: 479px) {
            .float-image-block {
                max-width: 100%;
            }
        }
    `
}

/**
 * Build HTML for a normal image block
 * @param {Object} block - Image block object
 * @returns {string} - HTML string
 */
export function buildImageBlockHTML(block) {
    if (!block || block.type !== 'image') return '';
    if (!block.images || !Array.isArray(block.images) || block.images.length === 0) return '';

    const imageHTML = block.images.map(img => {
        const src = localToLocalhost(img.src || '');
        const w = img.width ? `width:${img.width}px;max-width:100%;` : 'max-width:100%;';
        const h = img.keepRatio ? `height:auto;` : (img.height ? `height:${img.height}px;` : 'height:auto;');
        const fit = img.keepRatio ? 'object-fit:contain;' : 'object-fit:fill;';
        const captionPos = img.captionPosition || 'bottom';
        const captionAnim = img.captionBubbleAnimated ? 'animated' : '';
        const captionFont = img.captionFontSize ? `font-size:${img.captionFontSize};` : '';
        const captionHTML = img.caption
            ? `<figcaption class="image-caption ${captionPos} ${captionAnim}" style="${captionFont}">${img.caption}</figcaption>`
            : '';

        return `
      <div class="image-cell" style="position:relative;">
        <img src="${src}" style="${w}${h}${fit}object-position:center;display:block;" />
        ${captionHTML}
      </div>
    `;
    }).join('');

    return `
    <div class="block-wrapper">
      <figure class="image-block">
        <div class="image-grid">
            ${imageHTML}
        </div>
      </figure>
    </div>
  `;
}

/**
 * Build HTML for a fullwidth image block
 * @param {Object} block - Fullwidth image block object
 * @returns {string} - HTML string
 */
export function buildFullwidthImageBlockHTML(block) {
    if (!block || block.type !== 'fullwidth-image') return '';
    if (!block.image || !block.image.src) return '';

    const img = block.image;
    const src = localToLocalhost(img.src || '');
    const mode = img.mode || 'auto';
    const height = img.height || 400;
    const fit = mode === 'fixed' ? 'object-fit:cover;' : 'object-fit:contain;';
    const heightStyle = mode === 'fixed' ? `height:${height}px;` : 'height:auto;';
    const captionPos = img.captionPosition || 'bottom';
    const captionAnim = img.captionBubbleAnimated ? 'animated' : '';
    const captionFont = img.captionFontSize ? `font-size:${img.captionFontSize};` : '';
    const captionHTML = img.caption
        ? `<figcaption class="image-caption ${captionPos} ${captionAnim}" style="${captionFont}">${img.caption}</figcaption>`
        : '';

    return `
    <div class="block-wrapper fullwidth-wrapper">
      <figure class="fullwidth-image-block" style="position:relative;">
        <img src="${src}" class="fullwidth-image" style="width:100%;display:block;${fit}${heightStyle}" alt="" />
        ${captionHTML}
      </figure>
    </div>
  `;
}


/**
 * Build HTML for a float image block
 * @param {Object} block - Float image block object
 * @returns {string} - HTML string
 */
export function buildFloatImageBlockHTML(block) {
    if (!block || block.type !== 'float-image') {
        return ''
    }

    // Handle float image with text
    if (!block.image || !block.image.src) {
        return ''
    }

    const img = block.image
    // For export, URLs may already be base64 (from exportHelpers), so only convert if it's local://
    // For display, convert local:// to localhost URL
    const src = img.src && img.src.startsWith('local://')
        ? localToLocalhost(img.src)
        : (img.src || '')
    const align = img.align || 'right'
    const widthPercent = img.widthPercent || 45

    // Handle caption position and animation
    const captionPos = img.captionPosition || 'bottom'
    const captionAnim = img.captionBubbleAnimated ? 'animated' : ''
    const captionFont = img.captionFontSize ? `font-size:${img.captionFontSize};` : '';
    const captionHTML = img.caption
        ? `<figcaption class="image-caption ${captionPos} ${captionAnim}" style="${captionFont}">${img.caption}</figcaption>`
        : '';

    const text = block.text || '<p></p>'

    return `
        <div class="block-wrapper">
            <div class="float-image-container" style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;">
                <figure class="float-image-block ${captionPos === 'right' ? 'caption-right' : ''} ${captionPos === 'bubble' ? 'caption-bubble' : ''} ${captionAnim ? 'bubble-anim' : ''}" style="width:${widthPercent}%;margin:0;position:relative;${align === 'left' ? 'order:1;' : 'order:2;'}">
                    <img src="${src}" style="width:100%;height:auto;display:block;" alt="" />
                    ${captionHTML}
                </figure>
                <div class="float-text-content" style="flex:1;min-width:200px;${align === 'left' ? 'order:2;' : 'order:1;'}">
                    <div class="prose max-w-none">${text}</div>
                </div>
            </div>
        </div>
    `
}
