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
    initHomeCharts();
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

// Switch to a section programmatically (used by capability cards)
function switchToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        document.querySelectorAll('.nav-btn').forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
        if (link) link.classList.add('active');
    }
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
    renderHomePage();
}

// ============================================
// Home Page Showcase
// ============================================

async function renderHomePage() {
    const rowEl = document.getElementById('homeShowcaseRow');
    if (!rowEl) return;

    // ---- Column 1: Audio Captioning ----
    let audioHtml = '<div class="home-showcase-empty">Loading…</div>';
    const audioClip = acState.clips?.[0];
    if (audioClip && audioClip.eventData) {
        const rawEvents = audioClip.eventData.events || [];
        const events = mergeTranscriptionAsEvents(rawEvents, audioClip.eventData.transcription);
        const eventCards = events.slice(0, 12).map(ev => {
            const c = getEventTypeColor(ev.type);
            return `
                <div class="home-event-chip" style="border-left:3px solid ${c.border};background:${c.bg}">
                    <div class="home-event-chip-row">
                        <span class="home-event-badge" style="background:${c.border}">${ev.type.toUpperCase()}</span>
                        <span class="home-event-time">${formatTime(ev.start_time)}–${formatTime(ev.end_time)}</span>
                    </div>
                    <span class="home-event-desc">${ev.description}</span>
                </div>
            `;
        }).join('');
        audioHtml = `
            <div class="home-showcase-header">🎵 Audio Captioning</div>
            <div class="home-showcase-media">
                <div class="ac-spec-wrapper home-spec" data-home-audio="0">
                    <img src="${audioClip.melspecSrc}" class="ac-melspec" draggable="false">
                    <div class="ac-playhead"></div>
                    <div class="ac-overlay-container"></div>
                    <div class="ac-caption-overlay" data-home-overlay="audio"></div>
                </div>
                <audio class="home-audio" controls preload="metadata" data-home-audio="0">
                    <source src="${audioClip.video_src}" type="video/mp4">
                </audio>
            </div>
            <button class="home-reasoning-toggle active" style="margin-top:12px;" onclick="toggleHomeEventList(this)">▼ Hide Event List</button>
            <div class="home-event-list" style="display:flex; margin-top:12px;">${eventCards}</div>
        `;
    }

    // ---- Column 2: AV Captioning ----
    let videoHtml = '<div class="home-showcase-empty">Loading…</div>';
    const videoClip = vcState.clips?.[0];
    if (videoClip) {
        const filteredEvents = videoClip.events
            .filter(e => e.start_time >= videoClip.selStart && e.start_time < videoClip.selEnd)
            .sort((a, b) => a.start_time - b.start_time);
        const eventCards = filteredEvents.slice(0, 12).map(ev => {
            const c = getEventTypeColor(ev.type);
            return `
                <div class="home-event-chip" style="border-left:3px solid ${c.border};background:${c.bg}">
                    <div class="home-event-chip-row">
                        <span class="home-event-badge" style="background:${c.border}">${ev.type.toUpperCase()}</span>
                        <span class="home-event-time">${formatTime(ev.start_time)}–${formatTime(ev.end_time)}</span>
                    </div>
                    <span class="home-event-desc">${ev.description}</span>
                </div>
            `;
        }).join('');
        videoHtml = `
            <div class="home-showcase-header">🎬 AV Captioning</div>
            <div class="home-showcase-media">
                <div class="vc-video-wrapper home-video-wrap">
                    <video class="home-video" controls preload="metadata">
                        <source src="${videoClip.videoSrc}" type="video/mp4">
                    </video>
                    <div class="vc-caption-overlay home-vc-overlay" data-home-overlay="video"></div>
                </div>
            </div>
            <button class="home-reasoning-toggle active" style="margin-top:12px;" onclick="toggleHomeEventList(this)">▼ Hide Event List</button>
            <div class="home-event-list" style="display:flex; margin-top:12px;">${eventCards}</div>
        `;
    }

    // ---- Column 3: Reasoning ----
    const example = {
        type: 'Event Sequence',
        benchmark: 'Daily-Omni',
        video_src: 'assets/Ec_lQgZ9wlg.mp4',
        question: "What visual elements were displayed immediately after Dr. Rajani's 'BOTOX WITHOUT THE BOTOX' video concluded?",
        choices: [
            "Still product bottle → Price text overlay",
            "Facial treatment demonstration → Presenter holding product while explaining",
            "Presenter's torso shot → Secondary screen activation",
            "Bookshelf backdrop → Close-up of string lights"
        ],
        answer: 'B',
        model_answer: 'B',
        shot_list: [
            { type: 'visual', start_time: '0.0s', end_time: '5.1s', content: 'Woman with long brown hair speaks directly to camera, smiling, in front of plant and bookshelf <speech lang=en>"Hi, and welcome to The Honest Channel."</speech>' },
            { type: 'speech', start_time: '0.1s', end_time: '7.4s', content: 'Woman in dark blouse speaks clearly, eyes focused, slight head movements, consistent expression (0.98) <speech lang=en>"I\'m Claire Johnston, a journalist with an interest in all things anti-aging and aging well."</speech>' },
            { type: 'visual', start_time: '5.1s', end_time: '7.4s', content: 'Woman continues speaking, hands slightly raised, maintaining eye contact, calm demeanor' },
            { type: 'visual', start_time: '7.4s', end_time: '8.9s', content: 'Inset video appears in top left: man in dark shirt speaks in front of brick wall with text "BOTOX WITHOUT THE BOTOX"' },
            { type: 'speech', start_time: '7.5s', end_time: '20.0s', content: 'Woman speaks while holding black pen-like device, gestures with hands, inset video shows facial treatment (0.96) <speech lang=en>"And so I was watching one of my YouTube favorites, Dr. Anil Rajani, recently..."</speech>' },
            { type: 'visual', start_time: '9.5s', end_time: '12.1s', content: 'Inset video shows man speaking then woman receiving forehead treatment with black device, main speaker holds similar device' },
            { type: 'visual', start_time: '12.1s', end_time: '15.4s', content: 'Inset video shows treatment application on forehead, main speaker holds device up, turns it to show tip' },
            { type: 'visual', start_time: '15.4s', end_time: '17.7s', content: 'Inset video continues showing treatment, main speaker lowers device, gestures with hands while speaking' },
            { type: 'visual', start_time: '17.7s', end_time: '19.2s', content: 'Inset video disappears, woman continues speaking, hands gesturing, steady eye contact with camera <speech lang=en>"The product he was talking about is this Revox Line Relaxer..."</speech>' },
            { type: 'visual', start_time: '19.8s', end_time: '20.0s', content: 'Woman continues speaking, expression neutral, hands slightly lowered, camera focused on her face' },
            { type: 'speech', start_time: '20.0s', end_time: '30.0s', content: 'Woman with long brown hair speaks formally to camera, holding a black skincare pen, lips moving in sync with voice (0.91)' },
            { type: 'visual', start_time: '20.0s', end_time: '30.0s', content: 'Split-screen view: product image of Revox Line Relaxer on left, woman holding same item on right, bookshelf with fairy lights in background <speech lang=en>"That price in itself"</speech>' }
        ],
        model_reasoning: `Based on the provided caption, here is the step-by-step reasoning:

1.  **Identify the end of Dr. Rajani's video:** The caption describes an inset video (Dr. Rajani's clip with the text "BOTOX WITHOUT THE BOTOX" and treatment demonstration) appearing at 7.4s. This inset video continues through shots 6, 7, and 8.
2.  **Pinpoint the moment the video concludes:** Shot 9 (17.7s - 19.2s) explicitly states: "Inset video disappears, woman continues speaking..." This marks the end of Dr. Rajani's video.
3.  **Analyze the visual elements immediately following:**
    *   In Shot 9 (17.7s - 19.2s) and Shot 10 (19.8s - 20.0s), the woman (the presenter) is seen speaking, gesturing, and holding the device. This is a shot of her torso/upper body.
    *   However, immediately *after* this brief return to the full shot of the presenter (or simultaneously with the next major visual change), we look at Shot 12 (20.0s - 30.0s). The description is: "Split-screen view: product image of Revox Line Relaxer on left, woman holding same item on right..."
4.  **Evaluate the options:**
    *   **A. Still product bottle → Price text overlay:** While a product is shown in Shot 12, there is no mention of a standalone still bottle followed by text overlay immediately after the video ends.
    *   **B. Facial treatment demonstration → Presenter holding product while explaining:** The facial treatment was *part* of Dr. Rajani's video. Once that ends (Shot 9), the visual is the presenter holding the product and explaining. This matches the transition from the inset video (treatment) to the presenter holding the device.
    *   **C. Presenter's torso shot → Secondary screen activation:** The "secondary screen" (the inset video) *deactivates* or disappears; it doesn't activate.
    *   **D. Bookshelf backdrop → Close-up of string lights:** These are background elements present throughout, not the primary visual change.

**Refined Reasoning:**
The question asks what was displayed *immediately after* the video concluded.
- At 17.7s (Shot 9), the inset video disappears.
- The visual description for Shot 9 says: "woman continues speaking...". She is holding the device (mentioned in previous shots).
- The most accurate description of the visual state immediately following the clip's conclusion is the presenter holding the product while explaining (Shot 9/10), which serves as a bridge before the split-screen in Shot 12. Option B describes this transition perfectly: The "Facial treatment demonstration" (the content of the concluding video) transitions to the "Presenter holding product while explaining."

Therefore, the visual sequence is the end of the treatment demo (Dr. Rajani's video) leading into the presenter holding the product.

{"answer": "B"}`
    };

    const choicesHtml = example.choices.map((c, i) => {
        const letter = String.fromCharCode(65 + i);
        const isCorrect = letter === example.answer;
        return `<div class="home-choice ${isCorrect ? 'correct' : ''}">
            <span class="home-choice-letter">${letter}</span>
            <span>${c}</span>
            ${isCorrect ? '<span class="home-choice-tag correct-tag">✓ Correct</span>' : ''}
        </div>`;
    }).join('');

    const shotColors = { visual: '#10b981', audio: '#a78bfa', speech: '#f59e0b' };
    const shotsHtml = example.shot_list.map(s => `
        <div class="home-shot" style="border-left:3px solid ${shotColors[s.type] || '#888'}">
            <span class="home-shot-type" style="color:${shotColors[s.type] || '#888'}">[${s.type}]</span>
            <span class="home-shot-time">${s.start_time}–${s.end_time}</span>
            <span>${s.content}</span>
        </div>
    `).join('');

    const reasoningHtml = `
        <div class="home-showcase-header">🧠 TAC→LLM Reasoning</div>
        <div class="home-showcase-media">
            <div class="vc-video-wrapper home-video-wrap">
                <video class="home-reasoning-video" controls preload="metadata">
                    <source src="${example.video_src}" type="video/mp4">
                </video>
                <div class="vc-caption-overlay home-reasoning-overlay"></div>
            </div>
        </div>
        <div class="home-reasoning-meta">
            <span class="home-reasoning-badge">${example.benchmark}</span>
            <span class="home-reasoning-type">${example.type}</span>
        </div>
        <div class="home-reasoning-question">${example.question}</div>
        <div class="home-choices">${choicesHtml}</div>
        <button class="home-reasoning-toggle" onclick="toggleHomeReasoning(this)">
            ▶ Show Reasoning & Shot List
        </button>
        <div class="home-reasoning-body" style="display:none;">
            <div class="home-reasoning-section">
                <h4>TAC Shot List</h4>
                <div class="home-shots">${shotsHtml}</div>
            </div>
            <div class="home-reasoning-section">
                <h4>Model Reasoning</h4>
                <p class="home-reasoning-text">${example.model_reasoning}</p>
            </div>
        </div>
    `;

    // Render all 3 columns
    rowEl.innerHTML = `
        <div class="home-showcase-col">${audioHtml}</div>
        <div class="home-showcase-col">${videoHtml}</div>
        <div class="home-showcase-col">${reasoningHtml}</div>
    `;

    // Wire up home audio playhead sync
    const homeAudio = rowEl.querySelector('.home-audio');
    const homeSpec = rowEl.querySelector('.home-spec');
    if (homeAudio && homeSpec) {
        const playhead = homeSpec.querySelector('.ac-playhead');
        const overlayDiv = homeSpec.querySelector('.ac-caption-overlay');
        const duration = 15;
        homeAudio.addEventListener('timeupdate', () => {
            const t = homeAudio.currentTime;
            const pct = (t / duration) * 100;
            if (playhead) playhead.style.left = pct + '%';
            if (overlayDiv && audioClip?.eventData) {
                const rawEvts = audioClip.eventData.events || [];
                const allEvts = mergeTranscriptionAsEvents(rawEvts, audioClip.eventData.transcription);
                const active = allEvts.filter(ev => t >= ev.start_time && t <= ev.end_time);
                overlayDiv.innerHTML = active.map(ev => {
                    return `<div class="ac-overlay-line"><span class="ac-overlay-type">${ev.type}</span> ${ev.description}</div>`;
                }).join('');
                overlayDiv.classList.toggle('visible', active.length > 0);
            }
        });
        homeSpec.addEventListener('click', (e) => {
            const rect = homeSpec.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            homeAudio.currentTime = pct * duration;
        });
    }

    // Wire up AV video caption overlay
    const homeVideo = rowEl.querySelector('.home-video');
    const homeVcOverlay = rowEl.querySelector('.home-vc-overlay');
    if (homeVideo && homeVcOverlay && videoClip) {
        homeVideo.addEventListener('timeupdate', () => {
            const t = homeVideo.currentTime;
            const activeEvts = videoClip.events.filter(ev => t >= ev.start_time && t <= ev.end_time);
            if (activeEvts.length > 0) {
                homeVcOverlay.innerHTML = activeEvts.map(ev => {
                    return `<div class="ac-overlay-line"><span class="ac-overlay-type">${ev.type}</span> ${ev.description}</div>`;
                }).join('');
                homeVcOverlay.classList.add('visible');
            } else {
                homeVcOverlay.innerHTML = '';
                homeVcOverlay.classList.remove('visible');
            }
        });
    }

    // Wire up reasoning video caption overlay
    const reasoningVideo = rowEl.querySelector('.home-reasoning-video');
    const reasoningOverlay = rowEl.querySelector('.home-reasoning-overlay');
    if (reasoningVideo && reasoningOverlay) {
        // Parse shot_list times to numbers for matching
        const shots = example.shot_list.map(s => ({
            ...s,
            startNum: parseFloat(s.start_time),
            endNum: parseFloat(s.end_time)
        }));
        reasoningVideo.addEventListener('timeupdate', () => {
            const t = reasoningVideo.currentTime;
            const active = shots.filter(s => t >= s.startNum && t <= s.endNum);
            if (active.length > 0) {
                reasoningOverlay.innerHTML = active.map(s => {
                    return `<div class="ac-overlay-line"><span class="ac-overlay-type">${s.type}</span> ${s.content}</div>`;
                }).join('');
                reasoningOverlay.classList.add('visible');
            } else {
                reasoningOverlay.innerHTML = '';
                reasoningOverlay.classList.remove('visible');
            }
        });
    }
}

