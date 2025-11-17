/**
 * Extract YouTube video ID
 */
export function extractYouTubeId(url) {
    if (!url) return null;

    url = url.trim();

    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];

    match = url.match(/youtu\.be\/([^?&]+)/);
    if (match) return match[1];

    match = url.match(/youtube\.com\/embed\/([^?&]+)/);
    if (match) return match[1];

    match = url.match(/youtube\.com\/v\/([^?&]+)/);
    if (match) return match[1];

    match = url.match(/youtube\.com\/shorts\/([^?&]+)/);
    if (match) return match[1];

    match = url.match(/youtube\.com\/live\/([^?&]+)/);
    if (match) return match[1];

    match = url.match(/m\.youtube\.com\/watch\?v=([^&]+)/);
    if (match) return match[1];

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

/**
 * Create video block
 */
export function createVideoBlock(url) {
    const videoId = extractYouTubeId(url);
    if (!videoId) return null;

    const defaultWidth = 560;
    const defaultHeight = 315;

    return {
        id: Date.now(),
        type: 'video',
        url: url,
        videoId: videoId,
        width: defaultWidth,
        height: defaultHeight,
        aspectRatio: 16 / 9,
        keepRatio: true,
    };
}

/**
 * Update video block dimensions
 * @param {object} block - Video block object
 * @param {number} width - New width
 * @param {number} height - New height
 * @param {boolean} keepRatio - Whether to maintain aspect ratio
 */
export function updateVideoDimensions(block, width, height, keepRatio) {
    if (!block || block.type !== 'video') return;

    if (keepRatio && block.aspectRatio) {
        if (width !== undefined) {
            block.width = width;
            block.height = Math.round(width / block.aspectRatio);
        } else if (height !== undefined) {
            block.height = height;
            block.width = Math.round(height * block.aspectRatio);
        }
    } else {
        if (width !== undefined) block.width = width;
        if (height !== undefined) block.height = height;
    }
}

/**
 * Get video block CSS
 */
export function getVideoBlockCSS() {
    return `
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
            aspect-ratio: 16 / 9;
        }
        .video-fallback {
            max-width: 100%;
            transition: all 0.2s ease;
        }
        @media (max-width: 479px) {
            .video-block iframe,
            .video-fallback {
                width: 100%;
                height: auto;
            }
        }
    `;
}

/**
 * Get video block JavaScript
 */
export function getVideoBlockJavaScript() {
    return `
        function loadYouTubeVideo(videoId, width, height) {
            const container = document.getElementById('video-' + videoId);
            if (!container) return;

            const fallback = container.querySelector('.video-fallback');
            const iframe = container.querySelector('.video-iframe');

            if (window.location.protocol === 'file:') {
                window.open('https://www.youtube.com/watch?v=' + videoId, '_blank');
            } else {
                if (fallback) fallback.style.display = 'none';
                if (iframe) {
                    iframe.style.display = 'block';
                    const currentSrc = iframe.src;
                    if (currentSrc.indexOf('autoplay') === -1) {
                        iframe.src = currentSrc + '?autoplay=1';
                    }
                }
            }
        }

        window.addEventListener('load', function() {
            const isFileProtocol = window.location.protocol === 'file:';
            if (!isFileProtocol) {
                const iframes = document.querySelectorAll('.video-iframe');
                const fallbacks = document.querySelectorAll('.video-fallback');
            }
        });
    `;
}

/**
 * Build video block HTML
 */
export function buildVideoBlockHTML(block) {
    if (!block || block.type !== 'video' || !block.videoId) {
        return '';
    }

    const videoWidth = block.width || 560;
    const videoHeight = block.height || 315;
    const videoId = block.videoId;

    return `
        <div class="block-wrapper">
            <div class="video-block" id="video-${videoId}">
                <!-- Fallback: Show thumbnail with play button that links to YouTube -->
                <div class="video-fallback" style="position: relative; width: ${videoWidth}px; height: ${videoHeight}px; max-width: 100%; background: #000; border-radius: 4px; cursor: pointer;" onclick="loadYouTubeVideo('${videoId}', ${videoWidth}, ${videoHeight})">
                    <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" alt="Video thumbnail" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'" />
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 68px; height: 48px; background: rgba(255,0,0,0.9); border-radius: 12px; cursor: pointer;">
                        <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg>
                    </div>
                    <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; color: white; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">Click to play video</div>
                </div>
                <!-- Also include iframe (will work on web servers) -->
                <iframe class="video-iframe" width="${videoWidth}" height="${videoHeight}" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="display: none; max-width: 100%; border-radius: 4px;"></iframe>
            </div>
        </div>
    `;
}

/**
 * Build simple video block HTML (for preview/buildHtml)
 * @param {object} block - Video block object
 * @returns {string} - HTML string
 */
export function buildSimpleVideoBlockHTML(block) {
    if (!block || block.type !== 'video' || !block.videoId) {
        return '';
    }

    const videoId = block.videoId || '';
    const width = block.width || 560;
    const height = block.height || 315;

    return `
        <div class="block-wrapper">
            <div class="video-block" style="display:flex;justify-content:center;align-items:center;padding:10px 0;">
                <iframe
                    width="${width}"
                    height="${height}"
                    src="https://www.youtube.com/embed/${videoId}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    style="max-width:100%;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);"
                ></iframe>
            </div>
        </div>
    `;
}

/**
 * Parse video block from HTML element
 * @param {Element} videoEl - Video block DOM element
 * @param {number} index - Index for generating unique IDs
 * @returns {object|null} - Video block object or null
 */
export function parseVideoBlockFromHTML(videoEl, index = 0) {
    const iframe = videoEl.querySelector('iframe');
    if (!iframe) return null;

    const src = iframe.getAttribute('src') || '';
    const width = iframe.getAttribute('width') || '560';
    const height = iframe.getAttribute('height') || '315';

    const videoIdMatch = src.match(/(?:youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([^?&]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';

    if (!videoId) return null;

    return {
        id: Date.now() + index * 3000,
        type: 'video',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId: videoId,
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        aspectRatio: parseInt(width, 10) / parseInt(height, 10),
        keepRatio: true,
    };
}

