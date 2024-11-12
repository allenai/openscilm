import os
from typing import Dict, Any, List

import requests
from tool.use_search_apis import get_paper_data

VESPA_INDEX_URL = "https://openscholar-vespa.semanticscholar.org/search_pub/"
VESPA_INDEX_TOKEN = os.getenv("VESPA_INDEX_TOKEN")
timeout = 60
ranking_profile = "rank-by-bm25-denseembed-linear"
yql_target_hits = 10000
denseembed_key, denseembed_val = "input.query(qde)", "embed(denseembed, @query_with_prefix)"
sparseembed_key, sparseembed_val = "input.query(qse)", "embed(sparseembed, @query)"

CONTRIEVER_RETRIEVAL_API = "http://tricycle.cs.washington.edu:5001/search"

S2UB_S2HOWABLE_API = "https://s2ub.prod.s2.allenai.org/service/s2howable/v1/show"
S2HOWABLE_S2UB_TOKEN = os.getenv("S2HOWABLE_S2UB_TOKEN")


def fetch_s2howable_flag(corpus_id: int) -> bool:
    headers = {"Authorization": f"Bearer {S2HOWABLE_S2UB_TOKEN}"}
    try:
        url = f"{S2UB_S2HOWABLE_API}/{corpus_id}"
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            return res.json()["s2howable"]
        else:
            print(f"Received status code {res.status_code} from s2ub for corpus_id: {corpus_id}")
            raise Exception(f"Failed to fetch s2howable flag for corpus_id: {corpus_id}")
    except Exception as e:
        print(f"Exception while calling s2ub: {e}")
        return False


def get_paper_titles(corpus_ids: List[int]):
    paper_titles = {}
    paper_data = {
        pes2o_id: get_paper_data(pes2o_id) for pes2o_id in corpus_ids
    }
    for paper_id in paper_data:
        if "title" in paper_data[paper_id]:
            paper_titles[paper_id] = paper_data[paper_id]["title"]
    return paper_titles


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


def retrieve_s2_index(query: str, topk: int) -> List[Dict[str, Any]]:
    """
    Retrieve topk papers from the S2 index using a query string.
    """
    payload = {
        "yql": f"select * from snippet where (({{targetHits:{yql_target_hits}}}nearestNeighbor(text_denseembed_quantized,qde)) or ({{defaultIndex: \"text\"}}userInput(@query_no_prefix)))",
        "query_no_prefix": query,
        "ranking": ranking_profile,
        "hits": topk,
        "queryProfile": "query-prefix",
        denseembed_key: denseembed_val,
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
        paper_titles = get_paper_titles([snippet["corpus_id"] for snippet in sorted_snippets])
        for snippet in sorted_snippets:
            snippet["title"] = paper_titles[snippet["corpus_id"]] if snippet["corpus_id"] in paper_titles else ""
        return sorted_snippets


def retrieve_contriever(query: str, topk: int) -> List[Dict[str, Any]]:
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
        results = res_contents["results"]
        paper_titles = get_paper_titles([pid for pid in results["pes2o IDs"]])
        results["titles"] = [paper_titles[pid] if pid in paper_titles else "" for pid in results["pes2o IDs"]]
        snippets_list = [
            {
                "corpus_id": cid,
                "text": snippet,
                "score": score,
                "title": title
            }
            for cid, snippet, score, title in zip(
                results["pes2o IDs"],
                results["passages"],
                results["scores"],
                results["titles"],
            )
        ]
        return snippets_list
