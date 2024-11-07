from typing import Dict, Any, Optional, Tuple, Union, List

import modal
import os


class ModalEngine:
    modal_client: modal.Client

    def __init__(self, model_id: str, api_name: str, gen_options: Dict[str, Any] = None) -> None:
        # Skiff secrets
        modal_token = os.getenv("MODAL_TOKEN")
        modal_token_secret = os.getenv("MODAL_TOKEN_SECRET")
        self.modal_client = modal.Client.from_credentials(modal_token, modal_token_secret)
        self.model_id = model_id
        self.gen_options = {"max_tokens": 1024, "temperature": 0.7, "logprobs": 2,
                            "stop_token_ids": [128009]} if gen_options is None else gen_options
        self.api_name = api_name

    def fn_lookup(
            self,
            **opt_kwargs,
    ) -> Tuple[modal.Function, Optional[Dict[str, Any]]]:
        if opt_kwargs:
            opts = {**self.gen_options, **opt_kwargs} if self.gen_options else {**opt_kwargs}
        else:
            opts = self.gen_options

        fn = modal.Function.lookup(self.model_id, self.api_name, client=self.modal_client)
        return fn, opts if opts else None

    def generate(self, input_args: Tuple, streaming=False, **opt_kwargs) -> Union[str, List[Dict]]:
        gen_fn, opts = self.fn_lookup(**opt_kwargs)
        if streaming:
            outputs = []
            if opts:
                for chunk in gen_fn.remote_gen(*input_args, opts):
                    outputs.append(chunk)
            else:
                for chunk in gen_fn.remote_gen(*input_args):
                    outputs.append(chunk)
            return "".join(outputs) if outputs and type(outputs[0]) == str else outputs
        else:
            return gen_fn.remote(*input_args, **opts) if opts else gen_fn.remote(*input_args)
