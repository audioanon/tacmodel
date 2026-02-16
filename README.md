# TAC - Temporal Audio Captioning

An academic website showcasing temporal audio captioning and audio-visual understanding capabilities.

## 🚀 Quick Start

### Local Development

```bash
# Navigate to the project directory
cd tacmodel

# Start a local server
python -m http.server 8000

# Open in browser
open http://localhost:8000
```

### GitHub Pages Deployment

1. Push this repository to GitHub
2. Go to Settings → Pages
3. Select "Deploy from a branch" → `main` → `/ (root)`
4. Your site will be live at `https://username.github.io/tacmodel`

## 📁 Project Structure

```
tacmodel/
├── index.html              # Main HTML file
├── style.css               # Styles with dark theme
├── main.js                 # JavaScript functionality
├── README.md               # This file
├── data/
│   ├── captioning_examples.json    # Captioning demo data
│   └── benchmark_examples.json     # AV benchmark examples
└── assets/
    └── (video files go here)
```

## 📝 Adding Content

### Captioning Examples

Edit `data/captioning_examples.json`:
```json
{
  "examples": [
    {
      "id": "unique_id",
      "title": "Example Title",
      "video_src": "assets/video.mp4",
      "caption": "Detailed temporal caption...",
      "tags": ["Tag1", "Tag2"]
    }
  ]
}
```

### Benchmark Examples

Edit `data/benchmark_examples.json`:
```json
{
  "benchmarks": [
    {
      "benchmark": "dailyomni",  // dailyomni, holmes, or mmau
      "type": "Event Sequence",
      "video_src": "assets/video.mp4",
      "question": "Question text?",
      "choices": ["A", "B", "C", "D"],
      "answer": "A",
      "model_answer": "A",
      "shot_list": [...],
      "model_reasoning": "Reasoning explanation..."
    }
  ]
}
```

## 🎨 Customization

- **Colors**: Edit CSS variables in `style.css` (`:root` section)
- **Content**: Update placeholders in `index.html` (About section)
- **Data**: Replace sample data in `data/` with real examples

## 📄 License

MIT License
# tacmodel
