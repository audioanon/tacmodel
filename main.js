/**
 * TAC Academic Website - Main JavaScript
 */

// ============================================
// State Management
// ============================================

const state = {
    currentTab: 'home',
    currentBenchmark: 'dailyomni',
    currentAudioBenchmark: 'mmar',
    captioningData: null,
    benchmarkData: null,
    audioBenchmarkData: null,
    isLoading: false
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initBenchmarkTabs();
    initAudioBenchmarkTabs();
    loadData();
});

// ============================================
// Navigation
// ============================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-btn[data-section]');

    // Smooth scroll on click
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
            // Update active state immediately on click
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Scroll-spy: highlight nav link for the currently visible section
    const sections = document.querySelectorAll('.tab-content');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(l => l.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-btn[data-section="${entry.target.id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
}

// ============================================
// Benchmark Tabs
// ============================================

function initBenchmarkTabs() {
    const benchmarkTabs = document.querySelectorAll('.benchmark-tab');

    benchmarkTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const benchmark = tab.dataset.benchmark;
            switchBenchmark(benchmark);
        });
    });
}

function switchBenchmark(benchmark) {
    state.currentBenchmark = benchmark;

    // Update tabs - only for AV benchmarks section
    document.querySelectorAll('#benchmarks .benchmark-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.benchmark === benchmark);
    });

    // Render current benchmark
    renderBenchmarkExamples();
}

function initAudioBenchmarkTabs() {
    const audioTabs = document.querySelectorAll('[data-audio-benchmark]');

    audioTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const benchmark = tab.dataset.audioBenchmark;
            switchAudioBenchmark(benchmark);
        });
    });
}

function switchAudioBenchmark(benchmark) {
    state.currentAudioBenchmark = benchmark;

    // Update tabs - only for audio benchmarks section
    document.querySelectorAll('#audiobenchmarks .benchmark-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.audioBenchmark === benchmark);
    });

    // Render current audio benchmark
    renderAudioBenchmarkExamples();
}

// ============================================
// Data Loading
// ============================================

async function loadData() {
    await Promise.all([
        loadCaptioningData(),
        loadBenchmarkData(),
        loadAudioBenchmarkData(),
        loadVideoCaptioningData()
    ]);
}

async function loadCaptioningData() {
    const container = document.getElementById('captioningExamples');
    container.innerHTML = createLoadingHTML();

    try {
        const response = await fetch('data/captioning_examples.json');
        if (response.ok) {
            state.captioningData = await response.json();
            renderCaptioningExamples();
        } else {
            // Use sample data if file doesn't exist
            state.captioningData = getSampleCaptioningData();
            renderCaptioningExamples();
        }
    } catch (error) {
        console.log('Using sample captioning data');
        state.captioningData = getSampleCaptioningData();
        renderCaptioningExamples();
    }
}

async function loadBenchmarkData() {
    const container = document.getElementById('benchmarkExamples');
    container.innerHTML = createLoadingHTML();

    try {
        // Load from individual benchmark files
        const benchmarkFiles = [
            'data/dailyomni_examples.json',
            'data/avhbench_examples.json',
            'data/videoholmes_examples.json',
            'data/worldsense_examples.json',
            // 'data/benchmark_examples.json'  // Contains MMAU and fallback data
        ];

        const allBenchmarks = [];

        for (const file of benchmarkFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const data = await response.json();
                    if (data.benchmarks) {
                        allBenchmarks.push(...data.benchmarks);
                    }
                }
            } catch (e) {
                console.log(`Could not load ${file}`);
            }
        }

        if (allBenchmarks.length > 0) {
            state.benchmarkData = { benchmarks: allBenchmarks };
        } else {
            state.benchmarkData = getSampleBenchmarkData();
        }

        renderBenchmarkExamples();
    } catch (error) {
        console.log('Using sample benchmark data');
        state.benchmarkData = getSampleBenchmarkData();
        renderBenchmarkExamples();
    }
}

async function loadAudioBenchmarkData() {
    const container = document.getElementById('audioBenchmarkExamples');
    if (!container) return;
    container.innerHTML = createLoadingHTML();

    try {
        // Load from audio benchmark files
        const audioBenchmarkFiles = [
            'data/mmar_examples.json',
            'data/mmsu_examples.json'
        ];

        const allAudioBenchmarks = [];

        for (const file of audioBenchmarkFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const data = await response.json();
                    if (data.benchmarks) {
                        allAudioBenchmarks.push(...data.benchmarks);
                    }
                }
            } catch (e) {
                console.log(`Could not load ${file}`);
            }
        }

        if (allAudioBenchmarks.length > 0) {
            state.audioBenchmarkData = { benchmarks: allAudioBenchmarks };
        } else {
            state.audioBenchmarkData = { benchmarks: [] };
        }

        renderAudioBenchmarkExamples();
    } catch (error) {
        console.log('Error loading audio benchmark data');
        state.audioBenchmarkData = { benchmarks: [] };
        renderAudioBenchmarkExamples();
    }
}

