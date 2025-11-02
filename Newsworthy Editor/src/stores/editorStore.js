import { defineStore } from "pinia";
import { ref, computed, shallowRef } from "vue";
import * as dialog from '@/utils/dialog';

export const useEditorStore = defineStore('editor', () => {
    // stored all sections
    const sections = ref([])

    // Track the currently loaded page for update functionality
    const currentPageInfo = ref({
        filename: null,  // The original filename
        title: null,     // The original title
        isLoaded: false  // Whether a page is loaded for editing
    })

    // selected object
    const selected = ref({
        type: null, // section/text/img/video
        sectionId: null,
        blockId: null, // id of imgblock or text block
        imageIndex: null, // only for mult images
        part: null, // float block
    })

    // current selected TipTap editor
    const activeEditor = shallowRef(null)
    const setActiveEditor = (ed) => {
        activeEditor.value = ed
    }

    // add a empty new section
    const addSection = () => {
        sections.value.push({
            id: Date.now(),
            type: 'section',
            blocks: [], // the info stored for blocks
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

    // add a parallax section (scrollytelling effect)
    const addParallaxSection = () => {
        sections.value.push({
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
        })
    }

    // add a text block
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

    const addImageBlock = async (src, sourceType = 'url') => {
        const sec = currSection.value;
        if (!sec) {
            await dialog.warning('Please select a section first.\n\nClick on a section to select it before adding content.', {
                title: 'No Section Selected',
                icon: '⚠️'
            });
            return;
        }

      const imgEl = new Image()
      imgEl.onload = () => {
        const naturalW = imgEl.naturalWidth || 300
        const naturalH = imgEl.naturalHeight || 300
        const ratio = naturalW / naturalH || 1

        const imageObj = {
          id: Date.now() + Math.random(),
          src,
          sourceType, // 'url' for external URLs, 'upload' for uploaded files (data URLs)
          width: Math.min(300, naturalW),
          height: Math.min(300, naturalH),
          aspectRatio: ratio,
          keepRatio: true,
          caption: '',
          captionPosition: 'bottom',
          captionBubbleAnimated: false,

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
      imgEl.src = src
    };

    // Helper function to extract YouTube video ID from various URL formats
    const extractYouTubeId = (url) => {
        if (!url) return null;
        
        // Remove whitespace
        url = url.trim();
        
        // Pattern 1: https://www.youtube.com/watch?v=VIDEO_ID (standard video)
        let match = url.match(/[?&]v=([^&]+)/);
        if (match) return match[1];
        
        // Pattern 2: https://youtu.be/VIDEO_ID (short link)
        match = url.match(/youtu\.be\/([^?&]+)/);
        if (match) return match[1];
        
        // Pattern 3: https://www.youtube.com/embed/VIDEO_ID (embed)
        match = url.match(/youtube\.com\/embed\/([^?&]+)/);
        if (match) return match[1];
        
        // Pattern 4: https://www.youtube.com/v/VIDEO_ID (old format)
        match = url.match(/youtube\.com\/v\/([^?&]+)/);
        if (match) return match[1];
        
        // Pattern 5: https://www.youtube.com/shorts/VIDEO_ID (YouTube Shorts)
        match = url.match(/youtube\.com\/shorts\/([^?&]+)/);
        if (match) return match[1];
        
        // Pattern 6: https://www.youtube.com/live/VIDEO_ID (live streams)
        match = url.match(/youtube\.com\/live\/([^?&]+)/);
        if (match) return match[1];
        
        // Pattern 7: https://m.youtube.com/... (mobile links)
        match = url.match(/m\.youtube\.com\/watch\?v=([^&]+)/);
        if (match) return match[1];
        
        // If it's just the video ID (11 characters)
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }
        
        return null;
    };

    // Add a video block
    const addVideoBlock = async (url) => {
        const sec = currSection.value;
        
        if (!sec) {
            await dialog.warning('Please select a section first.\n\nClick on a section to select it before adding content.', {
                title: 'No Section Selected',
                icon: '⚠️'
            });
            return;
        }

        // Extract YouTube video ID
        const videoId = extractYouTubeId(url);
        
        if (!videoId) {
            await dialog.error('Invalid YouTube URL.\n\nPlease enter a valid YouTube video link.', {
                title: 'Invalid URL'
            });
            return;
        }

        // Default 16:9 aspect ratio for videos
        const defaultWidth = 560;
        const defaultHeight = 315;

        const newBlock = {
            id: Date.now(),
            type: 'video',
            url: url,
            videoId: videoId,
            width: defaultWidth,
            height: defaultHeight,
            aspectRatio: 16 / 9,
            keepRatio: true,
        };

        sec.blocks.push(newBlock);
        selected.value = { type: 'video', sectionId: sec.id, blockId: newBlock.id };
    };

    // change img
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
    // Video block controls
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
        if (blk.keepRatio && blk.aspectRatio) {
            blk.width = width;
            blk.height = Math.round(width / blk.aspectRatio);
        } else {
            blk.width = width;
        }
    };

    const setVideoHeight = (h) => {
        const blk = currBlock.value;
        if (!blk || blk.type !== 'video') return;
        const height = Math.max(1, parseInt(h || 0, 10));
        if (blk.keepRatio && blk.aspectRatio) {
            blk.height = height;
            blk.width = Math.round(height * blk.aspectRatio);
        } else {
            blk.height = height;
        }
    };

    const setVideoKeepRatio = (v) => {
        const blk = currBlock.value;
        if (!blk || blk.type !== 'video') return;
        blk.keepRatio = !!v;
    };

    // when user click section
    const selectSection = (sectionId) => {
      selected.value = { type: 'section', sectionId, blockId: null, imageIndex: null, part: null };
    }

    // click text or img block
    const selectBlock = (sectionId, blockId, blockType, imageIndex = null, part = null) => {
      selected.value = { type: blockType, sectionId, blockId, imageIndex, part };
    }

    // click nothing
    const notSelected = () => {
      selected.value = { type: null, sectionId: null, blockId: null, imageIndex: null, part: null };
      activeEditor.value = null;
    }


    // get section
    const currSection = computed(() => {
        if (!selected.value.sectionId)
            return null;
        return sections.value.find(s => s.id === selected.value.sectionId) || null;
    })

    // change background type
    const setSecType = (type) => {
        if (!currSection.value)
            return;
        currSection.value.props.bgType = type;
    }

    // change background color of section
    const setSecBg = (color) => {
        if (!currSection.value)
            return;
        currSection.value.props.background = color;
        currSection.value.props.bgType = 'color';
    }

    // change section height
    const setSecHeight = (h) => {
        if (!currSection.value)
            return;
        currSection.value.props.height = h;
    }

    // get img
    const setSecBgImg = (url) => {
        const s = currSection.value;
        if (!s)
            return;
        if (s.props._blobUrl && s._blobUrl !== url && s.props._blobUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(s._blobUrl) } catch { ; }
        }

        s.props.bgImg = url;
        s.props.bgType = 'img'
        s.props._blobUrl = url && url.startsWith('blob:') ? url : ''
    }

    const revokeAllBlobs = () => {
        sections.value.forEach(s => {
            // Revoke parallax section slide backgrounds
            if (s.type === 'parallax' && s.slides) {
                s.slides.forEach(slide => {
                    const u = slide._blobUrl
                    if (u && u.startsWith('blob:')) {
                        try { URL.revokeObjectURL(u) } catch { ; }
                        slide._blobUrl = ''
                    }
                })
            }
            
            // Revoke normal section backgrounds
            const u = s.props?._blobUrl
            if (u && u.startsWith('blob:')) {
                try { URL.revokeObjectURL(u) } catch { ; }
                s.props._blobUrl = ''
            }
        })
    }

    // Helper function to extract image ID from local URL
    const extractImageId = (url) => {
        if (!url || typeof url !== 'string') return null
        // Match both old format (local://<id>) and new format (http://localhost:3001/api/images/temp/<id>)
        const oldFormatMatch = url.match(/^local:\/\/(.+)$/)
        if (oldFormatMatch) return oldFormatMatch[1]
        
        const newFormatMatch = url.match(/^https?:\/\/localhost:\d+\/api\/images\/temp\/(.+)$/)
        return newFormatMatch ? newFormatMatch[1] : null
    }

    // Collect all local image IDs from sections
    const collectLocalImageIds = () => {
        const imageIds = new Set()
        
        sections.value.forEach(section => {
            // Check parallax section slides
            if (section.type === 'parallax' && section.slides) {
                section.slides.forEach(slide => {
                    const id = extractImageId(slide.bgImg)
                    if (id) {
                        imageIds.add(id)
                    }
                })
            }
            
            // Check section background
            if (section.props?.bgImg) {
                const id = extractImageId(section.props.bgImg)
                if (id) {
                    imageIds.add(id)
                }
            }
            
            // Check blocks
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
                    }
                })
            }
        })
        
        return Array.from(imageIds)
    }

    // Replace local URLs with GitHub URLs after batch upload
    const replaceLocalUrls = (urlMapping) => {
        sections.value.forEach(section => {
            // Replace parallax section slides
            if (section.type === 'parallax' && section.slides) {
                section.slides.forEach(slide => {
                    const id = extractImageId(slide.bgImg)
                    if (id && urlMapping[id]) {
                        slide.bgImg = urlMapping[id]
                        slide.sourceType = 'github'
                    }
                })
            }
            
            // Replace section background
            if (section.props?.bgImg) {
                const id = extractImageId(section.props.bgImg)
                if (id && urlMapping[id]) {
                    section.props.bgImg = urlMapping[id]
                }
            }
            
            // Replace in blocks
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

      const addFullWidthImageBlock = (src, sourceType = 'url') => {
        const sec = currSection.value
        if (!sec) return

        const imgEl = new Image()
        imgEl.onload = () => {
          const naturalW = imgEl.naturalWidth || 1
          const naturalH = imgEl.naturalHeight || 1
          const aspectRatio = naturalW / naturalH

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
              mode: 'auto',
              height: 400,      // only in mode='fixed'
              caption: '',
            }
          }

          sec.blocks.push(blk)
          selected.value = { type: 'fullwidth-image', sectionId: sec.id, blockId: blk.id }
        }
        imgEl.src = src
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

      // Float Image Block
      const addFloatImageBlock = (src, sourceType = 'url') => {
        const sec = currSection.value;
        if (!sec) return;

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
            aspectRatio: 1,
            caption: '',
          },
          text: '<p>Enter your text here…</p>',
        };

        sec.blocks.push(blk);
        selected.value = { type: 'float-image', sectionId: sec.id, blockId: blk.id };
      };

      const setFloatImgAlign = (align) => {
        const blk = currBlock.value;
        if (blk && blk.type === 'float-image') blk.image.align = align;
      };

      // change float image width
      const setFloatImgWidth = (w) => {
        const blk = currBlock.value;
        if (!blk || blk.type !== 'float-image') return;
        const n = Number(w);
        const clamped = Math.max(20, Math.min(70, isNaN(n) ? 45 : n));
        blk.image.widthPercent = clamped;
      };


      // change float image caption
      const setFloatImgCaption = (text) => {
        const blk = currBlock.value;
        if (blk && blk.type === 'float-image') blk.image.caption = text ?? '';
      };

      // set float image caption position
      const setFloatImgCaptionPosition = (pos) => {
        const blk = currBlock.value
        if (!blk || blk.type !== 'float-image') return
        blk.image.captionPosition = pos
      }

      // animate
      const setFloatImgCaptionBubbleAnimated = (v) => {
        const blk = currBlock.value
        if (!blk || blk.type !== 'float-image') return
        blk.image.captionBubbleAnimated = !!v
      }



    // delete selected
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


    // get block
    const currBlock = computed(() => {
        const sec = currSection.value
        if (!sec || !selected.value.blockId) return null
        return sec.blocks?.find(b => b.id === selected.value.blockId) || null
    })

    // Preview
    const isPreview = ref(false)

    const devices = ref([
        { id: 'pc', name: 'PC', mode: 'pc' },
        { id: 'tablet', name: 'Tablet PC', w: 768, mode: 'tablet' },
        { id: 'mobile', name: 'Mobile', w: 393, mode: 'mobile' },
    ])

    const selectedDeviceId = ref('desktop')

    const currentDevice = computed(() => {
        return devices.value.find(d => d.id === selectedDeviceId.value) || devices.value[0]
    })

    function runPreview() { isPreview.value = true }
    function stopPreview() { isPreview.value = false }
    function togglePreview() { isPreview.value = !isPreview.value }
    function selectDevice(id) { selectedDeviceId.value = id }
    // Helper function to convert blob URL to base64
    const blobUrlToBase64 = async (blobUrl) => {
        try {
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.error('Failed to convert blob URL to base64:', err);
            return blobUrl; // Fallback to original URL
        }
    };

    const exportToHTML = async () => {
        // Image handling strategy:
        // - GitHub URLs (https://...): Keep as-is (uploaded images)
        // - Data URLs (data:image/...): Keep as-is (for backward compatibility with old files)
        // - Blob URLs (blob:...): Convert to base64 (temporary preview URLs)
        // - External URLs (http://...): Keep as-is (external images)
        const sectionsClone = JSON.parse(JSON.stringify(sections.value));
        
        for (const section of sectionsClone) {
            // Handle parallax sections
            if (section.type === 'parallax' && section.slides) {
                for (const slide of section.slides) {
                    // Convert blob URLs only, keep GitHub URLs and data URLs as-is
                    if (slide.bgImg && slide.bgImg.startsWith('blob:')) {
                        slide.bgImg = await blobUrlToBase64(slide.bgImg);
                    }
                    // GitHub URLs and data URLs are preserved automatically
                }
            }
            
            // Convert section background image if it's a blob URL (temporary upload preview)
            // GitHub URLs and data URLs are preserved
            if (section.props?.bgImg && section.props.bgImg.startsWith('blob:')) {
                section.props.bgImg = await blobUrlToBase64(section.props.bgImg);
            }
            
            // Process image blocks
            if (section.blocks) {
                for (const block of section.blocks) {
                    if (block.type === 'image' && block.images && Array.isArray(block.images)) {
                        // Process each image in the block
                        for (const img of block.images) {
                            // Only convert blob URLs (temporary preview URLs)
                            // Keep GitHub URLs, external URLs, and data URLs (backward compatibility) as-is
                            if (img.src && img.src.startsWith('blob:')) {
                                img.src = await blobUrlToBase64(img.src);
                            }
                            // GitHub URLs, external URLs, and data URLs are preserved
                        }
                    } else if (block.type === 'fullwidth-image' && block.image) {
                        // Process fullwidth image
                        if (block.image.src && block.image.src.startsWith('blob:')) {
                            block.image.src = await blobUrlToBase64(block.image.src);
                        }
                        // GitHub URLs, external URLs, and data URLs are preserved
                    } else if (block.type === 'float-image' && block.image) {
                        // Process float image
                        if (block.image.src && block.image.src.startsWith('blob:')) {
                            block.image.src = await blobUrlToBase64(block.image.src);
                        }
                        // GitHub URLs, external URLs, and data URLs are preserved
                    }
                    // Video blocks don't need conversion as they use YouTube embed URLs
                }
            }
        }
        
        let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <title>Exported Article</title>
    <!-- 
        NOTE: To view YouTube videos properly, please:
        1. Use a local web server (e.g., python -m http.server, Live Server extension)
        2. OR upload this file to a web hosting service
        3. Opening directly with file:// protocol may block videos due to browser security
    -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #b9b9b9;
            padding: 0;
            margin: 0;
        }
        .article-container {
            width: 100%;
            background-color: #b9b9b9;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .section {
            margin: 0 auto;
            box-sizing: border-box;
            position: relative;
            border-top: 2px solid #e0e0e0;
            /* Remove padding to let background color/image extend to edges */
            padding: 0;
            overflow: visible;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            /* Responsive width: use max-width instead of fixed width */
            width: 100%;
            /* Smooth transition for real-time responsiveness */
            transition: all 0.2s ease;
        }
        .block-wrapper {
            /* Add horizontal and vertical padding to content blocks */
            padding: clamp(12px, 2vw, 24px) clamp(16px, 3vw, 32px);
            transition: padding 0.2s ease;
        }
        .text-block {
            /* Fluid max-width: adapts to viewport */
            max-width: min(65ch, 95%);
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
        .image-block {
            display: flex;
            justify-content: center;
            align-items: center;
            /* Regular image blocks stay within content area */
            margin: clamp(8px, 1.5vw, 10px) 0;
            padding: 0;
        }
        .image-block img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
            object-fit: cover;
            /* Smooth transition for image resizing */
            transition: all 0.2s ease;
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
        .float-image-block {
            margin: clamp(8px, 1.5vw, 10px);
            transition: all 0.2s ease;
        }
        .float-image-block img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }
        .video-block {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: clamp(8px, 1.5vw, 10px) 0;
        }
        .video-block iframe {
            max-width: 100%;
            border: none;
            border-radius: 4px;
            /* Maintain aspect ratio */
            aspect-ratio: 16 / 9;
        }
        .video-fallback {
            max-width: 100%;
            transition: all 0.2s ease;
        }
        .text-align-left {
            text-align: left;
        }
        .text-align-center {
            text-align: center;
        }
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

        /* ========== Responsive Design - Media Queries ========== */
        /* Note: Most responsive behavior is now handled by clamp() and fluid units above */
        /* These media queries provide additional fine-tuning for specific breakpoints */
        
        /* Desktop (default): 1200px+ */
        @media (min-width: 1200px) {
            .section {
                max-width: 1200px;
            }
        }
        
        /* Laptop/Tablet landscape: 768px - 1199px */
        @media (min-width: 768px) and (max-width: 1199px) {
            .section {
                max-width: min(960px, 95vw);
            }
            .text-block {
                max-width: min(55ch, 90%);
            }
            .parallax-slide-content {
                max-width: min(600px, 90%);
            }
        }
        
        /* Tablet portrait: 480px - 767px */
        @media (min-width: 480px) and (max-width: 767px) {
            .section {
                max-width: 100%;
            }
            .text-block {
                max-width: min(45ch, 95%);
            }
            .parallax-slide-content {
                max-width: 95%;
            }
            .float-image-block {
                float: none !important;
                margin: 10px auto !important;
                text-align: center;
                max-width: 90%;
            }
        }
        
        /* Mobile: 0 - 479px */
        @media (max-width: 479px) {
            .section {
                max-width: 100%;
                min-height: auto !important;
            }
            .text-block {
                max-width: 100%;
            }
            .parallax-slide-content {
                max-width: 95%;
                border-radius: 4px;
            }
            .float-image-block {
                float: none !important;
                margin: 10px auto !important;
                text-align: center;
                max-width: 100%;
            }
            .info-banner {
                font-size: clamp(11px, 2.5vw, 14px);
                padding: clamp(6px, 1.5vw, 12px);
            }
            /* Optimize video aspect ratio for mobile */
            .video-block iframe,
            .video-fallback {
                width: 100%;
                height: auto;
            }
        }
        
        /* Ultra-wide screens: 1920px+ */
        @media (min-width: 1920px) {
            .section {
                max-width: 1400px;
            }
            .text-block {
                max-width: 75ch;
            }
        }
    </style>
    <script>
        function closeBanner() {
            document.getElementById('info-banner').style.display = 'none';
        }
        
        // Load YouTube video - handles both file:// and http:// protocols
        function loadYouTubeVideo(videoId, width, height) {
            const container = document.getElementById('video-' + videoId);
            if (!container) return;
            
            const fallback = container.querySelector('.video-fallback');
            const iframe = container.querySelector('.video-iframe');
            
            // Check if we're on file:// protocol
            if (window.location.protocol === 'file:') {
                // Open YouTube in new tab as fallback
                window.open('https://www.youtube.com/watch?v=' + videoId, '_blank');
            } else {
                // We're on http/https, show iframe
                if (fallback) fallback.style.display = 'none';
                if (iframe) {
                    iframe.style.display = 'block';
                    // Auto-play when clicked
                    const currentSrc = iframe.src;
                    if (currentSrc.indexOf('autoplay') === -1) {
                        iframe.src = currentSrc + '?autoplay=1';
                    }
                }
            }
        }
        
        // Auto-detect environment and show appropriate version
        window.addEventListener('load', function() {
            const isFileProtocol = window.location.protocol === 'file:';
            
            if (isFileProtocol) {
                // Show warning banner
                const banner = document.getElementById('info-banner');
                if (banner) banner.style.display = 'block';
                
                // Keep showing fallback thumbnails (already visible by default)
            } else {
                // We're on a web server, try to show iframes directly
                const iframes = document.querySelectorAll('.video-iframe');
                const fallbacks = document.querySelectorAll('.video-fallback');
                
                // Try to show iframes, but keep fallbacks as clickable option
                // This provides best UX: clickable thumbnails that load videos on demand
            }
        });
        
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
</head>
<body>
    <div id="info-banner" class="info-banner" style="display: none;">
        <button class="close-banner" onclick="closeBanner()">&times;</button>
        <strong>ℹ️ File Mode:</strong> Click video thumbnails to watch on YouTube. 
        For embedded playback, use a <strong>local web server</strong> (<code>python -m http.server</code>) 
        or <strong>upload to web hosting</strong>.
    </div>
    <div class="article-container">
