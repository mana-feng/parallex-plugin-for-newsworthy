import { defineStore } from "pinia";
import { ref, computed, shallowRef } from "vue";
import * as dialog from '@/utils/dialog';
import { addImageBlock as addImageBlockService, addFullWidthImageBlock as addFullWidthImageBlockService, addFloatImageBlock as addFloatImageBlockService, getImageBlockCSS } from '@/services/imageBlockService';
import * as parallaxService from '@/services/parallaxService';
import { extractYouTubeId, createVideoBlock, updateVideoDimensions } from '@/services/videoBlockService';
import { exportToHTML as exportToHTMLProcess } from '@/processes/html-export';
import { prepareSectionsForSave as prepareSectionsForSaveProcess } from '@/processes/html-save';
import { blobUrlToBase64 as blobUrlToBase64Helper } from '@/processes/html-export';

export const useEditorStore = defineStore('editor', () => {
    const sections = ref([])

    const currentPageInfo = ref({
        filename: null,
        title: null,
        isLoaded: false
    })

    const selected = ref({
        type: null,
        sectionId: null,
        blockId: null,
        imageIndex: null,
        part: null,
    })

    const activeEditor = shallowRef(null)
    const setActiveEditor = (ed) => {
        activeEditor.value = ed
    }

    const addSection = () => {
        sections.value.push({
            id: Date.now(),
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
        })
    }

    const addParallaxSection = () => {
        sections.value.push(parallaxService.createParallaxSection())
    }

    // TSB新增：在当前选中 section 中创建文本块（text block）
    const addTextBlock = () => {
        const sec = currSection.value;
        if (!sec) return;
        const newBlock = {
            id: Date.now(),
            type: 'text',
            html: '<p>New text block…</p>',
            align: 'left',
            props: {
                width: '65ch'
            }
        };
        sec.blocks.push(newBlock);
        selected.value = { type: 'text', sectionId: sec.id, blockId: newBlock.id };
    };

    // TSB宽度设置：限制并更新文本块的最大宽度（ch/px）
    const setTextBlockWidth = (val, unit = 'ch') => {
        const blk = currBlock.value
        if (!blk || blk.type !== 'text') return

        const n = Number(val)
        if (!isFinite(n)) return

        const u = unit === 'px' ? 'px' : 'ch'
        const clamped =
            u === 'ch' ? Math.max(30, Math.min(120, n)) : Math.max(300, Math.min(1600, n))

        blk.props = blk.props || {}
        blk.props.width = `${clamped}${u}`
    }

    const addImageBlock = async (src, sourceType = 'url') => {
        const context = {
            sections,
            currSection,
            currBlock,
            selected
        }
        await addImageBlockService(context, src, sourceType)
    };

    const addVideoBlock = async (url) => {
        const sec = currSection.value;

        if (!sec) {
            await dialog.warning('Please select a section first.\n\nClick on a section to select it before adding content.', {
                title: 'No Section Selected',
                icon: '⚠️'
            });
            return;
        }

        const newBlock = createVideoBlock(url);

        if (!newBlock) {
            await dialog.error('Invalid YouTube URL.\n\nPlease enter a valid YouTube video link.', {
                title: 'Invalid URL'
            });
            return;
        }

        sec.blocks.push(newBlock);
        selected.value = { type: 'video', sectionId: sec.id, blockId: newBlock.id };
    };

    const setImgKeepRatio = (v) => {
        const img = currImage.value
        if (!img) return
        img.keepRatio = !!v
    }

    const setImgWidth = (w) => {
        const img = currImage.value
        if (!img) return
        const width = Math.max(1, parseInt(w || 0, 10))
        if (img.keepRatio && img.aspectRatio) {
            img.width = width
            img.height = Math.round(width / img.aspectRatio)
        } else {
            img.width = width
        }
    }

    const setImgHeight = (h) => {
        const img = currImage.value
        if (!img) return
        const height = Math.max(1, parseInt(h || 0, 10))
        if (img.keepRatio && img.aspectRatio) {
            img.height = height
            img.width = Math.round(height * img.aspectRatio)
        } else {
            img.height = height
        }
    };

    const setImgCaption = (text) => {
        const img = currImage.value
        if (!img) return
        img.caption = text ?? ''
    }

    const setImgCaptionPosition = (pos) => {
        const img = currImage.value
        if (!img) return
        img.captionPosition = pos
    }

    const setImgCaptionBubbleAnimated = (v) => {
        const img = currImage.value
        if (!img) return
        img.captionBubbleAnimated = !!v
    }
    const setVideoUrl = async (url) => {
        const blk = currBlock.value;
        if (!blk || blk.type !== 'video') return;

        const videoId = extractYouTubeId(url);
        if (!videoId) {
            await dialog.error('Invalid YouTube URL.\n\nPlease enter a valid YouTube video link.', {
                title: 'Invalid URL'
            });
            return;
        }

        blk.url = url;
        blk.videoId = videoId;
    };

    const setVideoWidth = (w) => {
        const blk = currBlock.value;
        if (!blk || blk.type !== 'video') return;
        const width = Math.max(1, parseInt(w || 0, 10));
        updateVideoDimensions(blk, width, undefined, blk.keepRatio);
    };

    const setVideoHeight = (h) => {
        const blk = currBlock.value;
        if (!blk || blk.type !== 'video') return;
        const height = Math.max(1, parseInt(h || 0, 10));
        updateVideoDimensions(blk, undefined, height, blk.keepRatio);
    };

    const setVideoKeepRatio = (v) => {
        const blk = currBlock.value;
        if (!blk || blk.type !== 'video') return;
        blk.keepRatio = !!v;
    };

    const selectSection = (sectionId) => {
        selected.value = { type: 'section', sectionId, blockId: null, imageIndex: null, part: null };
    }

    const selectBlock = (sectionId, blockId, blockType, imageIndex = null, part = null) => {
        selected.value = { type: blockType, sectionId, blockId, imageIndex, part };
    }

    const notSelected = () => {
        selected.value = { type: null, sectionId: null, blockId: null, imageIndex: null, part: null };
        activeEditor.value = null;
    }


    const currSection = computed(() => {
        if (!selected.value.sectionId)
            return null;
        return sections.value.find(s => s.id === selected.value.sectionId) || null;
    })

    const setSecBg = (color) => {
        if (!currSection.value)
            return;
        currSection.value.props.background = color;
        currSection.value.props.bgType = 'color';
    }

    const setSecHeight = (h) => {
        if (!currSection.value)
            return;
        currSection.value.props.height = h;
    }

    const revokeAllBlobs = () => {
        parallaxService.revokeParallaxBlobs(sections.value)

        sections.value.forEach(s => {
            const u = s.props?._blobUrl
            if (u && u.startsWith('blob:')) {
                try { URL.revokeObjectURL(u) } catch { ; }
                s.props._blobUrl = ''
            }
        })
    }

    const extractImageId = (url) => {
        if (!url || typeof url !== 'string') return null

        // Skip GitHub URLs and external URLs
        if (url.includes('github.io') || url.includes('githubusercontent') ||
            (url.startsWith('http') && !url.includes('localhost'))) {
            return null
        }

        // Match local://{uuid} format (UUID is 36 chars with dashes)
        const oldFormatMatch = url.match(/^local:\/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
        if (oldFormatMatch) return oldFormatMatch[1]

        // Match localhost:port/api/images/temp/{uuid} format
        const newFormatMatch = url.match(/^https?:\/\/localhost:\d+\/api\/images\/temp\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i)
        return newFormatMatch ? newFormatMatch[1] : null
    }

    const collectLocalImageIds = () => {
        const imageIds = new Set()

        const parallaxIds = parallaxService.collectParallaxImageIds(sections.value, extractImageId)
        parallaxIds.forEach(id => imageIds.add(id))

        sections.value.forEach(section => {
            if (section.props?.bgImg) {
                const id = extractImageId(section.props.bgImg)
                if (id) {
                    imageIds.add(id)
                }
            }

            if (section.blocks) {
                section.blocks.forEach(block => {
                    if (block.type === 'image' && Array.isArray(block.images)) {
                        block.images.forEach(img => {
                            const id = extractImageId(img.src)
                            if (id) {
                                imageIds.add(id)
                            }
                        })
                    } else if (block.type === 'fullwidth-image' && block.image) {
                        const id = extractImageId(block.image.src)
                        if (id) {
                            imageIds.add(id)
                        }
                    } else if (block.type === 'float-image' && block.image) {
                        const id = extractImageId(block.image.src)
                        if (id) {
                            imageIds.add(id)
                        }
                    } else if (block.type === 'text' && block.html) {
                        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
                        let match
                        while ((match = imgRegex.exec(block.html)) !== null) {
                            const imgSrc = match[1]
                            const id = extractImageId(imgSrc)
                            if (id) {
                                imageIds.add(id)
                            }
                        }
                    }
                })
            }
        })

        return Array.from(imageIds)
    }

    const collectLocalImageDetails = () => {
        const details = []

        const parallaxDetails = parallaxService.collectParallaxImageDetails(sections.value, extractImageId)
        details.push(...parallaxDetails)

        sections.value.forEach((section, sectionIdx) => {
            if (section.props?.bgImg) {
                const id = extractImageId(section.props.bgImg)
                if (id) {
                    details.push({
                        imageId: id,
                        location: `Section ${sectionIdx + 1} background`,
                        url: section.props.bgImg
                    })
                }
            }

            if (section.blocks) {
                section.blocks.forEach((block, blockIdx) => {
                    if (block.type === 'image' && Array.isArray(block.images)) {
                        block.images.forEach((img, imgIdx) => {
                            const id = extractImageId(img.src)
                            if (id) {
                                details.push({
                                    imageId: id,
                                    location: `Section ${sectionIdx + 1} - Block ${blockIdx + 1} (Image) - Image ${imgIdx + 1}`,
                                    url: img.src
                                })
                            }
                        })
                    } else if (block.type === 'fullwidth-image' && block.image) {
                        const id = extractImageId(block.image.src)
                        if (id) {
                            details.push({
                                imageId: id,
                                location: `Section ${sectionIdx + 1} - Block ${blockIdx + 1} (Fullwidth Image)`,
                                url: block.image.src
                            })
                        }
                    } else if (block.type === 'float-image' && block.image) {
                        const id = extractImageId(block.image.src)
                        if (id) {
                            details.push({
                                imageId: id,
                                location: `Section ${sectionIdx + 1} - Block ${blockIdx + 1} (Float Image)`,
                                url: block.image.src
                            })
                        }
                    } else if (block.type === 'text' && block.html) {
                        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
                        let match
                        let imgIdx = 0
                        while ((match = imgRegex.exec(block.html)) !== null) {
                            const imgSrc = match[1]
                            const id = extractImageId(imgSrc)
                            if (id) {
                                imgIdx++
                                details.push({
                                    imageId: id,
                                    location: `Section ${sectionIdx + 1} - Block ${blockIdx + 1} (Text) - Image ${imgIdx}`,
                                    url: imgSrc
                                })
                            }
                        }
                    }
                })
            }
        })

        return details
    }

    const replaceLocalUrls = (urlMapping) => {
        parallaxService.replaceParallaxLocalUrls(sections.value, urlMapping, extractImageId)

        sections.value.forEach(section => {
            if (section.props?.bgImg) {
                const id = extractImageId(section.props.bgImg)
                if (id && urlMapping[id]) {
                    section.props.bgImg = urlMapping[id]
                }
            }

            if (section.blocks) {
                section.blocks.forEach(block => {
                    if (block.type === 'image' && Array.isArray(block.images)) {
                        block.images.forEach(img => {
                            const id = extractImageId(img.src)
                            if (id && urlMapping[id]) {
                                img.src = urlMapping[id]
                                img.sourceType = 'github'
                            }
                        })
                    } else if (block.type === 'fullwidth-image' && block.image) {
                        const id = extractImageId(block.image.src)
                        if (id && urlMapping[id]) {
                            block.image.src = urlMapping[id]
                            block.image.sourceType = 'github'
                        }
                    } else if (block.type === 'float-image' && block.image) {
                        const id = extractImageId(block.image.src)
                        if (id && urlMapping[id]) {
                            block.image.src = urlMapping[id]
                            block.image.sourceType = 'github'
                        }
                    } else if (block.type === 'text' && block.html) {
                        let updatedHtml = block.html

                        Object.entries(urlMapping).forEach(([imageId, githubUrl]) => {
                            const escapedImageId = imageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                            const localhostPattern = new RegExp(
                                `https?://localhost(?::\\d+)?/api/images/temp/${escapedImageId}`,
                                'gi'
                            )
                            const localPattern = new RegExp(
                                `local://${escapedImageId}`,
                                'gi'
                            )

                            updatedHtml = updatedHtml
                                .replace(localhostPattern, githubUrl)
                                .replace(localPattern, githubUrl)
                        })

                        block.html = updatedHtml
                    }
                })
            }
        })
    }

    const currImage = computed(() => {
        const blk = currBlock.value
        if (!blk || blk.type !== 'image') return null

        if (!Array.isArray(blk.images)) return blk

        const idx = selected.value.imageIndex ?? 0
        return blk.images[idx] || null
    })

    const ensureImagesArray = (blk) => {
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

    const addFullWidthImageBlock = async (src, sourceType = 'url') => {
        const context = {
            sections,
            currSection,
            currBlock,
            selected
        }
        await addFullWidthImageBlockService(context, src, sourceType)
    }

    const setFullWidthImgMode = (mode) => {
        const blk = currBlock.value
        if (blk && blk.type === 'fullwidth-image') {
            blk.image.mode = mode === 'fixed' ? 'fixed' : 'auto'
        }
    }

    const setFullWidthImgHeight = (h) => {
        const blk = currBlock.value
        if (blk && blk.type === 'fullwidth-image') {
            blk.image.height = Math.max(50, parseInt(h || 0, 10))
        }
    }

    const setFullWidthImgCaption = (text) => {
        const blk = currBlock.value
        if (blk && blk.type === 'fullwidth-image') {
            blk.image.caption = text ?? ''
        }
    }

    const setFullWidthImgCaptionPosition = (pos) => {
        const blk = currBlock.value
        if (blk && blk.type === 'fullwidth-image') blk.image.captionPosition = pos
    }

    const setFullWidthImgCaptionBubbleAnimated = (v) => {
        const blk = currBlock.value
        if (blk && blk.type === 'fullwidth-image') blk.image.captionBubbleAnimated = !!v
    }

    const addFloatImageBlock = async (src, sourceType = 'url') => {
        const context = {
            sections,
            currSection,
            currBlock,
            selected
        }
        await addFloatImageBlockService(context, src, sourceType)
    };

    const setFloatImgAlign = (align) => {
        const blk = currBlock.value;
        if (blk && blk.type === 'float-image') blk.image.align = align;
    };

    const setFloatImgWidth = (w) => {
        const blk = currBlock.value;
        if (!blk || blk.type !== 'float-image') return;
        const n = Number(w);
        const clamped = Math.max(20, Math.min(70, isNaN(n) ? 45 : n));
        blk.image.widthPercent = clamped;
    };


    const setFloatImgCaption = (text) => {
        const blk = currBlock.value;
        if (blk && blk.type === 'float-image') blk.image.caption = text ?? '';
    };

    const setFloatImgCaptionPosition = (pos) => {
        const blk = currBlock.value
        if (!blk || blk.type !== 'float-image') return
        blk.image.captionPosition = pos
    }

    const setFloatImgCaptionBubbleAnimated = (v) => {
        const blk = currBlock.value
        if (!blk || blk.type !== 'float-image') return
        blk.image.captionBubbleAnimated = !!v
    }



    const deleteSelected = () => {
        if (!selected.value.type) return

        if (selected.value.type === 'section') {
            sections.value = sections.value.filter(s => s.id !== selected.value.sectionId)
            selected.value = { type: null, sectionId: null, blockId: null, imageIndex: null }
            return
        }

        const sec = currSection.value
        if (!sec) return

        const blk = currBlock.value
        if (!blk) return

        if (selected.value.type === 'image' && Array.isArray(blk.images) && selected.value.imageIndex != null) {
            blk.images.splice(selected.value.imageIndex, 1)
            if (blk.images.length === 0) {
                sec.blocks = sec.blocks.filter(b => b.id !== blk.id)
                selected.value = { type: 'section', sectionId: sec.id, blockId: null, imageIndex: null }
            } else {
                selected.value.imageIndex = Math.min(selected.value.imageIndex, blk.images.length - 1)
            }
            return
        }

        sec.blocks = sec.blocks.filter(b => b.id !== selected.value.blockId)
        selected.value = { type: 'section', sectionId: sec.id, blockId: null, imageIndex: null }
    }


    const currBlock = computed(() => {
        const sec = currSection.value
        if (!sec || !selected.value.blockId) return null
        return sec.blocks?.find(b => b.id === selected.value.blockId) || null
    })

    const isPreview = ref(false)

    const devices = ref([
        { id: 'pc', name: 'PC', mode: 'pc' },
        { id: 'tablet', name: 'Tablet PC', w: 768, mode: 'tablet' },
        { id: 'mobile', name: 'Mobile', w: 375, mode: 'mobile' },
    ])

    const selectedDeviceId = ref('pc')

    const currentDevice = computed(() => {
        return devices.value.find(d => d.id === selectedDeviceId.value) || devices.value[0]
    })

    function runPreview() { isPreview.value = true }
    function stopPreview() { isPreview.value = false }
    function togglePreview() { isPreview.value = !isPreview.value }
    function selectDevice(id) { selectedDeviceId.value = id }

    // Use blobUrlToBase64 from html-export process
    const blobUrlToBase64 = blobUrlToBase64Helper;

    /**
     * Export sections to HTML
     * Uses the html-export process module
     */
    const exportToHTML = async () => {
        return await exportToHTMLProcess(sections.value);
    };

    /**
     * Prepare sections for saving to database
     * Uses the html-save process module
     */
    const prepareSectionsForSave = async () => {
        return await prepareSectionsForSaveProcess(sections.value, blobUrlToBase64);
    };

    const generatePreviewImage = async () => {
        try {
            const canvasElement = document.querySelector('.canvas-area');
            if (!canvasElement) {
                console.warn('Canvas element not found for preview generation');
                return null;
            }

            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(canvasElement, {
                backgroundColor: '#b9b9b9',
                scale: 0.5,
                logging: false,
                useCORS: true,
                allowTaint: true
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            return dataUrl;
        } catch (error) {
            console.error('Error generating preview image:', error);
            return null;
        }
    };

    const clearAllSections = () => {
        revokeAllBlobs();
        sections.value = [];
        selected.value = { type: null, sectionId: null, blockId: null };
        activeEditor.value = null;

        currentPageInfo.value = {
            filename: null,
            title: null,
            isLoaded: false
        };
    };

    const returnToHome = async () => {
        if (sections.value.length > 0 && !currentPageInfo.value.isLoaded) {
            const confirmed = await dialog.warning(
                'You have unsaved content in the editor.\n\nReturning to home will clear all current content.\n\nContinue?',
                {
                    title: 'Unsaved Content',
                    icon: '⚠️',
                    confirmText: 'Clear & Return',
                    cancelText: 'Cancel'
                }
            );
            if (!confirmed) return false;
        }

        clearAllSections();

        return true;
    };

    const loadSections = async (sectionsData, pageInfo = null) => {
        try {
            clearAllSections();

            if (typeof sectionsData === 'string') {
                sectionsData = JSON.parse(sectionsData);
            }

            if (Array.isArray(sectionsData)) {
                const clonedSections = JSON.parse(JSON.stringify(sectionsData));

                sections.value = clonedSections;

                if (pageInfo) {
                    currentPageInfo.value = {
                        filename: pageInfo.filename,
                        title: pageInfo.title,
                        isLoaded: true
                    };
                }
            }
        } catch (error) {
            console.error('Failed to load sections:', error);
            await dialog.error('Failed to load page content into editor. An error occurred while loading the page.', {
                title: 'Load Error'
            });
        }
    };

    return {
        sections,
        selected,
        currentPageInfo,
        addSection,
        addParallaxSection,
        selectSection,
        currSection,
        setSecBg,
        setSecHeight,
        revokeAllBlobs,
        addTextBlock,
        addImageBlock,
        addVideoBlock,
        addFullWidthImageBlock,
        addFloatImageBlock,
        selectBlock,
        currBlock,
        deleteSelected,
        notSelected,
        setTextBlockWidth,
        currImage,
        setImgCaption,
        setImgCaptionPosition,
        setImgCaptionBubbleAnimated,
        setImgWidth,
        setImgHeight,
        setImgKeepRatio,
        setFullWidthImgMode,
        setFullWidthImgHeight,
        setFullWidthImgCaption,
        setFullWidthImgCaptionPosition,
        setFullWidthImgCaptionBubbleAnimated,
        setFloatImgAlign,
        setFloatImgWidth,
        setFloatImgCaption,
        setFloatImgCaptionPosition,
        setFloatImgCaptionBubbleAnimated,
        setVideoUrl,
        setVideoWidth,
        setVideoHeight,
        setVideoKeepRatio,
        activeEditor,
        setActiveEditor,
        isPreview,
        devices,
        selectedDeviceId,
        currentDevice,
        runPreview,
        stopPreview,
        togglePreview,
        selectDevice,
        exportToHTML,
        prepareSectionsForSave,
        generatePreviewImage,
        clearAllSections,
        loadSections,
        returnToHome,
        extractImageId,
        collectLocalImageIds,
        collectLocalImageDetails,
        replaceLocalUrls,
    }
});