function renderAudioBenchmarkExamples() {
    const container = document.getElementById('audioBenchmarkExamples');
    if (!container) return;

    const allBenchmarks = state.audioBenchmarkData?.benchmarks || [];
    const examples = allBenchmarks.filter(b => b.benchmark === state.currentAudioBenchmark);

    if (examples.length === 0) {
        container.innerHTML = createEmptyStateHTML(`No examples available for ${state.currentAudioBenchmark.toUpperCase()}`);
        return;
    }

    container.innerHTML = examples.map((example, index) => createAudioBenchmarkCardHTML(example, index)).join('');
}

function createAudioBenchmarkCardHTML(example, index) {
    const isCorrect = example.model_answer === example.answer;
    const choices = example.choices || [];

    const choicesHTML = choices.map((choice, i) => {
        // Handle both "A. Choice" format and plain choice format
        const choiceText = choice.startsWith('A.') || choice.startsWith('B.') ||
            choice.startsWith('C.') || choice.startsWith('D.') ? choice :
            `${String.fromCharCode(65 + i)}. ${choice}`;
        const letter = choiceText.charAt(0);
        const isCorrectChoice = letter === example.answer;
        const isSelectedChoice = letter === example.model_answer;
        let classes = 'choice-item';
        if (isCorrectChoice) classes += ' correct';
        if (isSelectedChoice && !isCorrectChoice) classes += ' selected';
        return `<li class="${classes}">${escapeHTML(choiceText)}</li>`;
    }).join('');

    const shotListHTML = createShotListHTML(example.shot_list || []);
    const rawCaptionHTML = createRawCaptionHTML(example.raw_caption || '');

    const categoryHTML = example.category ? `<span class="benchmark-category">${escapeHTML(example.category)}</span>` : '';
    const modalityHTML = example.modality ? `<span class="benchmark-category">${escapeHTML(example.modality)}</span>` : '';

    // Use audio-specific card index to avoid conflicts with video benchmarks
    const cardIndex = `audio-${index}`;

    return `
        <div class="benchmark-card" id="benchmark-${cardIndex}">
            <div class="benchmark-card-header">
                <div class="benchmark-header-left">
                    <span class="benchmark-type">${escapeHTML(example.type || 'Audio QA')}</span>
                    ${categoryHTML}
                    ${modalityHTML}
                </div>
                <div class="benchmark-result ${isCorrect ? 'result-correct' : 'result-incorrect'}">
                    ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </div>
            </div>
            <div class="benchmark-card-body">
                <div class="benchmark-video-section">
                    ${example.audio_path ? `
                        <div class="audio-player-wrapper">
                            <div class="audio-icon">🎵</div>
                            <audio controls preload="metadata" style="width: 100%;">
                                <source src="${example.audio_path}" type="audio/wav">
                                <source src="${example.audio_path.replace('.wav', '.mp3')}" type="audio/mpeg">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    ` : `
                        <div class="audio-placeholder">
                            <div class="audio-icon">🎵</div>
                            <p>Audio Sample</p>
                        </div>
                    `}
                </div>
                <div class="benchmark-question-section">
                    <p class="question-text">${escapeHTML(example.question || '')}</p>
                    <ul class="choices-list">
                        ${choicesHTML}
                    </ul>
                </div>
            </div>
            <div class="reasoning-toggle">
                <button class="reasoning-btn" onclick="toggleAudioReasoning('${cardIndex}')">
                    <span>View Audio Caption</span>
                    <span class="toggle-icon">▼</span>
                </button>
            </div>
            <div class="reasoning-section" id="reasoning-${cardIndex}">
                <div class="reasoning-tabs">
                    <button class="reasoning-tab-btn active" onclick="switchAudioReasoningTab('${cardIndex}', 'structured')">Audio Events</button>
                    <button class="reasoning-tab-btn" onclick="switchAudioReasoningTab('${cardIndex}', 'raw')">Raw Caption</button>
                </div>
                <div class="reasoning-tab-content structured-content active" id="structured-${cardIndex}">
                    <h4 style="margin-bottom: 16px; color: var(--accent-primary);">Audio Event Analysis</h4>
                    <div class="shot-list">
                        ${shotListHTML}
                    </div>
                </div>
                <div class="reasoning-tab-content raw-content" id="raw-${cardIndex}">
                    <h4 style="margin-bottom: 16px; color: var(--accent-primary);">Raw Caption</h4>
                    <div class="raw-caption">
                        ${rawCaptionHTML}
                    </div>
                </div>
                <div class="model-reasoning">
                    <h4>Model Reasoning</h4>
                    <p>${escapeHTML(example.model_reasoning || 'Reasoning to be added')}</p>
                </div>
            </div>
        </div>
    `;
}

