import os
from typing import Dict, Any, List

import requests

VESPA_INDEX_URL = "https://openscholar-vespa.semanticscholar.org/search/"
VESPA_INDEX_TOKEN = os.getenv("VESPA_INDEX_TOKEN")
timeout = 60
ranking_profile = "rank-by-bm25-gist-sparseembed-linear"
yql_target_hits = 10000
gist_key, gist_val = "input.query(qg)", "embed(gist, @query)"
sparseembed_key, sparseembed_val = "input.query(qse)", "embed(sparseembed, @query)"

CONTRIEVER_RETRIEVAL_API = "http://tricycle.cs.washington.edu:5001/search"


def vespa_snippet_from_dict(
        child_dict: dict
) -> Dict[str, Any]:
    fields = child_dict["fields"]
    res_map = dict()
    res_map["vespa_doc_id"] = child_dict["id"]
    res_map["corpus_id"] = fields["paper_corpus_id"]
    res_map["text"] = fields["text"]
    res_map["score"] = child_dict["relevance"]
    return res_map


def retrieve_s2_index(query: str, topk: int) -> Dict[str, list]:
    """
    Retrieve topk papers from the S2 index using a query string.
    """
    payload = {
        "yql": f"select * from snippet where (({{targetHits:{yql_target_hits}}}nearestNeighbor(text_gist,qg)) or ({{defaultIndex: \"text\"}}userInput(@query)))",
        "query": query,
        "ranking": ranking_profile,
        "hits": topk,
        gist_key: gist_val,
        sparseembed_key: sparseembed_val,
        'timeout': timeout
    }
    headers = {"Content-Type": "application/json", "Authorization": f"{VESPA_INDEX_TOKEN}"}
    print(payload)
    response = requests.post(VESPA_INDEX_URL, json=payload, headers=headers)
    if response.status_code != 200:
        print(response.status_code)
        raise Exception(f"Failed to retrieve papers from the S2 index. {response.text}")
    else:
        results = response.json()
        unsorted_snippets = []
        if "children" in results["root"]:
            children = results["root"]["children"]
            for child in children:
                unsorted_snippets.append(
                    vespa_snippet_from_dict(
                        child_dict=child
                    )
                )

        sorted_snippets = sorted(
            unsorted_snippets, key=lambda s: s["score"], reverse=True
        )
        formatted_result = {"pes2o IDs": [], "passages": [], "scores": []}
        for snippet in sorted_snippets:
            formatted_result["pes2o IDs"].append(snippet["corpus_id"])
            formatted_result["passages"].append(snippet["text"])
            formatted_result["scores"].append(snippet["score"])
        return formatted_result


def retrieve_contriever(query: str, topk: int) -> Dict[str, List]:
    json_data = {"query": query, "n_docs": topk, "domains": "pes2o"}
    headers = {"Content-Type": "application/json"}
    response = requests.post(CONTRIEVER_RETRIEVAL_API, json=json_data, headers=headers)
    if response.status_code != 200:
        print(f"Error in retrieving snippets from url: {CONTRIEVER_RETRIEVAL_API}")
        raise Exception(
            f"Failed to retrieve snippets. Status code: {response.status_code}"
        )
    else:
        res_contents = response.json()
        return res_contents["results"]
