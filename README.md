# LongCat-Video-Avatar 1.5 — Setup

Reproducible setup for **[LongCat-Video-Avatar 1.5](https://huggingface.co/meituan-longcat/LongCat-Video-Avatar-1.5)**,
Meituan's open-source, audio-driven talking-head (digital human) video model.
Give it a single portrait image + an audio track and it generates a lip-synced
video of that person speaking.

This repo doesn't vendor the model — it provides scripts that clone the official
[`meituan-longcat/LongCat-Video`](https://github.com/meituan-longcat/LongCat-Video)
code, build the environment, fetch the weights, and run inference with sensible
defaults.

## Requirements

- Linux with one or more **CUDA-capable GPUs** (multi-GPU recommended; the
  default run shards across 2 GPUs via context parallelism).
- [conda](https://docs.conda.io/en/latest/miniconda.html) (Miniconda/Anaconda).
- `git`, and a CUDA 12.x driver (defaults target CUDA 12.4).
- Disk space for the model weights (tens of GB) downloaded from Hugging Face.

## Quick start

```bash
# 1. Install everything (conda env + code + weights). ~tens of GB download.
./setup.sh

# 2. Add your inputs and point the spec at them.
#    Put a portrait + audio under assets/avatar/inputs/ and edit
#    assets/avatar/single_example.json (image / audio / prompt).

# 3. Generate a talking-head video.
./run_avatar.sh
```

The rendered video is written under the cloned `LongCat-Video/` output
directory.

## What `setup.sh` does

1. Clones `LongCat-Video` into `./LongCat-Video`.
2. Creates a conda env (`longcat-video`, Python 3.10).
3. Installs PyTorch 2.6 (+cu124), FlashAttention 2, and the upstream
   `requirements.txt` / `requirements_avatar.txt`, plus `librosa` + `ffmpeg`.
4. Downloads the weights into `LongCat-Video/weights/`:
   - `LongCat-Video` — base video model (required dependency).
   - `LongCat-Video-Avatar-1.5` — the avatar model.

Useful flags:

```bash
./setup.sh --skip-weights   # set up env/code, download weights later
./setup.sh --skip-env       # install into the currently active env
ENV_NAME=mycat CUDA=cu121 ./setup.sh   # override defaults
```

## Configuration

Runtime parameters live in [`config/avatar.env`](config/avatar.env) and are read
by `run_avatar.sh`. Any of them can also be overridden inline:

```bash
RESOLUTION=480P AUDIO_CFG=5 ./run_avatar.sh
INPUT_JSON=assets/avatar/my_clip.json ./run_avatar.sh
```

| Variable          | Default  | Notes |
|-------------------|----------|-------|
| `NUM_GPUS`        | `2`      | GPUs to shard across (== context parallel size). |
| `RESOLUTION`      | `720P`   | `480P` is faster / lower VRAM. |
| `AUDIO_CFG`       | `4.5`    | Audio CFG; 3–5 is best, higher = tighter lip-sync. |
| `REF_IMG_INDEX`   | `10`     | 0–24 for identity consistency; outside reduces repeated actions. |
| `MASK_FRAME_RANGE`| `3`      | Higher reduces repeated actions but may add artifacts. |
| `USE_DISTILL`     | `1`      | Distilled (faster) sampler. |
| `USE_INT8`        | `1`      | int8 weights to cut VRAM. |

## Input format

`run_avatar.sh` feeds an input JSON to the model. See
[`assets/avatar/single_example.json`](assets/avatar/single_example.json):

```json
{
  "cases": [
    {
      "image": "assets/avatar/inputs/portrait.png",
      "audio": "assets/avatar/inputs/speech.wav",
      "prompt": "A photorealistic portrait ... talking and speaking naturally ...",
      "seed": 42
    }
  ]
}
```

Tips: use a clear front-facing portrait, include verbal-action cues
("talking", "speaking") in the prompt, and write longer descriptive prompts
(appearance + action + scene) for better consistency.

## Equivalent manual command

`run_avatar.sh` is a wrapper around the upstream demo:

```bash
cd LongCat-Video
torchrun --nproc_per_node=2 run_demo_avatar_single_audio_to_video.py \
  --context_parallel_size=2 \
  --checkpoint_dir=weights/LongCat-Video-Avatar-1.5 \
  --stage_1=at2v \
  --input_json=assets/avatar/single_example.json \
  --model_type avatar-v1.5 \
  --use_distill --use_int8
```

## License & credits

The model and upstream code are by Meituan (`meituan-longcat`); see their
[GitHub repo](https://github.com/meituan-longcat/LongCat-Video) and
[model card](https://huggingface.co/meituan-longcat/LongCat-Video-Avatar-1.5)
for license terms and usage restrictions. The scripts in this repository are
setup glue only.