function toggleAudioReasoning(cardIndex) {
    const section = document.getElementById(`reasoning-${cardIndex}`);
    if (section) {
        const btn = section.previousElementSibling.querySelector('.reasoning-btn');
        const icon = btn?.querySelector('.toggle-icon');

        section.classList.toggle('active');
        if (icon) {
            icon.textContent = section.classList.contains('active') ? '▲' : '▼';
        }
    }
}

function switchAudioReasoningTab(cardIndex, tabType) {
    // Hide all tabs for this card
    const structuredTab = document.getElementById(`structured-${cardIndex}`);
    const rawTab = document.getElementById(`raw-${cardIndex}`);

    if (structuredTab && rawTab) {
        structuredTab.classList.toggle('active', tabType === 'structured');
        rawTab.classList.toggle('active', tabType === 'raw');
    }

    // Update button states
    const card = document.getElementById(`benchmark-${cardIndex}`);
    if (card) {
        card.querySelectorAll('.reasoning-tab-btn').forEach((btn, i) => {
            btn.classList.toggle('active', (i === 0 && tabType === 'structured') || (i === 1 && tabType === 'raw'));
        });
    }
}

// ============================================
// Rendering - Captioning Examples
// ============================================

function renderCaptioningExamples() {
    const container = document.getElementById('captioningExamples');
    const examples = state.captioningData?.examples || [];

    if (examples.length === 0) {
        container.innerHTML = createEmptyStateHTML('No captioning examples available');
        return;
    }

    container.innerHTML = examples.map((example, index) => createCaptioningCardHTML(example, index)).join('');

    // Play/pause videos on hover
    container.querySelectorAll('.captioning-card').forEach(card => {
        const video = card.querySelector('video');
        if (video) {
            card.addEventListener('mouseenter', () => {
                video.play().catch(() => { });
            });
            card.addEventListener('mouseleave', () => {
                video.pause();
            });
        }
    });
}

function formatCaptionText(caption) {
    if (!caption) return '';
    // Format [speech lang="xx"]...[/speech] tags into styled spans
    let formatted = caption.replace(
        /\[speech lang="([^"]+)"\](.*?)\[\/speech\]/g,
        '<span class="caption-speech" data-lang="$1">"$2"</span>'
    );
    return formatted;
}

function createCaptioningCardHTML(example, index) {
    const videoSrc = example.video_src || '';
    const events = example.events || 0;
    const caption = example.caption || '';
    const duration = example.duration || '';

    return `
        <div class="captioning-card" onclick="openVideoModal('${videoSrc}', \`${escapeHTML(caption)}\`)">
            <div class="captioning-video-wrapper">
                <video class="captioning-video" loop preload="metadata" controls>
                    <source src="${videoSrc}" type="video/mp4">
                </video>
                ${duration ? `<span class="captioning-duration">${duration}</span>` : ''}
            </div>
            <div class="captioning-info">
                <div class="captioning-events-badge">${events} events</div>
                <div class="captioning-caption">${formatCaptionText(caption)}</div>
            </div>
        </div>
    `;
}

// ============================================
// Rendering - Benchmark Examples
// ============================================

function renderBenchmarkExamples() {
    const container = document.getElementById('benchmarkExamples');
    const allBenchmarks = state.benchmarkData?.benchmarks || [];
    const examples = allBenchmarks.filter(b => b.benchmark === state.currentBenchmark);

    if (examples.length === 0) {
        container.innerHTML = createEmptyStateHTML(`No examples available for ${state.currentBenchmark}`);
        return;
    }

    container.innerHTML = examples.map((example, index) => createBenchmarkCardHTML(example, index)).join('');
}

