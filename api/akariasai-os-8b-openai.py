# ## Set up the container image

# Our first order of business is to define the environment our server will run in:
# the [container `Image`](https://modal.com/docs/guide/custom-container).
# vLLM can be installed with `pip`.

import modal
import os
from vllm.entrypoints.chat_utils import ChatTemplateContentFormatOption

# ## Download the model weights

MODEL_NAME = "akariasai/os_8b"
MODELS_DIR = f"/root/models/{MODEL_NAME}"

# We need to make the weights of that model available to our Modal Functions.

def download_model_to_image(model_dir, model_name):
    from huggingface_hub import snapshot_download
    from transformers.utils import move_cache

    os.makedirs(model_dir, exist_ok=True)

    snapshot_download(
        model_name,
        local_dir=model_dir,
    )
    move_cache()

# ## Build a vLLM engine and serve it

app = modal.App("akariasai-os-8b-openai-update")

N_GPU = 1  # tip: for best results, first upgrade to more powerful GPUs, and only then increase GPU count
TOKEN = "super-secret-token"  # auth token. for production use, replace with a modal.Secret

MINUTES = 60  # seconds
HOURS = 60 * MINUTES

vllm_image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "transformers==4.46.2",
        "huggingface_hub==0.23.4",
        "vllm==0.6.5",
        "fastapi[standard]==0.115.4",
        force_build=True,
    )
    .run_function(
        download_model_to_image,
        timeout=20 * MINUTES,
        kwargs={
            "model_dir": MODELS_DIR,
            "model_name": MODEL_NAME,
        },
    )
)


@app.function(
    image=vllm_image,
    gpu=f"A100-80GB:{N_GPU}",
    scaledown_window=5 * MINUTES,
    timeout=24 * HOURS,
    min_containers=1,
    max_containers=1,
    secrets=[modal.Secret.from_name("playground-web-auth-tokens")],
)
@modal.concurrent(max_inputs=1000)
@modal.asgi_app()
def serve():
    import fastapi
    import vllm.entrypoints.openai.api_server as api_server
    from vllm.engine.arg_utils import AsyncEngineArgs
    from vllm.engine.async_llm_engine import AsyncLLMEngine
    from vllm.entrypoints.logger import RequestLogger
    from vllm.entrypoints.openai.serving_chat import OpenAIServingChat
    from vllm.entrypoints.openai.serving_completion import (
        OpenAIServingCompletion,
    )
    from vllm.entrypoints.openai.serving_engine import BaseModelPath
    from vllm.usage.usage_lib import UsageContext

    # create a fastAPI app that uses vLLM's OpenAI-compatible router
    web_app = fastapi.FastAPI(
        title=f"OpenAI-compatible {MODEL_NAME} server",
        description="Run an OpenAI-compatible LLM server with vLLM on modal.com 🚀",
        version="0.0.1",
        docs_url="/docs",
    )

    # security: CORS middleware for external requests
    http_bearer = fastapi.security.HTTPBearer(
        scheme_name="Bearer Token",
        description="See code for authentication details.",
    )
    web_app.add_middleware(
        fastapi.middleware.cors.CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # security: inject dependency on authed routes
    valid_tokens = list(map(str.strip, os.environ["WEB_AUTH_TOKENS"].split(',')))
    async def is_authenticated(api_key: str = fastapi.Security(http_bearer)):
        if api_key.credentials not in valid_tokens:
            raise fastapi.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return {"username": "authenticated_user"}

    router = fastapi.APIRouter(dependencies=[fastapi.Depends(is_authenticated)])

    # wrap vllm's router in auth router
    router.include_router(api_server.router)
    # add authed vllm to our fastAPI app
    web_app.include_router(router)

    engine_args = AsyncEngineArgs(
        model=MODELS_DIR,
        tensor_parallel_size=N_GPU,
        gpu_memory_utilization=0.90,
        max_model_len=8096,
        enforce_eager=False,  # capture the graph for faster inference, but slower cold starts (30s > 20s)
    )

    engine = AsyncLLMEngine.from_engine_args(
        engine_args, usage_context=UsageContext.OPENAI_API_SERVER
    )

    model_config = get_model_config(engine)

    request_logger = RequestLogger(max_log_len=2048)

    base_model_paths = [
        BaseModelPath(name=MODEL_NAME.split("/")[1], model_path=MODEL_NAME)
    ]

    api_server.chat = lambda s: OpenAIServingChat(
        engine,
        model_config=model_config,
        base_model_paths=base_model_paths,
        chat_template=None,
        response_role="assistant",
        lora_modules=[],
        prompt_adapters=[],
        request_logger=request_logger,
        chat_template_content_format="auto"
    )
    api_server.completion = lambda s: OpenAIServingCompletion(
        engine,
        model_config=model_config,
        base_model_paths=base_model_paths,
        lora_modules=[],
        prompt_adapters=[],
        request_logger=request_logger,
    )

    return web_app


def get_model_config(engine):
    import asyncio

    try:  # adapted from vLLM source -- https://github.com/vllm-project/vllm/blob/507ef787d85dec24490069ffceacbd6b161f4f72/vllm/entrypoints/openai/api_server.py#L235C1-L247C1
        event_loop = asyncio.get_running_loop()
    except RuntimeError:
        event_loop = None

    if event_loop is not None and event_loop.is_running():
        # If the current is instanced by Ray Serve,
        # there is already a running event loop
        model_config = event_loop.run_until_complete(engine.get_model_config())
    else:
        # When using single vLLM without engine_use_ray
        model_config = asyncio.run(engine.get_model_config())

    return model_config