`;

        sectionsClone.forEach(section => {
            // Handle parallax sections
            if (section.type === 'parallax' && section.slides) {
                const parallaxId = 'parallax-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                
                // Build background layers
                let backgrounds = '';
                section.slides.forEach((slide, index) => {
                    const bgImg = slide.bgImg || '';
                    const activeClass = index === 0 ? ' active' : '';
                    backgrounds += `            <div class="parallax-bg${activeClass}" style="background-image: url('${bgImg}');"></div>\n`;
                });
                
                // Build slide content
                let slideContent = '';
                section.slides.forEach((slide, index) => {
                    let blocks = '';
                    if (slide.blocks && slide.blocks.length > 0) {
                        slide.blocks.forEach(blk => {
                            if (blk.type === 'text') {
                                blocks += `                    ${blk.html || '<p></p>'}\n`;
                            }
                        });
                    }
                    
                    const transparentClass = !blocks ? ' transparent' : '';
                    slideContent += `            <div class="parallax-slide" data-slide-index="${index}">\n`;
                    slideContent += `                <div class="parallax-slide-content${transparentClass}">\n`;
                    slideContent += blocks;
                    slideContent += `                </div>\n`;
                    slideContent += `            </div>\n`;
                });
                
                htmlContent += `        <div class="parallax-container" id="${parallaxId}">\n`;
                htmlContent += `            <div class="parallax-bg-wrapper">\n`;
                htmlContent += backgrounds;
                htmlContent += `            </div>\n`;
                htmlContent += `            <div class="parallax-content">\n`;
                htmlContent += slideContent;
                htmlContent += `            </div>\n`;
                htmlContent += `        </div>\n`;
                return;
            }
            
            // Handle normal sections
            const sectionProps = section.props || {};
            const width = sectionProps.width || 1200;
            const minHeight = sectionProps.height || 800;
            const bgColor = sectionProps.background || '#ffffff';
            const bgImg = sectionProps.bgImg || '';
            const bgType = sectionProps.bgType || 'color';

            // Don't use max-width in inline style - let CSS media queries handle it
            // Only set min-height and background in inline style
            let sectionStyle = `min-height: ${minHeight}px;`;
            
            if (bgType === 'img' && bgImg) {
                sectionStyle += ` background-image: url('${bgImg}');`;
            } else {
                sectionStyle += ` background-color: ${bgColor};`;
            }

            htmlContent += `        <section class="section" style="${sectionStyle}">\n`;

            if (section.blocks) {
                section.blocks.forEach(block => {
                if (block.type === 'text') {
                    const blockWidth = block.props?.width || '65ch';
                    htmlContent += `            <div class="block-wrapper">\n`;
                    htmlContent += `                <div class="text-block" style="max-width: ${blockWidth};">\n`;
                    htmlContent += `                    ${block.html || '<p></p>'}\n`;
                    htmlContent += `                </div>\n`;
                    htmlContent += `            </div>\n`;
                } else if (block.type === 'image') {
                    // Handle images array structure
                    if (block.images && Array.isArray(block.images) && block.images.length > 0) {
                        const img = block.images[0]; // Use first image
                        const imgWidth = img.width || 300;
                        const imgHeight = img.height || 300;
                        const objectFit = img.keepRatio ? 'contain' : 'fill';
                        const imgSrc = img.src || '';
                        // Use max-width for responsive images
                        htmlContent += `            <div class="block-wrapper">\n`;
                        htmlContent += `                <figure class="image-block">\n`;
                        htmlContent += `                    <img src="${imgSrc}" style="max-width: min(${imgWidth}px, 100%); height: auto; object-fit: ${objectFit}; object-position: center;" alt="Image" />\n`;
                        htmlContent += `                </figure>\n`;
                        htmlContent += `            </div>\n`;
                    }
                } else if (block.type === 'fullwidth-image') {
                    // Handle fullwidth image - NO block-wrapper, should extend to edges
                    if (block.image && block.image.src) {
                        const imgSrc = block.image.src || '';
                        const imgHeight = block.image.height || 400;
                        const objectFit = block.image.keepRatio ? 'contain' : 'cover';
                        const caption = block.image.caption ? `<figcaption class="image-caption">${block.image.caption}</figcaption>` : '';
                        // Fullwidth images are always 100% width, height auto for responsiveness
                        htmlContent += `            <figure class="fullwidth-image-block" style="width: 100%; margin: 0; padding: 0;">\n`;
                        htmlContent += `                <img src="${imgSrc}" style="width: 100%; max-height: ${imgHeight}px; object-fit: ${objectFit}; object-position: center; display: block;" alt="Fullwidth Image" />\n`;
                        htmlContent += `                ${caption}\n`;
                        htmlContent += `            </figure>\n`;
                    }
                } else if (block.type === 'float-image') {
                    // Handle float image
                    if (block.image && block.image.src) {
                        const imgSrc = block.image.src || '';
                        const imgWidth = block.image.width || 300;
                        const imgHeight = block.image.height || 300;
                        const objectFit = block.image.keepRatio ? 'contain' : 'cover';
                        const floatPosition = block.float || 'left';
                        const margin = floatPosition === 'left' ? '0 20px 10px 0' : '0 0 10px 20px';
                        // Use max-width for responsive float images
                        htmlContent += `            <div class="block-wrapper">\n`;
                        htmlContent += `                <figure class="float-image-block" style="float: ${floatPosition}; margin: ${margin}; max-width: min(${imgWidth}px, 100%);">\n`;
                        htmlContent += `                    <img src="${imgSrc}" style="width: 100%; height: auto; object-fit: ${objectFit}; object-position: center; display: block;" alt="Float Image" />\n`;
                        htmlContent += `                </figure>\n`;
                        htmlContent += `            </div>\n`;
                    }
                } else if (block.type === 'video') {
                    const videoWidth = block.width || 560;
                    const videoHeight = block.height || 315;
                    const videoId = block.videoId;
                    htmlContent += `            <div class="block-wrapper">\n`;
                    htmlContent += `                <div class="video-block" id="video-${videoId}">\n`;
                    // Fallback: Show thumbnail with play button that links to YouTube
                    htmlContent += `                    <div class="video-fallback" style="position: relative; width: ${videoWidth}px; height: ${videoHeight}px; max-width: 100%; background: #000; border-radius: 4px; cursor: pointer;" onclick="loadYouTubeVideo('${videoId}', ${videoWidth}, ${videoHeight})">\n`;
                    htmlContent += `                        <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" alt="Video thumbnail" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'" />\n`;
                    htmlContent += `                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 68px; height: 48px; background: rgba(255,0,0,0.9); border-radius: 12px; cursor: pointer;">\n`;
                    htmlContent += `                            <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>\n`;
                    htmlContent += `                        </div>\n`;
                    htmlContent += `                        <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; color: white; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">Click to play video</div>\n`;
                    htmlContent += `                    </div>\n`;
                    // Also include iframe (will work on web servers)
                    htmlContent += `                    <iframe class="video-iframe" width="${videoWidth}" height="${videoHeight}" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="display: none; max-width: 100%; border-radius: 4px;"></iframe>\n`;
                    htmlContent += `                </div>\n`;
                    htmlContent += `            </div>\n`;
                }
                });
            }

            htmlContent += `        </section>\n`;
        });

        htmlContent += `    </div>
</body>
</html>`;

        return htmlContent;
    };



    // Convert sections data blob URLs to base64 for saving
    // Image handling: GitHub URLs and data URLs are preserved, only blob URLs are converted
    const prepareSectionsForSave = async () => {
        const sectionsClone = JSON.parse(JSON.stringify(sections.value));
        
        for (const section of sectionsClone) {
            // Handle parallax sections
            if (section.type === 'parallax' && section.slides) {
                for (const slide of section.slides) {
                    // Convert blob URLs only, preserve GitHub URLs and data URLs
                    if (slide.bgImg && slide.bgImg.startsWith('blob:')) {
                        slide.bgImg = await blobUrlToBase64(slide.bgImg);
                    }
                }
            }
            
            // Convert section background image if it's a blob URL
            // GitHub URLs and data URLs are preserved
            if (section.props?.bgImg && section.props.bgImg.startsWith('blob:')) {
                section.props.bgImg = await blobUrlToBase64(section.props.bgImg);
            }
            
            // Process image blocks
            if (section.blocks) {
                for (const block of section.blocks) {
                    if (block.type === 'image' && block.images && Array.isArray(block.images)) {
                        // Process each image - preserve GitHub URLs and data URLs
                        for (const img of block.images) {
                            if (img.src && img.src.startsWith('blob:')) {
                                img.src = await blobUrlToBase64(img.src);
                            }
                        }
                    } else if (block.type === 'fullwidth-image' && block.image) {
                        if (block.image.src && block.image.src.startsWith('blob:')) {
                            block.image.src = await blobUrlToBase64(block.image.src);
                        }
                    } else if (block.type === 'float-image' && block.image) {
                        if (block.image.src && block.image.src.startsWith('blob:')) {
                            block.image.src = await blobUrlToBase64(block.image.src);
                        }
                    }
                }
            }
        }
        
        return sectionsClone;
    };

    // Generate preview image from canvas
    const generatePreviewImage = async () => {
        try {
            // Find the canvas element
            const canvasElement = document.querySelector('.canvas-area');
            if (!canvasElement) {
                console.warn('Canvas element not found for preview generation');
                return null;
            }

            // Dynamically import html2canvas
            const html2canvas = (await import('html2canvas')).default;
            
            // Capture the canvas as an image
            const canvas = await html2canvas(canvasElement, {
                backgroundColor: '#b9b9b9',
                scale: 0.5, // Reduce scale for smaller preview image
                logging: false,
                useCORS: true, // Enable CORS for external images
                allowTaint: true
            });

            // Convert canvas to base64 data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            return dataUrl;
        } catch (error) {
            console.error('Error generating preview image:', error);
            return null;
        }
    };

    // Clear all sections
    const clearAllSections = () => {
        // Revoke all blob URLs before clearing
        revokeAllBlobs();
        sections.value = [];
        selected.value = { type: null, sectionId: null, blockId: null };
        activeEditor.value = null;
        
        // Clear page info when clearing content
        currentPageInfo.value = {
            filename: null,
            title: null,
            isLoaded: false
        };
    };

    // Return to home - clear editor to initial state
    const returnToHome = async () => {
        // Ask for confirmation if there's unsaved content
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
        
        // Clear all content - return to initial empty state
        clearAllSections();
        
        return true;
    };

    // Load sections data from saved page
    const loadSections = async (sectionsData, pageInfo = null) => {
        try {
            // Clear existing content first
            clearAllSections();
            
            // Parse and load sections data
            if (typeof sectionsData === 'string') {
                sectionsData = JSON.parse(sectionsData);
            }
            
            if (Array.isArray(sectionsData)) {
                // Deep clone the sections data to ensure reactivity
                const clonedSections = JSON.parse(JSON.stringify(sectionsData));
                
                sections.value = clonedSections;
                
                // Track page info if provided
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
            await dialog.error('Failed to load page content into editor.\n\nAn error occurred while loading the page.', {
                title: 'Load Error'
            });
        }
    };

    return {
        // Core data
        sections,
        selected,
        currentPageInfo,
        
        // Section operations
        addSection,
        addParallaxSection,
        selectSection,
        currSection,
        setSecType,
        setSecBg,
        setSecHeight,
        setSecBgImg,
        revokeAllBlobs,
        
        // Block operations
        addTextBlock,
        addImageBlock,
        addVideoBlock,
        addFullWidthImageBlock,
        addFloatImageBlock,
        selectBlock,
        currBlock,
        deleteSelected,
        notSelected,
        
        // Image operations
        currImage,
        setImgCaption,
        setImgCaptionPosition,
        setImgCaptionBubbleAnimated,
        setImgWidth,
        setImgHeight,
        setImgKeepRatio,
        
        // Full-width image operations
        setFullWidthImgMode,
        setFullWidthImgHeight,
        setFullWidthImgCaption,
        setFullWidthImgCaptionPosition,
        setFullWidthImgCaptionBubbleAnimated,
        
        // Float image operations
        setFloatImgAlign,
        setFloatImgWidth,
        setFloatImgCaption,
        setFloatImgCaptionPosition,
        setFloatImgCaptionBubbleAnimated,
        
        // Video operations
        setVideoUrl,
        setVideoWidth,
        setVideoHeight,
        setVideoKeepRatio,
        
        // Editor state
        activeEditor,
        setActiveEditor,
        
        // Preview state
        isPreview,
        devices,
        selectedDeviceId,
        currentDevice,
        runPreview,
        stopPreview,
        togglePreview,
        selectDevice,
        
        // Export operations
        exportToHTML,
        prepareSectionsForSave,
        generatePreviewImage,
        
        // Storage operations
        clearAllSections,
        loadSections,
        returnToHome,
        
        // Local image operations
        extractImageId,
        collectLocalImageIds,
        replaceLocalUrls,
    }
});