function createBenchmarkCardHTML(example, index) {
    const isCorrect = example.model_answer === example.answer;
    const choices = example.choices || [];

    const choicesHTML = choices.map((choice, i) => {
        const letter = String.fromCharCode(65 + i); // A, B, C, D
        const isCorrectChoice = letter === example.answer;
        const isSelectedChoice = letter === example.model_answer;
        let classes = 'choice-item';
        if (isCorrectChoice) classes += ' correct';
        if (isSelectedChoice && !isCorrectChoice) classes += ' selected';
        return `<li class="${classes}"><strong>${letter}.</strong> ${escapeHTML(choice)}</li>`;
    }).join('');

    const shotListHTML = createShotListHTML(example.shot_list || []);
    const rawCaptionHTML = createRawCaptionHTML(example.raw_caption || '');

    // Generate YouTube embed or video element
    const videoHTML = createVideoHTML(example);
    const categoryHTML = example.category ? `<span class="benchmark-category">${escapeHTML(example.category)}</span>` : '';

    return `
        <div class="benchmark-card" id="benchmark-${index}">
            <div class="benchmark-card-header">
                <div class="benchmark-header-left">
                    <span class="benchmark-type">${escapeHTML(example.type || 'Question')}</span>
                    ${categoryHTML}
                </div>
                <div class="benchmark-result ${isCorrect ? 'result-correct' : 'result-incorrect'}">
                    ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </div>
            </div>
            <div class="benchmark-card-body">
                <div class="benchmark-video-section">
                    ${videoHTML}
                </div>
                <div class="benchmark-question-section">
                    <p class="question-text">${escapeHTML(example.question || '')}</p>
                    <ul class="choices-list">
                        ${choicesHTML}
                    </ul>
                </div>
            </div>
            <div class="reasoning-toggle">
                <button class="reasoning-btn" onclick="toggleReasoning(${index})">
                    <span>View Reasoning Chain</span>
                    <span class="toggle-icon">▼</span>
                </button>
            </div>
            <div class="reasoning-section" id="reasoning-${index}">
                <div class="reasoning-tabs">
                    <button class="reasoning-tab-btn active" onclick="switchReasoningTab(${index}, 'structured')">Structured Shots</button>
                    <button class="reasoning-tab-btn" onclick="switchReasoningTab(${index}, 'raw')">Raw Caption</button>
                </div>
                <div class="reasoning-tab-content structured-content active" id="structured-${index}">
                    <h4 style="margin-bottom: 16px; color: var(--accent-primary);">Shot-by-Shot Analysis</h4>
                    <div class="shot-list">
                        ${shotListHTML}
                    </div>
                </div>
                <div class="reasoning-tab-content raw-content" id="raw-${index}">
                    <h4 style="margin-bottom: 16px; color: var(--accent-primary);">Raw Caption</h4>
                    <div class="raw-caption">
                        ${rawCaptionHTML}
                    </div>
                </div>
                <div class="model-reasoning">
                    <h4>Model Reasoning</h4>
                    <p>${escapeHTML(example.model_reasoning || 'No reasoning available')}</p>
                </div>
            </div>
        </div>
    `;
}

function createShotListHTML(shotList) {
    if (!shotList || shotList.length === 0) {
        return '<p style="color: var(--text-muted);">No shot information available</p>';
    }

    return shotList.slice(0, 10).map(shot => {
        // Parse the shot content for visual/audio cues
        const content = shot.content || shot.description || '';
        const startTime = shot.start_time || shot.timestamp || '0.0s';
        const endTime = shot.end_time || '';
        const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;
        const type = shot.type || 'visual';

        return `
            <div class="shot-item">
                <div class="shot-header">
                    <span class="shot-time">${timeRange}</span>
                    <span class="shot-type">${type}</span>
                </div>
                <p class="shot-content">${escapeHTML(content)}</p>
            </div>
        `;
    }).join('');
}

