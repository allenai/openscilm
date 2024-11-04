import argparse
import csv
import json
import os
import random
import re
import time
from xml.etree import ElementTree as ET

import backoff
import jsonlines
import nltk
import numpy as np
import pandas as pd
import requests
from bs4 import BeautifulSoup
from fuzzy_match import algorithims
from googlesearch import search
from openai import OpenAI
from tool.utils import load_jsonlines, query_s2_api, save_file_jsonl
from tqdm import tqdm

YOUR_API_KEY = os.getenv("YOUR_API_KEY")

keyword_extraction_prompt = """
Suggest semantic scholar search APIs to retrieve relevant papers to answer the following question related to the most recent NLP research. The search queries must be short, and commma separated. Here's an example. I'll show one example and the test instance you should suggest the search queries. \n
##\n
Question: How have prior work incorporated personality attributes to train personalized dialogue generation models?\n
Search queries: personalized dialogue generation, personalized language models, personalized dialogue\n
##\n
Question: How do retrieval-augmented LMs perform well in knowledge-intensive tasks?\n
Search queries: retrieval-augmented LMs, knowledge-intensive tasks, large language models for knowledge-intensive tasks, retrieval-augmented generation
##\n
Question: {question}\n
Search queries:
"""


def check_paper_existance(title):
    query_params = {"query": title, "limit": 5}
    # Send the API request
    try:
        response_data = query_s2_api("paper/search", params=query_params)
    except:
        response_data = []
    if len(response_data) == 0 or "data" not in response_data:
        return None
    else:
        fuzzy_math_scores = [
            paper
            for paper in response_data["data"]
            if algorithims.trigram(title.lower(), paper["title"].lower()) > 0.95
        ]
        if len(fuzzy_math_scores) == 0:
            return None
        else:
            return fuzzy_math_scores[0]["paperId"]


def is_integer_string(s):
    return s.isdigit()


def get_paper_data(paper_id):
    if is_integer_string(paper_id) is False:
        url = "paper/" + paper_id
    else:
        url = "paper/CorpusId:" + paper_id
    # Define which details about the paper you would like to receive in the response
    paper_data_query_params = {
        "fields": "title,year,abstract,url,authors.name,citationCount,year,openAccessPdf"
    }
    # Send the API request and store the response in a variable
    try:
        response = query_s2_api(end_pt=url, params=paper_data_query_params)
        # time.sleep(0.1)
        return response.json()
    except Exception as e:
        print(f"failed semantic scholar meta data retrieval for paperid: {paper_id}", e)
        return None


def call_api(
        input_query,
        client,
        model_name="meta-llama/Llama-3-70b-chat-hf",
        max_tokens=1500,
):
    chat_completion = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": input_query},
        ],
        temperature=0.1,
        max_tokens=max_tokens,
    )
    return chat_completion.choices[0].message.content


def get_citations(paper_id):
    paper_data = get_paper_data(paper_id)
    if paper_data is None:
        return 0
    else:
        return paper_data["citationCount"]


def search_paper_via_query(query, max_paper_num=10):
    if "Search queries: " in query:
        query = query.split("Search queries: ")[1]
    query_params = {
        "query": query,
        "limit": max_paper_num,
        "minCitationCount": 10,
        "sort": "citationCount:desc",
        "fields": "title,year,abstract,authors.name,citationCount,year,url,externalIds",
    }
    # try:
    response_data = query_s2_api("paper/search", params=query_params)
    time.sleep(0.5)
    # Check response status
    if response_data is None or len(response_data) == 0 or "data" not in response_data:
        print("retrieval failed")
        return None
    else:
        return response_data["data"]


def search_paper_via_title(title):
    query_params = {
        "query": title,
        "fields": "title,year,abstract,authors.name,citationCount,year,url,externalIds,corpusId",
    }
    try:
        response_data = query_s2_api("paper/search/match", params=query_params)
        time.sleep(0.2)
        # Check response status
    except:
        response_data = None
    if response_data is None or len(response_data) == 0 or "data" not in response_data:
        return None
    else:
        return response_data["data"][0]


