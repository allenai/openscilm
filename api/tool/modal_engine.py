import modal
import os


def create_prompt_with_llama3_format(prompt,
                                     system_message="You are a helpful AI assistant for scientific literature review. Please carefully follow user's instruction and help them to understand the most recent papers."):
    if system_message is not None:
        formatted_text = "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{0}<|eot_id|>".format(
            system_message)
    else:
        formatted_text = "<|begin_of_text|>"
    formatted_text += "<|start_header_id|>user<|end_header_id|>\n\n" + prompt + "<|eot_id|>"
    formatted_text += "<|start_header_id|>assistant<|end_header_id|>\n\n"
    return formatted_text


class ModalEngine:
    client: modal.Client

    def __init__(self) -> None:
        # Skiff secrets
        modal_token = os.getenv("MODAL_TOKEN")
        modal_token_secret = os.getenv("MODAL_TOKEN_SECRET")
        self.modal_client = modal.Client.from_credentials(modal_token, modal_token_secret)

    def generate(
            self,
            model: str,
            query: str,
            **opts,
    ):
        msgs = {"messages": [{"role": "user", "content": create_prompt_with_llama3_format(query)}]}
        f = modal.Function.lookup(model, "vllm_api", client=self.client)
        content = ""
        for chunk in f.remote_gen(msgs, opts):
            content += (
                chunk["result"]["output"]["text"]
                if "result" in chunk and "output" in chunk["result"] and "text" in chunk["result"]["output"]
                else ""
            )

        return content