function createRawCaptionHTML(rawCaption) {
    if (!rawCaption) {
        return '<p style="color: var(--text-muted);">No raw caption available</p>';
    }

    // Format the raw caption for display
    // Remove markdown code block markers and format nicely
    let formatted = rawCaption
        .replace(/```/g, '')
        .trim()
        .split('\n')
        .map(line => {
            // Highlight timestamps
            line = line.replace(/\[\s*([\d.]+s)\s*-\s*([\d.]+s)\s*\]/g,
                '<span class="caption-time">[$1 - $2]</span>');
            // Highlight type tags
            line = line.replace(/\[(visual|audio|speech|sfx|music|background)\]/gi,
                '<span class="caption-type">[$1]</span>');
            // Highlight speech tags
            line = line.replace(/<speech[^>]*>([^<]+)<\/speech>/gi,
                '<span class="caption-speech">"$1"</span>');
            return line;
        })
        .join('\n');

    return `<pre class="raw-caption-text">${formatted}</pre>`;
}

function createVideoHTML(example) {
    // Generate video_src from video_id if not explicitly set
    let videoSrc = example.video_src || '';
    if (!videoSrc && example.video_id) {
        videoSrc = `assets/${example.video_id}.mp4`;
    }

    // Check if it's a YouTube URL
    if (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be')) {
        const videoId = extractYouTubeId(videoSrc);
        if (videoId) {
            return `
                <div class="youtube-embed">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        }
    }

    // Fall back to regular video element
    return `
        <video class="benchmark-video" controls>
            <source src="${videoSrc}" type="video/mp4">
            Video not available
        </video>
    `;
}