def retrieve_keywords(question, client, model_name):
    keywords = call_api(
        keyword_extraction_prompt.format_map({"question": question}),
        client,
        model_name=model_name,
    )
    if (
            "Search queries:" in keywords
            and len(keywords.split("\n\nSearch queries: ")) > 1
    ):
        keywords = keywords.split("\n\nSearch queries: ")[1]
    queries = keywords.split(", ")[:5]
    queries = [
        query.replace("Search queries: ", "") for query in queries if len(query) > 0
    ]
    return queries


def search_semantic_scholar(question, client, model_name):
    new_keywords = retrieve_keywords(question, client, model_name=model_name)
    paper_list = {}
    for keyword in new_keywords:
        top_papers = search_paper_via_query(keyword)
        if top_papers is None:
            return [], []
        for paper in top_papers:
            if paper["paperId"] not in paper_list:
                paper["text"] = paper["abstract"]
                paper["citation_counts"] = paper["citationCount"]
                paper_list[paper["paperId"]] = paper

    final_paper_list = []
    for paper_id in paper_list:
        final_paper_list.append(
            {
                "semantic_scholar_id": paper_id,
                "type": "ss_abstract",
                "year": paper_list[paper_id]["title"],
                "authors": paper_list[paper_id]["authors"],
                "title": paper_list[paper_id]["title"],
                "text": paper_list[paper_id]["text"],
                "url": paper_list[paper_id]["url"],
                "citation_counts": paper_list[paper_id]["citationCount"],
                "abstract": paper_list[paper_id]["abstract"],
            }
        )
        if (
                paper_list[paper_id]["externalIds"] is not None
                and "ArXiv" in paper_list[paper_id]["externalIds"]
        ):
            passages = retrieve_passages_single_paper(
                paper_list[paper_id]["externalIds"]["ArXiv"]
            )
            for p in passages:
                final_paper_list.append(
                    {
                        "semantic_scholar_id": paper_id,
                        "type": "ss_abstract",
                        "year": paper_list[paper_id]["title"],
                        "authors": paper_list[paper_id]["authors"],
                        "title": paper_list[paper_id]["title"],
                        "text": p,
                        "url": paper_list[paper_id]["url"],
                        "citation_counts": paper_list[paper_id]["citationCount"],
                        "abstract": paper_list[paper_id]["abstract"],
                    }
                )
    return final_paper_list, new_keywords


def batch_paper_data(arxiv_ids):
    response_data = query_s2_api(
        end_pt="paper/batch",
        params={
            "fields": "referenceCount,citationCount,title,url,publicationDate,abstract"
        },
        payload={"ids": ["ARXIV:{0}".format(id) for id in arxiv_ids]},
        method="post",
    )
    time.sleep(1)
    return {id: data for id, data in zip(arxiv_ids, response_data)}


def batch_paper_data_pubmed(pubmed_ids):
    response_data = query_s2_api(
        end_pt="paper/batch",
        params={
            "fields": "referenceCount,citationCount,title,url,publicationDate,abstract"
        },
        payload={"ids": ["PMID:{0}".format(id) for id in pubmed_ids]},
        method="post",
    )

    time.sleep(0.1)
    return {id: data for id, data in zip(pubmed_ids, response_data)}


def batch_paper_data_SS_ID(paper_ids):
    response_data = query_s2_api(
        end_pt="paper/batch",
        params={
            "fields": "referenceCount,citationCount,title,url,publicationDate,abstract,year,authors.name"
        },
        payload={"ids": ["CorpusId:{0}".format(id) for id in paper_ids]},
        method="post",
    )
    time.sleep(0.1)
    return {id: data for id, data in zip(paper_ids, response_data)}