function toggleHomeReasoning(btn) {
    const body = btn.nextElementSibling;
    if (body.style.display === 'none') {
        body.style.display = 'block';
        btn.textContent = '▼ Hide Reasoning & Shot List';
        btn.classList.add('active');
    } else {
        body.style.display = 'none';
        btn.textContent = '▶ Show Reasoning & Shot List';
        btn.classList.remove('active');
    }
}

function toggleHomeEventList(btn) {
    const list = btn.nextElementSibling;
    if (list.style.display === 'none') {
        list.style.display = 'flex';
        btn.textContent = '▼ Hide Event List';
        btn.classList.add('active');
    } else {
        list.style.display = 'none';
        btn.textContent = '▶ Show Event List';
        btn.classList.remove('active');
    }
}

async function loadCaptioningData() {
    const container = document.getElementById('audioCaptioningExamples');
    if (!container) return;
    container.innerHTML = createLoadingHTML();

    try {
        const response = await fetch('data/captioning_examples.json');
        if (response.ok) {
            const data = await response.json();

            // Fetch detailed event JSONs for each example
            const examples = await Promise.all(data.examples.map(async (ex) => {
                const basename = ex.video_src.split('/').pop().replace('.mp4', '');
                try {
                    const res = await fetch(`assets/captioning/jsons/${basename}.json`);
                    if (res.ok) {
                        const eventData = await res.json();
                        // Add metadata to example object
                        return {
                            ...ex,
                            eventData: eventData, // events, transcription, etc.
                            melspecSrc: `assets/captioning/melspecs/${basename}.png`,
                            basename: basename
                        };
                    }
                } catch (e) {
                    console.warn(`Failed to load JSON for ${basename}`, e);
                }
                return ex; // Return original if fail, though visualization might be limited
            }));

            // Initialize AC state
            acState.clips = examples;
            acState.visibleCount = 6;
            acState.activeFilter = 'all';

            renderAudioCaptioningExamples();
            setupACFilters();
        }
    } catch (error) {
        console.error('Error loading audio captioning data:', error);
        container.innerHTML = createEmptyStateHTML('Failed to load examples');
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

    // Expand first reasoning chain by default
    if (examples.length > 0) {
        setTimeout(() => toggleAudioReasoning('audio-0'), 0);
    }
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
                    <span>View Reasoning Chain</span>
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

function renderAudioCaptioningExamples() {
    const container = document.getElementById('audioCaptioningExamples');
    if (!acState.clips || acState.clips.length === 0) {
        container.innerHTML = createEmptyStateHTML('No audio captioning examples available');
        return;
    }

    const visibleClips = acState.clips.slice(0, acState.visibleCount);

    // Generate HTML for each clip
    const itemsHtml = visibleClips.map((clip, idx) => {
        const rawEvents = clip.eventData?.events || [];
        const events = mergeTranscriptionAsEvents(rawEvents, clip.eventData?.transcription);
        const melspec = clip.melspecSrc;

        // Filter events for sidebar list
        const filteredEvents = events.filter(ev => {
            if (acState.activeFilter === 'all') return true;
            return ev.type === acState.activeFilter;
        });

        // Generate sidebar event cards
        const eventCards = filteredEvents.map(ev => {
            const typeClass = ev.type || 'default';
            // Check if active (logic will be in sync listener)
            return `
                <div class="vc-event-card" data-start="${ev.start_time}" data-end="${ev.end_time}" data-type="${ev.type}">
                    <div class="vc-event-time">
                        ${formatTime(ev.start_time)} – ${formatTime(ev.end_time)}
                        <span class="vc-event-badge ${typeClass}">${ev.type.toUpperCase()}</span>
                    </div>
                    <div class="vc-event-desc">${ev.description}</div>
                </div>
            `;
        }).join('');

        // Prettified JSON
        const jsonStr = clip.eventData ? JSON.stringify(clip.eventData, null, 2) : '{}';

        return `
            <div class="ac-example-card" data-clip-index="${idx}">
                <!-- Left: Audio + Mel Spectrogram -->
                <div class="ac-visual-side">
                    <div class="ac-spec-wrapper" data-clip-index="${idx}">
                        <img src="${melspec}" class="ac-melspec" draggable="false">
                        <div class="ac-playhead"></div>
                        <div class="ac-overlay-container"></div>
                        <div class="ac-caption-overlay" data-overlay="${idx}"></div>
                    </div>
                    <audio class="ac-audio" controls preload="metadata" data-clip-index="${idx}">
                        <source src="${clip.video_src}" type="video/mp4">
                    </audio>
                </div>
                
                <!-- Right: Events -->
                <div class="ac-events-side">
                    <div class="vc-events-header">
                        <span class="vc-events-title">Events (${filteredEvents.length})</span>
                        <button class="vc-json-toggle-btn" onclick="toggleAcJson(${idx})">{ } View JSON</button>
                    </div>
                    <div class="vc-events-list" data-clip-list="${idx}">
                        ${eventCards}
                    </div>
                </div>
            </div>
            <!-- Full Width JSON View -->
            <div class="vc-json-view" id="acJsonView${idx}" style="display:none;">
                <pre class="vc-json-pre">${escapeHtml(jsonStr)}</pre>
            </div>
        `;
    }).join('');

    let loadMoreHtml = '';
    if (acState.visibleCount < acState.clips.length) {
        loadMoreHtml = `
            <div class="vc-load-more-container">
                <button class="vc-load-more-btn" onclick="loadACMore()">Load More (${acState.clips.length - acState.visibleCount} remaining)</button>
            </div>
        `;
    }

    container.innerHTML = itemsHtml + loadMoreHtml;

    // Attach listeners
    attachAudioSyncListeners();
}

function setupACFilters() {
    const btns = document.querySelectorAll('.ac-filter-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            acState.activeFilter = btn.dataset.filter;
            renderAudioCaptioningExamples();
        });
    });
}

