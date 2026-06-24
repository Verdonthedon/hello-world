#!/usr/bin/env bash
#
# run_avatar.sh — generate an audio-driven talking-head video with
# LongCat-Video-Avatar 1.5.
#
# Reads defaults from config/avatar.env; any variable there can be
# overridden inline, e.g.:
#   RESOLUTION=480P AUDIO_CFG=5 ./run_avatar.sh
#   INPUT_JSON=assets/avatar/my_clip.json ./run_avatar.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CONFIG_FILE:-$SCRIPT_DIR/config/avatar.env}"

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

[ -f "$CONFIG_FILE" ] || die "Config not found: $CONFIG_FILE (run ./setup.sh first)."
# Load config without clobbering values already set in the environment.
# shellcheck disable=SC1090
set -a; source "$CONFIG_FILE"; set +a

REPO_DIR="${REPO_DIR:-LongCat-Video}"
[ -d "$REPO_DIR" ] || die "Repo dir '$REPO_DIR' missing. Run ./setup.sh first."

CKPT_ABS="$REPO_DIR/$CHECKPOINT_DIR"
[ -d "$CKPT_ABS" ] || die "Checkpoint dir '$CKPT_ABS' missing. Did weight download finish?"
[ -f "$REPO_DIR/$INPUT_JSON" ] || die "Input JSON '$REPO_DIR/$INPUT_JSON' not found."

# Assemble optional flags.
EXTRA_FLAGS=()
[ "${USE_DISTILL:-0}" = "1" ] && EXTRA_FLAGS+=(--use_distill)
[ "${USE_INT8:-0}" = "1" ]    && EXTRA_FLAGS+=(--use_int8)

log "Generating avatar video"
log "  repo:        $REPO_DIR"
log "  checkpoint:  $CHECKPOINT_DIR"
log "  input:       $INPUT_JSON"
log "  resolution:  $RESOLUTION   audio_cfg: $AUDIO_CFG   gpus: $NUM_GPUS"

cd "$REPO_DIR"
torchrun --nproc_per_node="$NUM_GPUS" \
  run_demo_avatar_single_audio_to_video.py \
  --context_parallel_size="$NUM_GPUS" \
  --checkpoint_dir="$CHECKPOINT_DIR" \
  --stage_1="$STAGE_1" \
  --input_json="$INPUT_JSON" \
  --model_type "$MODEL_TYPE" \
  --resolution "$RESOLUTION" \
  --audio_cfg "$AUDIO_CFG" \
  --ref_img_index "$REF_IMG_INDEX" \
  --mask_frame_range "$MASK_FRAME_RANGE" \
  --seed "$SEED" \
  "${EXTRA_FLAGS[@]}"

log "Done. Check the LongCat-Video output directory for the rendered video."
