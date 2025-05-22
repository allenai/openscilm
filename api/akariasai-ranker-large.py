# ## Setup

import os
import time
import typing as t
from enum import Enum
import json
from threading import Thread
from typing import Generator, Optional
import os, dataclasses

import modal
from typing_extensions import List

MODEL_NAME = "akariasai/ranker_large"
MODEL_DIR = f"/root/models/{MODEL_NAME}"
GPU_CONFIG = modal.gpu.T4(count=1)

APP_NAME = "akariasai-ranker-large"
APP_LABEL = APP_NAME.lower()


# ## Define a container image
#
# We want to create a Modal image which has the model weights pre-saved to a directory. The benefit of this
# is that the container no longer has to re-download the model from Huggingface - instead, it will take
# advantage of Modal's internal filesystem for faster cold starts.
#
# ### Download the weights
#
# We can download the model to a particular directory using the HuggingFace utility function `snapshot_download`.
#
# If you adapt this example to run another model,
# note that for this step to work on a [gated model](https://huggingface.co/docs/hub/en/models-gated)
# the `HF_TOKEN` environment variable must be set and provided as a [Modal Secret](https://modal.com/secrets).
#
# This can take some time -- at least a few minutes.

def download_model_to_image(model_dir, model_name):
    from huggingface_hub import snapshot_download
    from transformers.utils import move_cache

    os.makedirs(model_dir, exist_ok=True)

    snapshot_download(
        model_name,
        token=os.environ["HF_TOKEN"],
        local_dir=model_dir,
    )
    move_cache()


# ### Image definition
#
# We’ll start from a basic Linux container image, install related libraries,
# and then use `run_function` to run the function defined above and ensure the weights of
# the model are saved within the container image.

reranker_image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "torch==2.3.1",
        "transformers==4.42.3",
        "sentencepiece==0.2.0",
        "hf-transfer==0.1.6",
        "huggingface_hub==0.23.4",
        "FlagEmbedding",
        "peft"
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_function(
        download_model_to_image,
        timeout=60 * 20,
        secrets=[modal.Secret.from_name("chrisn-wildguard-hf-gated-read")],
        kwargs={
            "model_dir": MODEL_DIR,
            "model_name": MODEL_NAME,
        },
    )
)

with reranker_image.imports():
    import torch
    from FlagEmbedding import FlagReranker

app = modal.App(APP_NAME)


# ## The model class
#
# The inference function is best represented with Modal's [class syntax](/docs/guide/lifecycle-functions) and the `@enter` decorator.
# This enables us to load the model into memory just once every time a container starts up, and keep it cached
# on the GPU for each subsequent invocation of the function.
#
@app.cls(
    gpu=GPU_CONFIG,
    timeout=60 * 10,
    container_idle_timeout=60 * 10,
    keep_warm=1,
    allow_concurrent_inputs=10,
    image=reranker_image,
)
class Model:
    @modal.enter()
    def start_engine(self):
        from FlagEmbedding import FlagReranker
        from transformers import AutoModelForCausalLM, AutoTokenizer
        print("🥶 cold starting inference")
        start = time.monotonic_ns()

        self.reranker = FlagReranker(MODEL_DIR, use_fp16=True)

        duration_s = (time.monotonic_ns() - start) / 1e9
        print(f"🏎️ engine started in {duration_s:.0f}s")

    @modal.method()
    def get_scores(self, query: str, passages: List[str]) -> List[float]:
        sentence_pairs = [(query, passage) for passage in passages]
        scores = self.reranker.compute_score(sentence_pairs, normalize=True, batch_size=32)
        return [float(s) for s in scores]


# ## Coupling a frontend web application
#
# We can stream inference from a FastAPI backend, also deployed on Modal.


from modal import Mount, asgi_app

api_image = (
    modal.Image.debian_slim(python_version="3.11")
)


@app.function(
    image=api_image,
    keep_warm=1,
    allow_concurrent_inputs=20,
    timeout=60 * 10,
)
async def inference_api(query: str, passages: List[str]):
    model = Model()
    return model.get_scores.remote(query, passages)

