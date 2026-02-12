#!/usr/bin/env python3
"""Extract 'dynamic-unified-1e0f7ba_tacos' captioning examples
from the captioner-examples data.json and prepare them for the TAC website."""

import json
import shutil
import os

SOURCE_DATA = "/Users/sonalkumar/Desktop/Adobe/adobe_pages/captioner-examples/data.json"
SOURCE_ASSETS = "/Users/sonalkumar/Desktop/Adobe/adobe_pages/captioner-examples/assets"
TARGET_DATA = "/Users/sonalkumar/Desktop/Adobe/tacmodel/data/captioning_examples.json"
TARGET_ASSETS = "/Users/sonalkumar/Desktop/Adobe/tacmodel/assets/captioning"

def main():
    # Load source data
    with open(SOURCE_DATA) as f:
        data = json.load(f)
    
    # Create target assets directory
    os.makedirs(TARGET_ASSETS, exist_ok=True)
    
    examples = []
    
    for row in data["rows"]:
        row_idx = row["meta_data"]["row_idx"]
        kv = row["meta_data"].get("key_val_informations", {})
        duration = kv.get("duration", "")
        
        # Find the tacos model entry
        for img in row["images"]:
            if img["meta_text"].get("model") == "dynamic-unified-1e0f7ba_tacos":
                src_video = img["video_src"]  # e.g., "assets/row0_..._vid4.mp4"
                video_filename = os.path.basename(src_video)
                
                # Copy video file
                src_path = os.path.join(SOURCE_ASSETS, video_filename)
                dst_path = os.path.join(TARGET_ASSETS, video_filename)
                
                if os.path.exists(src_path):
                    shutil.copy2(src_path, dst_path)
                    print(f"  Copied: {video_filename}")
                else:
                    print(f"  WARNING: Missing source video: {src_path}")
                
                example = {
                    "video_src": f"assets/captioning/{video_filename}",
                    "events": img["meta_text"]["events"],
                    "caption": img["meta_text"]["caption"],
                    "duration": duration,
                }
                examples.append(example)
                break
    
    # Write output JSON
    output = {"examples": examples}
    with open(TARGET_DATA, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\nExtracted {len(examples)} examples to {TARGET_DATA}")
    print(f"Video assets copied to {TARGET_ASSETS}")

if __name__ == "__main__":
    main()
