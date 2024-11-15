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
        logger.info(f"Vespa Snippet query:{payload}")
        response = requests.post(self.index_url, json=payload, headers=headers)
        if response.status_code != 200:
            logger.info(response.status_code)
            msg = f"Failed to retrieve papers from the S2 index. Received {response.status_code} from retrieval api."
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
                logger.info(f"{len(unsorted_snippets)} passages retrieved from the index initially")
                unsorted_snippets = [snippet for snippet in unsorted_snippets if
                                     snippet["corpus_id"] in self.corpus_id_filter]
                logger.info(f"{len(unsorted_snippets)} passages retained after filtering for open access")

            if self.check_showable:
                s2howable_papers = fetch_s2howable_papers(set([snippet["corpus_id"] for snippet in unsorted_snippets]))
                unsorted_snippets = [snippet for snippet in unsorted_snippets if
                                     snippet["corpus_id"] in s2howable_papers]
                logger.info(f"{len(unsorted_snippets)} passages retained after filtering for s2howable")

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
                for hit in results["root"]["children"]
            }
            return paper_titles


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
            hit_mult_factor=1.0
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


def fetch_showable_flag(corpus_id: str):
    headers = {"Authorization": f"Bearer {S2HOWABLE_S2UB_TOKEN}"}
    try:
        url = f"{S2UB_S2HOWABLE_API}/{corpus_id}"
        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            return res.json()["s2howable"], corpus_id
        else:
            logger.exception(f"Received status code {res.status_code} from s2ub for corpus_id: {corpus_id}")
            raise Exception(f"Failed to fetch s2howable flag for corpus_id: {corpus_id}")
    except Exception as e:
        logger.exception(f"Exception while calling s2ub: {e}")
        return False, corpus_id


def fetch_s2howable_papers(corpus_ids: Set[str], num_works=12) -> Set[str]:
    logger.info(f"Checking s2howable flag for {len(corpus_ids)} papers")
    start = time()
    s2howable_papers = set()
    with ThreadPoolExecutor(max_workers=num_works) as executor:
        futures = {
            executor.submit(fetch_showable_flag, cid): cid
            for cid in corpus_ids
        }
        for future in as_completed(futures):
            iss2howable, corpus_id = future.result()
            if iss2howable:
                s2howable_papers.add(corpus_id)
    logger.info(f"{len(s2howable_papers)} papers retained after filtering for s2howable in {time() - start} secs")
    return s2howable_papers


def get_paper_titles(corpus_ids: List[str]):
    paper_data = query_s2_api(
        end_pt="paper/batch",
        params={
            "fields": "title,corpusId"
        },
        payload={"ids": ["CorpusId:{0}".format(cid) for cid in corpus_ids]},
        method="post",
    )
    paper_titles = {
        pdata["corpusId"]: pdata["title"] for pdata in paper_data if pdata and "title" in pdata and "corpusId" in pdata
    }
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
    res_map["type"] = fields["snippet_kind"]
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