def parsing_paragraph(link):
    response = requests.get(link, verify=False)
    time.sleep(0.1)
    html = response.text
    # Parse the HTML content
    soup = BeautifulSoup(html, "html.parser")
    # Find all sections with an id attribute that contains the letter "S"
    raw_abstract = soup.find_all("div", "ltx_abstract")
    try:
        abstract = "".join(raw_abstract[0].text.split("\n")[2:])
    except:
        abstract = ""
    sections = soup.find_all("section", attrs={"id": re.compile(r"^S\d+$")})
    subsections = soup.find_all(class_="ltx_para", id=re.compile(r"^S\d+\.+(p|S)"))
    # Count the number of sections
    count = len(subsections)
    paragraphs = []
    section_names = []
    for i in range(count):
        paragraphs.append(re.sub(r"\n", "", subsections[i].text))
    return paragraphs


def retrieve_passages(arxiv_ids):
    ar5iv_links = []
    print("retrieved arxive papers: for {}".format(arxiv_ids))
    for arxiv_id in arxiv_ids:
        ar5iv_links.append(f"https://ar5iv.labs.arxiv.org/html/{arxiv_id}")
    ids2paragraphs = {}
    for arxiv_id, ar5iv_link in zip(arxiv_ids, ar5iv_links):
        paragraphs = parsing_paragraph(ar5iv_link)
        ids2paragraphs[arxiv_id] = paragraphs
        # print(ar5iv_link)

    # print(ids2paragraphs)
    return ids2paragraphs


def retrieve_passages_single_paper(arxiv_id):
    ar5iv_link = "https://ar5iv.labs.arxiv.org/html/{0}".format(arxiv_id)
    paragraphs = parsing_paragraph(ar5iv_link)
    return paragraphs


def search_google(query):
    try:
        search_results = search(
            "site: https://arxiv.org/ {}".format(query),
            advanced=True,
            proxy="https://proxyhere.net:port",
        )
        time.sleep(0.5)
        arxiv_ids = []
        for result in search_results:
            arxiv_id = None
            if "https://arxiv.org/abs/" in result.url:
                arxiv_id = result.url.split("https://arxiv.org/abs/")[1]
            if "https://arxiv.org/pdf/" in result.url:
                arxiv_id = result.url.split("https://arxiv.org/pdf/")[1]
            if "https://arxiv.org/html/" in result.url:
                arxiv_id = result.url.split("https://arxiv.org/html/")[1]
                if "v" in arxiv_id:
                    arxiv_id = arxiv_id.split("v")[0]
            if arxiv_id is not None and len(arxiv_id) > 0:
                arxiv_ids.append(arxiv_id)
        arxiv_ids = list(set(arxiv_ids))
        passages = retrieve_passages(arxiv_ids)
        paper_meta_data_results = batch_paper_data(arxiv_ids)
        ctxs = []
        for arxiv_id in arxiv_ids:
            paper_parsed = passages[arxiv_id]
            if (
                    arxiv_id in paper_meta_data_results
                    and type(paper_meta_data_results[arxiv_id]) is dict
            ):
                paper_meta_data = paper_meta_data_results[arxiv_id]
                for p in paper_parsed:
                    ctxs.append(
                        {
                            "title": paper_meta_data["title"],
                            "text": p,
                            "type": "google_search",
                            "url": paper_meta_data["url"],
                            "citation_counts": paper_meta_data["citationCount"],
                            "abstract": paper_meta_data["abstract"],
                        }
                    )
        return ctxs
    except:
        print("request error")
        return []


def get_pubmed_abstract_title(pmid):
    # Define the base URL for the efetch utility
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

    # Set the parameters for the API request
    params = {
        "db": "pubmed",  # Specify the database
        "id": pmid,  # Provide the PubMed ID
        "retmode": "xml",  # Return results in XML format
    }

    # Make the request to the NCBI E-utilities API
    response = requests.get(base_url, params=params)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the XML response
        root = ET.fromstring(response.content)

        # Extract the title
        if root.find(".//ArticleTitle") is None:
            return None, None
        title = root.find(".//ArticleTitle").text

        # Extract the abstract (there can be multiple parts)
        abstract = " ".join(
            [
                elem.text
                for elem in root.findall(".//AbstractText")
                if type(elem.text) is str
            ]
        )
        return title, abstract
    else:
        return None, None


