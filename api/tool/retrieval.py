import os
from typing import Dict, Any, List

import requests
from tool.use_search_apis import get_paper_data
import csv
import logging

logger = logging.getLogger(__name__)

VESPA_BASE_URL = "https://openscholar-vespa.semanticscholar.org/"
VESPA_INDEX_TOKEN = os.getenv("VESPA_INDEX_TOKEN")


class VespaIndex:
    def __init__(self, end_pt: str, query_id: str, ranking_profile: str, nn_arg: str, embed_dict: Dict[str, str],
                 yql_target_hits=10000, timeout=60, corpus_id_filter_file: str = None, hit_mult_factor: float = 1.0):
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
        self.hit_mul_factor = hit_mult_factor

    def get_yql_query(self, query: str, topk: int) -> Dict[str, Any]:
        topk = round(topk * self.hit_mul_factor)
        payload = {
            "yql": f"select * from snippet where (({{targetHits:{self.yql_target_hits}}}nearestNeighbor({self.nn_arg})) or ({{defaultIndex: \"text\"}}userInput(@{self.query_id})))",
            self.query_id: query,
            "ranking": self.ranking_profile,
            "hits": topk,
            **self.embed_dict,
            'timeout': self.timeout
        }
        return payload

    def retrieve_s2_index(self, query: str, topk: int, filter_open_access=True) -> List[Dict[str, Any]]:
        """
        Retrieve topk papers from the S2 index using a query string.
        """
        payload = self.get_yql_query(query, topk)
        headers = {"Content-Type": "application/json", "Authorization": f"{VESPA_INDEX_TOKEN}"}
        logger.info(payload)
        response = requests.post(self.index_url, json=payload, headers=headers)
        if response.status_code != 200:
            logger.info(response.status_code)
            msg = f"Failed to retrieve papers from the S2 index. {response.text}"
            logger.exception(msg)
            raise Exception(msg)
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
            if filter_open_access and self.corpus_id_filter:
                logger.info(f"{len(unsorted_snippets)} retrieved from the index initially")
                unsorted_snippets = [snippet for snippet in unsorted_snippets if
                                     snippet["corpus_id"] in self.corpus_id_filter]
                logger.info(f"{len(unsorted_snippets)} retained after filtering for open access")

            sorted_snippets = sorted(
                unsorted_snippets, key=lambda s: s["score"], reverse=True
            )[:topk]
            paper_titles = get_paper_titles([snippet["corpus_id"] for snippet in sorted_snippets])
            for snippet in sorted_snippets:
                snippet["title"] = paper_titles[snippet["corpus_id"]] if snippet["corpus_id"] in paper_titles else ""
            return sorted_snippets


def get_vespa_index(version="v1"):
    logger.info(f"Loading vespa index version: {version}")
    if version == "v1":
        return VespaIndex(
            end_pt="search",
            query_id="query",
            ranking_profile="rank-by-bm25-gist-sparseembed-linear",
            nn_arg="text_gist,qg",
            embed_dict={
                "input.query(qg)": "embed(gist, @query)",
                "input.query(qse)": "embed(sparseembed, @query)"
            },
            corpus_id_filter_file=f'{os.getenv("OPEN_ACCESS_FILE", "./open_access/oa_corpus_ids.csv")}',
            hit_mult_factor=1.5
        )
    else:
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
            logger.exception(f"Received status code {res.status_code} from s2ub for corpus_id: {corpus_id}")
            raise Exception(f"Failed to fetch s2howable flag for corpus_id: {corpus_id}")
    except Exception as e:
        logger.exception(f"Exception while calling s2ub: {e}")
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


def retrieve_contriever(query: str, topk: int) -> List[Dict[str, Any]]:
    json_data = {"query": query, "n_docs": topk, "domains": "pes2o"}
    headers = {"Content-Type": "application/json"}
    response = requests.post(CONTRIEVER_RETRIEVAL_API, json=json_data, headers=headers)
    if response.status_code != 200:
        logger.exception(f"Error in retrieving snippets from url: {CONTRIEVER_RETRIEVAL_API}")
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
