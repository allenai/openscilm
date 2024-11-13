import os
import re
from typing import Any, Dict
import logging

import jsonlines
import requests
from fastapi import HTTPException
from google.cloud import storage

S2_APIKEY = os.getenv("S2_PARTNER_API_KEY", "")
S2_HEADERS = {"x-api-key": S2_APIKEY}
S2_API_BASE_URL = "https://api.semanticscholar.org/graph/v1/"


def load_jsonlines(file):
    with jsonlines.open(file, "r") as jsonl_f:
        lst = [obj for obj in jsonl_f]
    return lst


def save_file_jsonl(data, fp):
    with jsonlines.open(fp, mode="w") as writer:
        writer.write_all(data)


def query_s2_api(
    end_pt: str = "paper/batch",
    params: Dict[str, Any] = None,
    payload: Dict[str, Any] = None,
    method="get",
):
    url = S2_API_BASE_URL + end_pt
    req_method = requests.get if method == "get" else requests.post
    response = req_method(url, headers=S2_HEADERS, params=params, json=payload)
    if response.status_code != 200:
        logging.exception(f"S2 API request to end point {end_pt} failed with status code {response.status_code}")
        raise HTTPException(
            status_code=500,
            detail=f"S2 API request failed with status code {response.status_code}",
        )
    return response.json()


def remove_citations(text):
    # Regular expression to match [number] or [number_1, number_2, number_3]
    citation_pattern = r"\[\d+(?:,\s*\d+)*\]"
    # Remove all citations from the text
    cleaned_text = re.sub(citation_pattern, "", text)
    # Optionally, remove extra spaces that might result from removing citations
    cleaned_text = re.sub(r"\s{2,}", " ", cleaned_text).strip()
    cleaned_text = cleaned_text.replace(" .", ".")
    cleaned_text = cleaned_text.replace(" ,", ",")
    return cleaned_text


def extract_citations(text):
    print(text)
    # Regular expression to match [number] or [number_1, number_2, number_3]
    citation_pattern = r"\[(\d+(?:,\s*\d+)*)\]"
    # Find all matches in the text
    matches = re.findall(citation_pattern, text)
    # Extract individual numbers and convert them to integers
    citations = []
    for match in matches:
        # Split by commas, strip any extra whitespace, and convert to integers
        citations.extend([int(num.strip()) for num in match.split(",")])
    return citations


def push_to_gcs(text: str, bucket: str, file_path: str):
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket)
        blob = bucket.blob(file_path)
        blob.upload_from_string(text)
        logging.info(f"Pushed event trace: {file_path} to GCS")
    except Exception as e:
        logging.info(f"Error pushing {file_path} to GCS: {e}")