def search_google_non_restricted(query):
    search_results = search(
        "site: https://arxiv.org/ OR https://pubmed.ncbi.nlm.nih.gov/ {}".format(query),
        advanced=True,
    )
    arxiv_ids = []
    pubmed_ids = []
    for result in search_results:
        # try:
        print(result.url)
        arxiv_id = None
        if "https://arxiv.org/abs/" in result.url:
            arxiv_id = result.url.split("https://arxiv.org/abs/")[1]
        if "https://arxiv.org/pdf/" in result.url:
            arxiv_id = result.url.split("https://arxiv.org/pdf/")[1]
        if "https://arxiv.org/html/" in result.url:
            arxiv_id = result.url.split("https://arxiv.org/html/")[1]
            if "v" in arxiv_id:
                arxiv_id = arxiv_id.split("v")[0]
        if arxiv_id is not None and len(arxiv_id) > 0:
            arxiv_ids.append(arxiv_id)
        if "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC" in result.url:
            pubmed_id = result.url.split(
                "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC"
            )[1][:-1]
            pubmed_ids.append(pubmed_id)
        if "https://pubmed.ncbi.nlm.nih.gov/" in result.url:
            pubmed_id = result.url.split("https://pubmed.ncbi.nlm.nih.gov/")[1][:-1]
            pubmed_ids.append(pubmed_id)
        # except:
        #     continue
    arxiv_ids = list(set(arxiv_ids))
    pubmed_ids = list(set(pubmed_ids))

    print(arxiv_ids)
    print(pubmed_ids)

    passages = retrieve_passages(arxiv_ids)
    paper_meta_data_results = batch_paper_data(arxiv_ids)
    ctxs = []
    for arxiv_id in arxiv_ids:
        paper_parsed = passages[arxiv_id]
        if (
                arxiv_id in paper_meta_data_results
                and type(paper_meta_data_results[arxiv_id]) is dict
        ):
            paper_meta_data = paper_meta_data_results[arxiv_id]
            for p in paper_parsed:
                ctxs.append(
                    {
                        "title": paper_meta_data["title"],
                        "text": p,
                        "type": "google_search_arxiv",
                        "url": paper_meta_data["url"],
                        "citation_counts": paper_meta_data["citationCount"],
                        "abstract": paper_meta_data["abstract"],
                    }
                )

    pubmed_paper_data = batch_paper_data_pubmed(pubmed_ids)
    for pubmed_id in pubmed_ids:
        title, abstract = get_pubmed_abstract_title(pubmed_id)
        if title is None or abstract is None:
            continue
        paper_data = pubmed_paper_data[pubmed_id]
        ctxs.append(
            {
                "title": title,
                "text": abstract,
                "type": "google_search_pubmed",
                "url": paper_data["url"],
                "citation_counts": paper_data["citationCount"],
                "abstract": paper_data["abstract"],
            }
        )
    return ctxs