function loadACMore() {
    acState.visibleCount += 6;
    renderAudioCaptioningExamples();
}

function toggleAcJson(idx) {
    const el = document.getElementById(`acJsonView${idx}`);
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

    // Expand first reasoning chain by default
    if (examples.length > 0) {
        setTimeout(() => toggleReasoning(0), 0);
    }
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

// Video Captioning State
const vcState = {
    clips: [],
    visibleCount: 6,
    activeFilter: 'all',
    transcriptionByClip: {}
};

// Audio Captioning State
const acState = {
    clips: [],
    visibleCount: 6,
    activeFilter: 'all'
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
                const rawEvents = eventsData.events || [];
                const mergedEvents = mergeTranscriptionAsEvents(rawEvents, eventsData.transcription);
                const transcriptionSegments = (eventsData.transcription?.segments || []).map(seg => ({
                    start: seg.start,
                    end: seg.end,
                    text: seg.text.trim()
                }));
                return {
                    id: dir,
                    videoSrc: `${basePath}/clip.mp4`,
                    events: mergedEvents,
                    transcriptionSegments,
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

/**
 * Merge transcription segments into an events array as their own type.
 */
function mergeTranscriptionAsEvents(events, transcription) {
    if (!transcription?.segments || transcription.segments.length === 0) return events;
    const merged = [...events];
    transcription.segments.forEach(seg => {
        merged.push({
            type: 'transcription',
            start_time: seg.start,
            end_time: seg.end,
            description: `"${seg.text.trim()}"`,
            confidence: null,
            _isTranscription: true
        });
    });
    return merged.sort((a, b) => a.start_time - b.start_time);
}

function getEventTypeColor(type) {
    const colors = {
        visual: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', text: '#10b981' },
        music: { bg: 'rgba(139, 92, 246, 0.12)', border: '#8b5cf6', text: '#8b5cf6' },
        speech: { bg: 'rgba(236, 72, 153, 0.12)', border: '#ec4899', text: '#ec4899' },
        sfx: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', text: '#f59e0b' },
        transcription: { bg: 'rgba(56, 189, 248, 0.12)', border: '#38bdf8', text: '#38bdf8' }
    };
    return colors[type] || { bg: 'rgba(255,255,255,0.05)', border: 'var(--border-color)', text: 'var(--text-secondary)' };
}

function renderVideoCaptioningExamples() {
    const container = document.getElementById('videoCaptioningExamples');
    const visibleClips = vcState.clips.slice(0, vcState.visibleCount);

    let html = visibleClips.map((clip, idx) => {
        vcState.transcriptionByClip[idx] = (clip.transcriptionSegments || [])
            .filter(seg => seg.start >= clip.selStart && seg.start < clip.selEnd);

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
                        <div class="vc-transcription-overlay" data-transcription-overlay="${idx}"></div>
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
    const vcSection = document.getElementById('videocaptioning');
    if (!vcSection) return;
    vcSection.querySelectorAll('.vc-video').forEach(video => {
        const clipIdx = video.dataset.clipIndex;
        const card = video.closest('.vc-example-card');
        const eventList = card?.querySelector(`.vc-events-list[data-clip-list="${clipIdx}"]`);
        const overlay = card?.querySelector('.vc-caption-overlay');
        const transcriptionOverlay = card?.querySelector('.vc-transcription-overlay');
        const transcriptionSegments = vcState.transcriptionByClip[clipIdx] || [];
        if (!eventList) return;

        let lastScrolledItem = null;
        let lastOverlayHtml = '';
        let lastTranscriptionHtml = '';

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

            // Update transcription overlay
            if (transcriptionOverlay) {
                const activeSegments = transcriptionSegments.filter(seg => t >= seg.start && t <= seg.end);
                const transHtml = activeSegments.map(seg =>
                    `<div class="vc-transcription-line">${seg.text}</div>`
                ).join('');
                if (transHtml !== lastTranscriptionHtml) {
                    lastTranscriptionHtml = transHtml;
                    transcriptionOverlay.innerHTML = transHtml;
                    transcriptionOverlay.classList.toggle('visible', activeSegments.length > 0);
                }
            }

            // Update caption overlay
            if (overlay) {
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


function attachAudioSyncListeners() {
    const container = document.getElementById('audioCaptioningExamples');
    if (!container) return;

    acState.clips.slice(0, acState.visibleCount).forEach((clip, idx) => {
        const audio = container.querySelector(`audio[data-clip-index="${idx}"]`);
        const specWrapper = container.querySelector(`.ac-spec-wrapper[data-clip-index="${idx}"]`);
        const eventList = container.querySelector(`.vc-events-list[data-clip-list="${idx}"]`);
        const playhead = specWrapper?.querySelector('.ac-playhead');
        const overlayContainer = specWrapper?.querySelector('.ac-overlay-container');
        const captionOverlay = container.querySelector(`.ac-caption-overlay[data-overlay="${idx}"]`);

        if (!audio || !specWrapper || !overlayContainer) return;
        let lastOverlayHtml = '';
        let lastScrolledCard = null;

        // Render static overlay boxes if not present
        if (overlayContainer.children.length === 0 && clip.eventData?.events) {
            const events = clip.eventData.events;
            const duration = clip.eventData.duration || 15.0;

            events.forEach(ev => {
                // Filter by type if needed, but showing all gives context
                // unless filtered out by UI state.
                // The render function handles sidebar filtering. 
                // For spectrogram overlays, let's respect the filter too?
                if (acState.activeFilter !== 'all' && ev.type !== acState.activeFilter) return;

                const start = ev.start_time;
                const end = ev.end_time;
                const left = (start / duration) * 100;
                const width = ((end - start) / duration) * 100;
                const typeClass = ev.type || 'default';

                const box = document.createElement('div');
                box.className = `ac-overlay-box ${typeClass}`;
                box.style.left = `${left}%`;
                box.style.width = `${width}%`;
                box.title = `${ev.type}: ${ev.description}`;
                overlayContainer.appendChild(box);
            });
        }

        // Sync Listener
        audio.ontimeupdate = () => {
            const t = audio.currentTime;
            const d = audio.duration || 15.0;
            const pct = (t / d) * 100;

            // Move playhead
            if (playhead) playhead.style.left = `${pct}%`;

            // Highlight events + build caption overlay
            const activeDescs = [];
            if (eventList) {
                const cards = eventList.querySelectorAll('.vc-event-card');
                let activeCard = null;

                cards.forEach(card => {
                    const start = parseFloat(card.dataset.start);
                    const end = parseFloat(card.dataset.end);
                    if (t >= start && t < end) {
                        card.classList.add('active');
                        activeCard = card;
                        activeDescs.push({
                            type: card.dataset.type || '',
                            desc: card.querySelector('.vc-event-desc')?.textContent || ''
                        });
                    } else {
                        card.classList.remove('active');
                    }
                });

                // Auto-scroll logic (only when active card changes)
                if (activeCard && activeCard !== lastScrolledCard && !eventList.matches(':hover')) {
                    lastScrolledCard = activeCard;
                    const listRect = eventList.getBoundingClientRect();
                    const itemRect = activeCard.getBoundingClientRect();
                    const relativeTop = itemRect.top - listRect.top + eventList.scrollTop;
                    const targetScroll = relativeTop - eventList.clientHeight / 3;
                    eventList.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
                }
            }

            // Also check all events for the overlay (not just filtered sidebar ones)
            if (clip.eventData?.events) {
                clip.eventData.events.forEach(ev => {
                    if (t >= ev.start_time && t < ev.end_time) {
                        // Only add if not already in activeDescs from sidebar
                        const already = activeDescs.some(a => a.desc === ev.description);
                        if (!already) {
                            activeDescs.push({ type: ev.type, desc: ev.description });
                        }
                    }
                });
            }

            // Update caption overlay
            if (captionOverlay) {
                const overlayHtml = activeDescs.map(a =>
                    `<div class="ac-overlay-line"><span class="ac-overlay-type ${a.type}">${a.type}</span> ${a.desc}</div>`
                ).join('');
                if (overlayHtml !== lastOverlayHtml) {
                    lastOverlayHtml = overlayHtml;
                    captionOverlay.innerHTML = overlayHtml;
                    captionOverlay.classList.toggle('visible', activeDescs.length > 0);
                }
            }
        };

        // Click on spectrogram to seek
        specWrapper.onclick = (e) => {
            const rect = specWrapper.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const w = rect.width;
            const pct = Math.max(0, Math.min(1, x / w));
            const d = audio.duration || 15.0;
            audio.currentTime = pct * d;
        };
    });
}

// ============================================
// Charts
// ============================================

function initHomeCharts() {
    // Register the plugin if available globally
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    const ctxAV = document.getElementById('avChart');
    const ctxAudio = document.getElementById('audioChart');
    const commonOptions = getChartOptions();

    if (ctxAV) {
        new Chart(ctxAV, {
            type: 'bar',
            data: {
                labels: ['Daily-Omni', 'World-Sense', 'Video-Holmes', 'AVHBench'],
                datasets: [
                    {
                        label: ' Native MLLM',
                        data: [76.2, 65.1, 57.3, 58.5],
                        modelNames: ['Qwen3 Omni', 'Gemini 2.5 Pro', 'Qwen3 Omni', 'Panda GPT'],
                        backgroundColor: 'rgba(160, 160, 176, 0.5)',
                        borderColor: 'rgba(160, 160, 176, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        maxBarThickness: 50,
                        datalabels: {
                            display: true,
                            align: 'start',
                            anchor: 'end',
                            offset: 8,
                            color: '#e0e0e0',
                            font: { size: 9, family: 'Inter', weight: 500 },
                            formatter: function (value, context) {
                                const name = context.dataset.modelNames[context.dataIndex];
                                return name.split(' ');
                            },
                            rotation: 0
                        }
                    },
                    {
                        label: ' TAC-V + Gemini 3',
                        data: [77.9, 58.6, 59.2, 81.7],
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        maxBarThickness: 50,
                        datalabels: { display: false }
                    }
                ]
            },
            options: commonOptions
        });
    }

    if (ctxAudio) {
        new Chart(ctxAudio, {
            type: 'bar',
            data: {
                labels: ['MMAU', 'MMAR', 'MMSU', 'MMAU-Pro'],
                datasets: [
                    {
                        label: ' Native LALM',
                        data: [75.9, 60.1, 62.3, 59.2],
                        modelNames: ['Audio Thinker', 'Audio Flamingo 3', 'Audio Flamingo 3', 'Gemini 2.5 Flash'],
                        backgroundColor: 'rgba(160, 160, 176, 0.5)',
                        borderColor: 'rgba(160, 160, 176, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        maxBarThickness: 50,
                        datalabels: {
                            display: true,
                            align: 'start',
                            anchor: 'end',
                            offset: 8,
                            color: '#e0e0e0',
                            font: { size: 9, family: 'Inter', weight: 500 },
                            formatter: function (value, context) {
                                const name = context.dataset.modelNames[context.dataIndex];
                                return name.split(' ');
                            },
                            rotation: 0
                        }
                    },
                    {
                        label: ' TAC + Gemini 3',
                        data: [72.2, 71.9, 72.4, 62.9],
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        maxBarThickness: 50,
                        datalabels: { display: false }
                    }
                ]
            },
            options: commonOptions
        });
    }
}

function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#a0a0b0', padding: 20, font: { family: 'Inter', size: 11 }, usePointStyle: true, boxWidth: 6 }
            },
            tooltip: {
                backgroundColor: 'rgba(20, 20, 30, 0.9)',
                titleColor: '#fff',
                bodyColor: '#ccc',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return context.dataset.label + ': ' + context.parsed.y;
                    }
                }
            },
            datalabels: {
                display: false, // Default to false
                clip: false,
                clamp: true
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 30,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#6a6a7a', font: { family: 'JetBrains Mono', size: 10 } },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#a0a0b0', font: { family: 'Inter', size: 11 } },
                border: { display: false }
            }
        },
        animation: { duration: 1500, easing: 'easeOutQuart' }
    };
}
