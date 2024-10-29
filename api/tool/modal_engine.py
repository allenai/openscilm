import modal
import os


def create_prompt_with_llama3_format(prompt,
                                     system_message="You are a helpful AI assistant for scientific literature review. Please carefully follow user's instruction and help them to understand the most recent papers."):
    return [{"role": "user", "content": system_message}, {"role": "user", "content": prompt},
            {"role": "assistant", "content": ""}]
    # if system_message is not None:
    #     formatted_text = "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{0}<|eot_id|>".format(
    #         system_message)
    # else:
    #     formatted_text = "<|begin_of_text|>"
    # formatted_text += "<|start_header_id|>user<|end_header_id|>\n\n" + prompt + "<|eot_id|>"
    # formatted_text += "<|start_header_id|>assistant<|end_header_id|>\n\n"
    # return formatted_text


class ModalEngine:
    modal_client: modal.Client

    def __init__(self, model_id: str = "akariasai-os-8b") -> None:
        # Skiff secrets
        modal_token = os.getenv("MODAL_TOKEN")
        modal_token_secret = os.getenv("MODAL_TOKEN_SECRET")
        self.modal_client = modal.Client.from_credentials(modal_token, modal_token_secret)
        self.model_id = model_id
        self.gen_options = {"max_tokens": 1024, "temperature": 0.7, "logprobs": 2, "stop_token_ids": [128009]}

    def generate(
            self,
            ip_msgs: str,
            **opt_kwargs
    ):
        # msgs = [{"role": "user", "content": create_prompt_with_llama3_format(ip_msgs)}]
        msgs = create_prompt_with_llama3_format(ip_msgs)
        opts = {**self.gen_options, **opt_kwargs}
        f = modal.Function.lookup(self.model_id, "vllm_api", client=self.modal_client)

        try:
            for chunk in f.remote_gen(msgs, opts):
                yield(
                    chunk["result"]["output"]["text"]
                    if "result" in chunk and "output" in chunk["result"] and "text" in chunk["result"]["output"]
                    else ""
                )

        except Exception as e:
            print(e)