def search_youcom_non_restricted(query):
    headers = {"X-API-Key": YOUR_API_KEY}
    query = "site: https://arxiv.org/ OR https://pubmed.ncbi.nlm.nih.gov/ {}".format(
        query
    )
    params = {"query": query, "num_web_results": 20}
    search_results = requests.get(
        f"https://api.ydc-index.io/search",
        params=params,
        headers=headers,
    ).json()
    print(search_results)
    search_results = search_results["hits"]

    arxiv_ids = []
    pubmed_ids = []
    for result in search_results:
        # try:
        arxiv_id = None
        if "https://arxiv.org/abs/" in result["url"]:
            arxiv_id = result["url"].split("https://arxiv.org/abs/")[1]
        if "https://arxiv.org/pdf/" in result["url"]:
            arxiv_id = result["url"].split("https://arxiv.org/pdf/")[1]
        if "https://arxiv.org/html/" in result["url"]:
            arxiv_id = result["url"].split("https://arxiv.org/html/")[1]
            if "v" in arxiv_id:
                arxiv_id = arxiv_id.split("v")[0]
        if arxiv_id is not None and len(arxiv_id) > 0:
            arxiv_ids.append(arxiv_id)
        if "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC" in result["url"]:
            pubmed_id = result["url"].split(
                "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC"
            )[1][:-1]
            pubmed_ids.append(pubmed_id)
        if "https://pubmed.ncbi.nlm.nih.gov/" in result["url"]:
            pubmed_id = result["url"].split("https://pubmed.ncbi.nlm.nih.gov/")[1][:-1]
            pubmed_ids.append(pubmed_id)
        # except:
        #     continue
    arxiv_ids = list(set(arxiv_ids))
    pubmed_ids = list(set(pubmed_ids))

    print(arxiv_ids)
    print(pubmed_ids)

    passages = retrieve_passages(arxiv_ids)
    paper_meta_data_results = batch_paper_data(arxiv_ids)
    ctxs = []
    for arxiv_id in arxiv_ids:
        paper_parsed = passages[arxiv_id]
        if (
                arxiv_id in paper_meta_data_results
                and type(paper_meta_data_results[arxiv_id]) is dict
        ):
            paper_meta_data = paper_meta_data_results[arxiv_id]
            for p in paper_parsed:
                ctxs.append(
                    {
                        "title": paper_meta_data["title"],
                        "text": p,
                        "type": "you.com_arxiv",
                        "url": paper_meta_data["url"],
                        "citation_counts": paper_meta_data["citationCount"],
                        "abstract": paper_meta_data["abstract"],
                    }
                )

    pubmed_paper_data = batch_paper_data_pubmed(pubmed_ids)
    for pubmed_id in pubmed_ids:
        title, abstract = get_pubmed_abstract_title(pubmed_id)
        if title is None or abstract is None:
            continue
        if pubmed_id not in pubmed_paper_data:
            continue
        paper_data = pubmed_paper_data[pubmed_id]
        print(pubmed_paper_data)
        if type(paper_data) is str:
            continue
        ctxs.append(
            {
                "title": title,
                "text": abstract,
                "type": "you.com_pubmed",
                "url": paper_data["url"] if paper_data is not None else "",
                "citation_counts": (
                    paper_data["citationCount"] if paper_data is not None else 0
                ),
                "abstract": paper_data["abstract"] if paper_data is not None else "",
            }
        )
    return ctxs