function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function switchReasoningTab(index, tabType) {
    const structuredContent = document.getElementById(`structured-${index}`);
    const rawContent = document.getElementById(`raw-${index}`);
    const reasoningSection = document.getElementById(`reasoning-${index}`);
    const tabs = reasoningSection.querySelectorAll('.reasoning-tab-btn');

    tabs.forEach(tab => tab.classList.remove('active'));

    if (tabType === 'structured') {
        structuredContent.classList.add('active');
        rawContent.classList.remove('active');
        tabs[0].classList.add('active');
    } else {
        rawContent.classList.add('active');
        structuredContent.classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// ============================================
// Modals
// ============================================

function openVideoModal(videoSrc, caption) {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    const source = document.getElementById('modalVideoSource');
    const captionEl = document.getElementById('modalCaption');

    source.src = videoSrc;
    video.load();
    captionEl.textContent = caption;

    modal.classList.add('active');
    video.play().catch(() => { }); // Autoplay may be blocked
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');

    // Pause video if it's the video modal
    if (modalId === 'videoModal') {
        const video = document.getElementById('modalVideo');
        video.pause();
    }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// Close modal on backdrop click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});

// ============================================
// Reasoning Toggle
// ============================================

function toggleReasoning(index) {
    const section = document.getElementById(`reasoning-${index}`);
    const btn = section.previousElementSibling.querySelector('.reasoning-btn');
    const icon = btn.querySelector('.toggle-icon');

    section.classList.toggle('active');
    icon.textContent = section.classList.contains('active') ? '▲' : '▼';
}

// ============================================
// Utility Functions
// ============================================

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function createLoadingHTML() {
    return `
        <div class="loading">
            <div class="spinner"></div>
            <span>Loading examples...</span>
        </div>
    `;
}

function createEmptyStateHTML(message) {
    return `
        <div class="empty-state">
            <p>${escapeHTML(message)}</p>
        </div>
    `;
}

function copyBibtex() {
    const citation = document.querySelector('.citation-block code').textContent;
    navigator.clipboard.writeText(citation).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        alert('Failed to copy. Please select and copy manually.');
    });
}

// ============================================
// Sample Data (Fallback)
// ============================================

function getSampleCaptioningData() {
    return {
        examples: [
            {
                id: 'sample_1',
                title: 'Movie Scene - Dialogue with Background Music',
                video_src: 'assets/sample_1.mp4',
                caption: 'Fingerstyle guitar with emotional depth and gentle rhythm from 0.00s to 15.00s. Speech: "We\'re still about eight hours outside Houston." from 1.79s to 4.37s. Female voice (formal) from 1.80s to 4.40s. Cinematic stinger with deep bass and reverb from 5.50s to 7.20s. Speech: "When I sell my script, we\'re gonna have all the money we ever need." from 12.45s to 15.05s.',
                tags: ['Speech', 'Music', 'Cinematic']
            },
            {
                id: 'sample_2',
                title: 'Urban Environment - Street Sounds',
                video_src: 'assets/sample_2.mp4',
                caption: 'Traffic noise and car horns from 0.00s to 10.00s. Pedestrian footsteps on pavement from 2.30s to 8.50s. Distant siren from 4.00s to 6.50s. Street vendor announcement from 7.20s to 9.00s.',
                tags: ['Urban', 'Traffic', 'Ambient']
            },
            {
                id: 'sample_3',
                title: 'Nature Documentary - Wildlife',
                video_src: 'assets/sample_3.mp4',
                caption: 'Bird chirping in forest environment from 0.00s to 12.00s. Wind rustling through leaves from 0.00s to 12.00s. Narrator speaking about wildlife behavior from 3.00s to 10.00s. Animal call (unidentified bird) from 8.45s to 9.20s.',
                tags: ['Nature', 'Narration', 'Wildlife']
            }
        ]
    };
}

function getSampleBenchmarkData() {
    return {
        benchmarks: [
            // Daily-Omni Examples
            {
                id: 'do_1',
                benchmark: 'dailyomni',
                type: 'Event Sequence',
                video_src: 'assets/dailyomni_1.mp4',
                question: 'What is the order of audio events in this video?',
                choices: [
                    'Music → Speech → Sound effect',
                    'Speech → Music → Sound effect',
                    'Sound effect → Music → Speech',
                    'Speech → Sound effect → Music'
                ],
                answer: 'A',
                model_answer: 'A',
                shot_list: [
                    { type: 'visual', start_time: '0.0s', end_time: '3.0s', content: 'Interior of a car, dashboard visible, nighttime driving scene' },
                    { type: 'audio', start_time: '0.0s', end_time: '15.0s', content: 'Soft acoustic guitar music playing in background' },
                    { type: 'speech', start_time: '1.8s', end_time: '4.4s', content: 'Female voice: "We\'re still about eight hours outside Houston."' },
                    { type: 'visual', start_time: '5.0s', end_time: '8.0s', content: 'Close-up of driver, looking contemplative' },
                    { type: 'audio', start_time: '5.5s', end_time: '7.2s', content: 'Cinematic stinger with deep bass' }
                ],
                model_reasoning: 'The video begins with background music (acoustic guitar) that plays throughout. At 1.8s, we hear speech from a female voice. At 5.5s, there is a cinematic sound effect (stinger). Therefore, the order is: Music → Speech → Sound effect, which corresponds to choice A.'
            },
            {
                id: 'do_2',
                benchmark: 'dailyomni',
                type: 'AV Alignment',
                video_src: 'assets/dailyomni_2.mp4',
                question: 'Which visual element is synchronized with the door slam sound?',
                choices: [
                    'A person walking away',
                    'A car door closing',
                    'A window being opened',
                    'Papers falling on a desk'
                ],
                answer: 'B',
                model_answer: 'B',
                shot_list: [
                    { type: 'visual', start_time: '0.0s', end_time: '2.0s', content: 'Exterior of house, car parked in driveway' },
                    { type: 'visual', start_time: '2.0s', end_time: '4.0s', content: 'Person exits car, closes door behind them' },
                    { type: 'audio', start_time: '3.2s', end_time: '3.5s', content: 'Loud metallic slam sound' }
                ],
                model_reasoning: 'At 3.2s, we hear a distinct door slam sound. Looking at the visual timeline, at exactly this moment (2.0s-4.0s), we see a person closing a car door. The timing of the slam aligns precisely with the car door closing action, making B the correct answer.'
            },
            // Video-Holmes Examples  
            {
                id: 'vh_1',
                benchmark: 'holmes',
                type: 'Inference',
                video_src: 'assets/holmes_1.mp4',
                question: 'Based on the audio and visual cues, what is the likely emotional state of the main character?',
                choices: [
                    'Happy and excited',
                    'Sad and contemplative',
                    'Angry and frustrated',
                    'Scared and anxious'
                ],
                answer: 'B',
                model_answer: 'B',
                shot_list: [
                    { type: 'visual', start_time: '0.0s', end_time: '5.0s', content: 'Person sitting alone by a window, looking outside, rain visible' },
                    { type: 'audio', start_time: '0.0s', end_time: '10.0s', content: 'Slow, melancholic piano music' },
                    { type: 'audio', start_time: '0.0s', end_time: '10.0s', content: 'Rain sounds on window' },
                    { type: 'visual', start_time: '5.0s', end_time: '8.0s', content: 'Close-up of face showing downcast expression' }
                ],
                model_reasoning: 'Multiple cues point to a sad, contemplative state: 1) The melancholic piano music creates a somber atmosphere, 2) The rain is a classic symbol of sadness, 3) The person is sitting alone looking out the window, 4) The close-up reveals a downcast expression. All these elements together strongly suggest answer B.'
            },
            // MMAU Examples
            {
                id: 'mmau_1',
                benchmark: 'mmau',
                type: 'Audio Understanding',
                video_src: 'assets/mmau_1.mp4',
                question: 'How many distinct speakers can be heard in this audio clip?',
                choices: [
                    'One speaker',
                    'Two speakers',
                    'Three speakers',
                    'Four or more speakers'
                ],
                answer: 'B',
                model_answer: 'B',
                shot_list: [
                    { type: 'speech', start_time: '0.0s', end_time: '3.0s', content: 'Male voice (deep): "Have you seen the report?"' },
                    { type: 'speech', start_time: '3.5s', end_time: '6.0s', content: 'Female voice: "Yes, I reviewed it this morning."' },
                    { type: 'speech', start_time: '7.0s', end_time: '10.0s', content: 'Male voice (same as before): "What did you think?"' }
                ],
                model_reasoning: 'Analyzing the audio, I can identify two distinct voices: 1) A deep male voice that speaks at 0.0s-3.0s and again at 7.0s-10.0s, and 2) A female voice that responds at 3.5s-6.0s. The male voice at the beginning and end appears to be the same speaker based on consistent pitch and timbre. Therefore, there are two distinct speakers, corresponding to answer B.'
            }
        ]
    };
}

// ============================================
// Video Captioning
// ============================================

const vcState = {
    clips: [],
    activeFilter: 'all',
    visibleCount: 6
};

async function loadVideoCaptioningData() {
    const container = document.getElementById('videoCaptioningExamples');
    if (!container) return;
    container.innerHTML = createLoadingHTML();

    try {
        const manifestRes = await fetch('data/video_captioning_clips.json');
        const clipDirs = await manifestRes.json();

        const clipPromises = clipDirs.map(async (dir) => {
            const basePath = `assets/video_captioning_clips/${dir}`;
            try {
                const eventsRes = await fetch(`${basePath}/events.json`);
                const eventsData = await eventsRes.json();
                return {
                    id: dir,
                    videoSrc: `${basePath}/clip.mp4`,
                    events: eventsData.events || [],
                    duration: eventsData.duration,
                    selStart: eventsData.sel_start,
                    selEnd: eventsData.sel_end
                };
            } catch (e) {
                console.warn(`Failed to load events for ${dir}`, e);
                return null;
            }
        });

        vcState.clips = (await Promise.all(clipPromises)).filter(Boolean);
        renderVideoCaptioningExamples();
        initVCFilterButtons();
    } catch (error) {
        console.error('Failed to load video captioning data', error);
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Failed to load video captioning examples.</p>';
    }
}

function initVCFilterButtons() {
    document.querySelectorAll('.vc-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            vcState.activeFilter = btn.dataset.filter;
            document.querySelectorAll('.vc-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.vc-event-item').forEach(item => {
                const type = item.dataset.eventType;
                item.style.display = (vcState.activeFilter === 'all' || type === vcState.activeFilter) ? '' : 'none';
            });
        });
    });
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function getEventTypeColor(type) {
    const colors = {
        visual: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#10b981' },
        music: { bg: 'rgba(139, 92, 246, 0.12)', border: '#8b5cf6', text: '#8b5cf6' },
        speech: { bg: 'rgba(236, 72, 153, 0.12)', border: '#ec4899', text: '#ec4899' },
        sfx: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#f59e0b' }
    };
    return colors[type] || { bg: 'rgba(255,255,255,0.05)', border: 'var(--border-color)', text: 'var(--text-secondary)' };
}

