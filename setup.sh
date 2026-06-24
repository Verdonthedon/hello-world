#!/usr/bin/env bash
#
# setup.sh — One-shot setup for LongCat-Video-Avatar 1.5
#
# Clones the official LongCat-Video repo, creates an isolated conda
# environment, installs all dependencies (PyTorch + CUDA, FlashAttention,
# avatar requirements) and downloads the required model weights.
#
# Usage:
#   ./setup.sh                 # full setup (env + code + weights)
#   ./setup.sh --skip-weights  # set up env/code but don't download weights
#   ./setup.sh --skip-env      # skip conda env creation (use current env)
#
# Override defaults via environment variables, e.g.:
#   ENV_NAME=mycat CUDA=cu121 ./setup.sh
#
set -euo pipefail

# --------------------------------------------------------------------------
# Configuration (override via environment)
# --------------------------------------------------------------------------
ENV_NAME="${ENV_NAME:-longcat-video}"
PYTHON_VERSION="${PYTHON_VERSION:-3.10}"
CUDA="${CUDA:-cu124}"                       # cu124 | cu121 | cu118
TORCH_VERSION="${TORCH_VERSION:-2.6.0}"
TORCHVISION_VERSION="${TORCHVISION_VERSION:-0.21.0}"
TORCHAUDIO_VERSION="${TORCHAUDIO_VERSION:-2.6.0}"
FLASH_ATTN_VERSION="${FLASH_ATTN_VERSION:-2.7.4.post1}"

REPO_URL="${REPO_URL:-https://github.com/meituan-longcat/LongCat-Video}"
REPO_DIR="${REPO_DIR:-LongCat-Video}"
WEIGHTS_DIR="${WEIGHTS_DIR:-weights}"

SKIP_WEIGHTS=0
SKIP_ENV=0
for arg in "$@"; do
  case "$arg" in
    --skip-weights) SKIP_WEIGHTS=1 ;;
    --skip-env)     SKIP_ENV=1 ;;
    -h|--help)      grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

log()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

# --------------------------------------------------------------------------
# Prerequisite checks
# --------------------------------------------------------------------------
log "Checking prerequisites"
command -v git   >/dev/null 2>&1 || die "git is required but not found."
command -v conda >/dev/null 2>&1 || die "conda is required but not found. Install Miniconda/Anaconda first."

if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || true
else
  warn "nvidia-smi not found — a CUDA-capable GPU is required for inference."
fi

# --------------------------------------------------------------------------
# Clone the LongCat-Video repository
# --------------------------------------------------------------------------
if [ -d "$REPO_DIR/.git" ]; then
  log "Repository already present at $REPO_DIR — pulling latest"
  git -C "$REPO_DIR" pull --ff-only || warn "Could not fast-forward existing repo."
else
  log "Cloning $REPO_URL into $REPO_DIR"
  git clone --single-branch --branch main "$REPO_URL" "$REPO_DIR"
fi

# --------------------------------------------------------------------------
# Conda environment
# --------------------------------------------------------------------------
# shellcheck disable=SC1091
source "$(conda info --base)/etc/profile.d/conda.sh"

if [ "$SKIP_ENV" -eq 0 ]; then
  if conda env list | grep -qE "^\s*${ENV_NAME}\s"; then
    log "Conda env '$ENV_NAME' already exists — reusing it"
  else
    log "Creating conda env '$ENV_NAME' (python $PYTHON_VERSION)"
    conda create -y -n "$ENV_NAME" "python=$PYTHON_VERSION"
  fi
  conda activate "$ENV_NAME"
else
  log "Skipping env creation (using current environment: ${CONDA_DEFAULT_ENV:-base})"
fi

# --------------------------------------------------------------------------
# PyTorch + dependencies
# --------------------------------------------------------------------------
log "Installing PyTorch $TORCH_VERSION (+$CUDA)"
pip install \
  "torch==${TORCH_VERSION}+${CUDA}" \
  "torchvision==${TORCHVISION_VERSION}+${CUDA}" \
  "torchaudio==${TORCHAUDIO_VERSION}" \
  --index-url "https://download.pytorch.org/whl/${CUDA}"

log "Installing build tooling + FlashAttention $FLASH_ATTN_VERSION"
pip install ninja psutil packaging
pip install "flash_attn==${FLASH_ATTN_VERSION}" --no-build-isolation

log "Installing LongCat-Video requirements"
pip install -r "$REPO_DIR/requirements.txt"
if [ -f "$REPO_DIR/requirements_avatar.txt" ]; then
  pip install -r "$REPO_DIR/requirements_avatar.txt"
fi

log "Installing audio tooling (librosa, ffmpeg)"
conda install -y -c conda-forge librosa ffmpeg

# Extra deps used by helper scripts in this repo
if [ -f "requirements-extra.txt" ]; then
  pip install -r requirements-extra.txt
fi

# --------------------------------------------------------------------------
# Model weights
# --------------------------------------------------------------------------
if [ "$SKIP_WEIGHTS" -eq 0 ]; then
  log "Downloading model weights into $REPO_DIR/$WEIGHTS_DIR"
  pip install "huggingface_hub[cli]"
  mkdir -p "$REPO_DIR/$WEIGHTS_DIR"
  # Base video model (required by the avatar model)
  huggingface-cli download meituan-longcat/LongCat-Video \
    --local-dir "$REPO_DIR/$WEIGHTS_DIR/LongCat-Video"
  # Avatar 1.5 weights
  huggingface-cli download meituan-longcat/LongCat-Video-Avatar-1.5 \
    --local-dir "$REPO_DIR/$WEIGHTS_DIR/LongCat-Video-Avatar-1.5"
else
  warn "Skipping weight download (--skip-weights). Run later with:"
  warn "  huggingface-cli download meituan-longcat/LongCat-Video --local-dir $REPO_DIR/$WEIGHTS_DIR/LongCat-Video"
  warn "  huggingface-cli download meituan-longcat/LongCat-Video-Avatar-1.5 --local-dir $REPO_DIR/$WEIGHTS_DIR/LongCat-Video-Avatar-1.5"
fi

log "Setup complete."
log "Next: edit config/avatar.env and run  ./run_avatar.sh  to generate a talking-head video."