def retrieve_pes2o_passaages(query, n_docs, domains):
    json_data = {"query": query, "n_docs": n_docs, "domains": "pes2o"}
    headers = {"Content-Type": "application/json"}
    print("search")
    start = time.perf_counter()
    search_results = requests.post(
        "http://tricycle.cs.washington.edu:5004/search", json=json_data, headers=headers
    ).json()
    end = time.perf_counter()
    print(f"search took {end - start:0.4f} seconds")
    ctxs = []
    print("loading paper data")
    start = time.perf_counter()
    paper_data = {
        id: get_paper_data(id) for id in search_results["results"]["pes2o IDs"]
    }
    # paper_data = batch_paper_data_SS_ID(search_results["results"]["pes2o IDs"])
    print(f"paper data took {end - start:0.4f} seconds")
    end = time.perf_counter()
    print("loaded paper data")
    for doc, s_id in zip(
            search_results["results"]["passages"], search_results["results"]["pes2o IDs"]
    ):
        if s_id not in paper_data:
            continue
        ctx = paper_data[s_id]
        print(ctx)
        if type(ctx) is not dict:
            continue
        ctx["text"] = doc
        ctxs.append(ctx)

    return ctxs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_file", required=True, type=str)
    parser.add_argument("--output_file", type=str)
    parser.add_argument("--api_key_fp", type=str)
    parser.add_argument("--model_name", type=str)
    parser.add_argument("--sample_n", type=int, default=-1)
    parser.add_argument("--api", type=str)
    parser.add_argument("--use_google", action="store_true")
    parser.add_argument("--you_search", action="store_true")
    parser.add_argument("--use_semantic_scholar", action="store_true")
    args = parser.parse_args()

    if args.api_key_fp is not None:
        with open(args.api_key_fp) as f:
            api_key = f.read()[:-1]
        if args.api == "together":
            base_url = "https://api.together.xyz"
        elif args.api == "anyscale":
            base_url = "https://api.endpoints.anyscale.com/v1"
        else:
            base_url = None

        client = OpenAI(base_url=base_url, api_key=api_key)
    else:
        client = None

    if args.input_file.endswith(".jsonl"):
        input_data = load_jsonlines(args.input_file)
    elif args.input_file.endswith(".json"):
        input_data = json.load(open(args.input_file))
        if "data" in input_data:
            input_data = input_data["data"]
    elif args.input_file.endswith(".tsv"):
        df = pd.read_csv(args.input_file, sep="\t")
        input_data = [{"input": row["input"]} for _, row in df.iterrows()]

    if args.sample_n > 0:
        random.shuffle(input_data)
        input_data = input_data[: args.sample_n]

    for id, item in tqdm(enumerate(input_data)):
        if "input" not in item:
            query = item["question"] if "question" in item else item["query"]
            item["input"] = query
        query = item["input"]
        # re-process the data format.
        for ctx in item["ctxs"]:
            if "pes2o score" in ctx:
                ctx["pes2o_paper_id"] = ctx["pes2o score"]
            if "retrieval text" in ctx:
                ctx["text"] = ctx["retrieval text"]
        if "ctxs" in item and type(item["ctxs"][0]["text"]) is dict:
            processed_ctxs = []
            for ctx in item["ctxs"]:
                ctx["pes2o_paper_id"] = ctx["text"]["doc_id"]
                ctx["text"] = ctx["text"]["text"]
                ctx["id"] = ctx["id"]
                processed_ctxs.append(ctx)
            item["ctxs"] = processed_ctxs

        retrieved_passages = []
        if args.use_google is True:
            try:
                retrieved_passages = search_google_non_restricted(query)
                time.sleep(1)
                print(
                    "papers retrieved from google: {0}".format(len(retrieved_passages))
                )
            except:
                print("google search error")

        if args.you_search is True:
            retrieved_passages_you = search_youcom_non_restricted(query)
            print(
                "papers retrieved from you.com: {0}".format(len(retrieved_passages_you))
            )
            retrieved_passages += retrieved_passages_you

        if args.use_semantic_scholar is True:
            ss_retrieved_passages, _ = search_semantic_scholar(
                query, client, args.model_name
            )
            print("papers retrieved from ss: {0}".format(len(ss_retrieved_passages)))
            retrieved_passages += ss_retrieved_passages
        if "ctxs" not in item:
            item["ctxs"] = retrieved_passages
        else:
            # collect all paper data
            ctxs_ids = [ctx["pes2o_paper_id"] for ctx in item["ctxs"]]
            paper_data_ctxs = batch_paper_data_SS_ID(ctxs_ids)
            for ctx in item["ctxs"]:
                if paper_data_ctxs is None:
                    continue
                if (
                        "pes2o_paper_id" not in ctx
                        or type(ctx["pes2o_paper_id"]) is not str
                        or ctx["pes2o_paper_id"] not in paper_data_ctxs
                        or type(paper_data_ctxs[ctx["pes2o_paper_id"]]) is not dict
                ):
                    continue
                ctx["abstract"] = paper_data_ctxs[ctx["pes2o_paper_id"]]["abstract"]
                ctx["citation_counts"] = paper_data_ctxs[ctx["pes2o_paper_id"]][
                    "citationCount"
                ]
                ctx["title"] = paper_data_ctxs[ctx["pes2o_paper_id"]]["title"]
                ctx["url"] = paper_data_ctxs[ctx["pes2o_paper_id"]]["url"]
                ctx["type"] = "dense_retriever"

            item["ctxs"] += retrieved_passages

        if "orig_ctxs" in item:
            item["ctxs"] = item["orig_ctxs"] + item["ctxs"]

        if id % 20 == 0:
            with open(args.output_file, "w") as outfile:
                json.dump({"data": input_data}, outfile)

    with open(args.output_file, "w") as outfile:
        json.dump({"data": input_data}, outfile)


if __name__ == "__main__":
    main()
