from typing import Dict, Any

import jsonlines
import os
import requests
from fastapi import HTTPException

S2_APIKEY = os.getenv('S2_PARTNER_API_KEY', '')
S2_HEADERS = {'x-api-key': S2_APIKEY}
S2_API_BASE_URL = 'https://api.semanticscholar.org/graph/v1/'


def load_jsonlines(file):
    with jsonlines.open(file, "r") as jsonl_f:
        lst = [obj for obj in jsonl_f]
    return lst


def save_file_jsonl(data, fp):
    with jsonlines.open(fp, mode="w") as writer:
        writer.write_all(data)


def query_s2_api(end_pt: str = "paper/batch", params: Dict[str, Any] = None, payload: Dict[str, Any] = None, method="get"):
    url = S2_API_BASE_URL + end_pt
    req_method = requests.get if method == "get" else requests.post
    response = req_method(url, headers=S2_HEADERS, params=params, json=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"S2 API request failed with status code {response.status_code}")
    return response.json()