function renderVideoCaptioningExamples() {
    const container = document.getElementById('videoCaptioningExamples');
    const visibleClips = vcState.clips.slice(0, vcState.visibleCount);

    let html = visibleClips.map((clip, idx) => {
        const filteredEvents = clip.events
            .filter(e => e.start_time >= clip.selStart && e.start_time < clip.selEnd)
            .sort((a, b) => a.start_time - b.start_time);

        const eventCards = filteredEvents.map((ev, evIdx) => {
            const c = getEventTypeColor(ev.type);
            const hidden = vcState.activeFilter !== 'all' && ev.type !== vcState.activeFilter;
            return `
                <div class="vc-event-item" data-event-type="${ev.type}" data-start="${ev.start_time}" data-end="${ev.end_time}" data-clip="${idx}" data-confidence="${ev.confidence || ''}" style="background:${c.bg};border-left:3px solid ${c.border};${hidden ? 'display:none;' : ''}">
                    <div class="vc-event-time" style="color:${c.text}">
                        ${formatTime(ev.start_time)} &ndash; ${formatTime(ev.end_time)}
                        <span class="vc-event-type-badge" style="background:${c.border}">${ev.type.toUpperCase()}</span>
                    </div>
                    <div class="vc-event-desc">${ev.description}</div>
                </div>
            `;
        }).join('');

        // Prettified JSON for toggle
        const jsonStr = JSON.stringify(filteredEvents, null, 2);

        return `
            <div class="vc-example-card" data-clip-index="${idx}">
                <div class="vc-video-side">
                    <div class="vc-video-wrapper">
                        <video controls preload="metadata" class="vc-video" data-clip-index="${idx}">
                            <source src="${clip.videoSrc}" type="video/mp4">
                        </video>
                        <div class="vc-caption-overlay" data-overlay="${idx}"></div>
                    </div>
                </div>
                <div class="vc-events-side">
                    <div class="vc-events-header">
                        <span class="vc-events-title">Events (${filteredEvents.length})</span>
                        <button class="vc-json-toggle-btn" onclick="toggleVcJson(${idx})">{ } View JSON</button>
                    </div>
                    <div class="vc-events-list" data-clip-list="${idx}">
                        ${eventCards}
                    </div>
                </div>
            </div>
            <div class="vc-json-view" id="vcJsonView${idx}" style="display:none;">
                <pre class="vc-json-pre">${escapeHtml(jsonStr)}</pre>
            </div>
        `;
    }).join('');

    if (vcState.visibleCount < vcState.clips.length) {
        html += `
            <div style="text-align:center;margin-top:30px;">
                <button class="show-more-btn" onclick="vcShowMore()">Show More Examples</button>
            </div>
        `;
    }

    container.innerHTML = html;
    attachVideoSyncListeners();
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toggleVcJson(idx) {
    const el = document.getElementById(`vcJsonView${idx}`);
    const card = el.previousElementSibling;
    const btn = card.querySelector('.vc-json-toggle-btn');
    if (el.style.display === 'none') {
        el.style.display = 'block';
        btn.textContent = '{ } Hide JSON';
        btn.classList.add('active');
    } else {
        el.style.display = 'none';
        btn.textContent = '{ } View JSON';
        btn.classList.remove('active');
    }
}

function attachVideoSyncListeners() {
    document.querySelectorAll('.vc-video').forEach(video => {
        const clipIdx = video.dataset.clipIndex;
        const eventList = document.querySelector(`.vc-events-list[data-clip-list="${clipIdx}"]`);
        const overlay = document.querySelector(`.vc-caption-overlay[data-overlay="${clipIdx}"]`);
        if (!eventList) return;

        let lastScrolledItem = null;
        let lastOverlayHtml = '';

        video.addEventListener('timeupdate', () => {
            const t = video.currentTime;
            const items = eventList.querySelectorAll('.vc-event-item');
            let latestActive = null;
            let latestStart = -1;
            const activeEvents = [];

            items.forEach(item => {
                const start = parseFloat(item.dataset.start);
                const end = parseFloat(item.dataset.end);
                const isActive = t >= start && t <= end;
                item.classList.toggle('vc-active', isActive);
                if (isActive && item.style.display !== 'none') {
                    activeEvents.push(item);
                    if (start > latestStart) {
                        latestStart = start;
                        latestActive = item;
                    }
                }
            });

            // Scroll to the latest active event
            if (latestActive && latestActive !== lastScrolledItem) {
                lastScrolledItem = latestActive;
                const listRect = eventList.getBoundingClientRect();
                const itemRect = latestActive.getBoundingClientRect();
                const relativeTop = itemRect.top - listRect.top + eventList.scrollTop;
                const targetScroll = relativeTop - eventList.clientHeight / 3;
                eventList.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
            }

            // Update caption overlay
            if (overlay) {
                const typeColors = {
                    music: '#e8a850', background: '#e8a850', visual: '#e8a850',
                    speech: '#e8a850', sfx: '#e8a850'
                };
                let overlayHtml = activeEvents.map(item => {
                    const evType = item.dataset.eventType || '';
                    const conf = item.dataset.confidence;
                    const desc = item.querySelector('.vc-event-desc')?.textContent || '';
                    const confStr = conf ? ` (${Math.round(parseFloat(conf) * 100)}%)` : '';
                    return `<div class="vc-overlay-line"><span class="vc-overlay-type">${evType}${confStr}</span> ${desc}</div>`;
                }).join('');
                if (overlayHtml !== lastOverlayHtml) {
                    lastOverlayHtml = overlayHtml;
                    overlay.innerHTML = overlayHtml;
                    overlay.classList.toggle('visible', activeEvents.length > 0);
                }
            }
        });
    });
}

function vcShowMore() {
    vcState.visibleCount += 6;
    renderVideoCaptioningExamples();
}

