import os
from typing import Dict, Any, List, Set

import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import logging
from tool.utils import query_s2_api
from time import time

logger = logging.getLogger(__name__)

VESPA_BASE_URL = "https://openscholar-vespa.semanticscholar.org/"
VESPA_INDEX_TOKEN = os.getenv("VESPA_INDEX_TOKEN")


class VespaIndex:
    def __init__(self, end_pt: str, query_id: str, ranking_profile: str, nn_arg: str, embed_dict: Dict[str, str],
                 yql_target_hits=10000, timeout=60, corpus_id_filter_file: str = None, hit_mult_factor: float = 1.0,
                 check_showable=True):
        self.index_url = f"{VESPA_BASE_URL}/{end_pt}/"
        self.query_id = query_id
        self.nn_arg = nn_arg
        self.ranking_profile = ranking_profile
        self.embed_dict = embed_dict
        self.yql_target_hits = yql_target_hits
        self.timeout = timeout
        if corpus_id_filter_file:
            # read csv from corpus_id_filter_file and save it in a set next
            self.corpus_id_filter = set()
            logger.info("Loading open access corpus ids...")
            with open(corpus_id_filter_file, 'r') as f:
                reader = csv.reader(f)
                for idx, row in enumerate(reader):
                    if idx == 0:
                        continue
                    self.corpus_id_filter.add(row[0])
            logger.info(f"Loaded {len(self.corpus_id_filter)} open access corpus ids")
        else:
            self.corpus_id_filter = None
        self.check_showable = check_showable
        self.hit_mul_factor = hit_mult_factor


    def retrieve_s2_index(self, query: str, topk: int, filter_open_access=True) -> List[Dict[str, Any]]:
        """
        Retrieve topk papers from the S2 index using a query string.
        """
        payload = self.get_yql_query(query, topk)
        headers = {"Content-Type": "application/json", "Authorization": f"{VESPA_INDEX_TOKEN}"}
        logger.info(f"Vespa Snippet query:{payload}")
        response = requests.post(self.index_url, json=payload, headers=headers)
        results = response.json()
        unsorted_snippets = []
        if "children" in results["root"]:
            children = results["root"]["children"]
            for child in children:
                res = vespa_snippet_from_dict(
                        child_dict=child
                    )
                if res:
                    unsorted_snippets.append(
                        res
                    )
        sorted_snippets = sorted(
            unsorted_snippets, key=lambda s: s["score"], reverse=True
        )[:topk]
        logger.info("Trying to retrieve paper titles from vespa")
        paper_titles = self.get_paper_titles_vespa([snippet["corpus_id"] for snippet in sorted_snippets])
        for snippet in sorted_snippets:
            snippet["title"] = paper_titles[snippet["corpus_id"]] if snippet["corpus_id"] in paper_titles else ""
        return sorted_snippets

    def get_paper_titles_vespa(self, corpus_ids: List[str]):
        corpus_ids_param = ", ".join([f"{cid}" for cid in corpus_ids])
        payload = {
            "yql": "select paper_corpus_id,text from snippet where paper_corpus_id in (@paper_corpus_ids) and snippet_kind contains \"title\"",
            "ranking": "unranked", "hits": 400, "ranking.sorting": "+paper_corpus_id +snippet_idx",
            "offset": 0, "paper_corpus_ids": f"{corpus_ids_param}",
            "timeout": 60, "presentation.timing": True}
        logger.info(f"Vespa paper title query:{payload}")
        headers = {"Content-Type": "application/json", "Authorization": f"{VESPA_INDEX_TOKEN}"}
        response = requests.post(self.index_url, json=payload, headers=headers)
        if response.status_code != 200:
            logger.info(response.status_code)
            msg = f"Failed to retrieve papers from the S2 index. Received {response.status_code} from retrieval api."
            logger.warning(msg)
            logger.info("Trying to retrieve titles from s2 api now")
            return get_paper_titles(corpus_ids)
        else:
            results = response.json()
            paper_titles = {
                hit["fields"]["paper_corpus_id"]: hit["fields"]["text"]
                for hit in results["root"]["children"] if "paper_corpus_id" in hit["fields"]
            }
            return paper_titles


def get_vespa_index():
    return VespaIndex(
            end_pt="search_pub",
            query_id="query_no_prefix",
            ranking_profile="rank-by-bm25-denseembed-linear",
            nn_arg="text_denseembed_quantized,qde",
            embed_dict={
                "input.query(qde)": "embed(denseembed, @query_with_prefix)",
                "queryProfile": "query-prefix"
            }
        )

def vespa_snippet_from_dict(
        child_dict: dict
) -> Dict[str, Any]:
    fields = child_dict["fields"]
    res_map = dict()
    if "paper_corpus_id" in fields:
        res_map["vespa_doc_id"] = child_dict["id"]
        res_map["corpus_id"] = fields["paper_corpus_id"]
        res_map["text"] = fields["text"]
        res_map["score"] = child_dict["relevance"]
        res_map["type"] = fields["snippet_kind"]
    return res_map
