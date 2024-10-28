import { ReportSectionFromApi } from '../../models/Report';

export const MockData: ReportSectionFromApi[] = [
  {
    id: '1234',
    title: 'Evaluation Metrics',
    tldr: 'Evaluating long-form scientific question answering systems requires metrics that go beyond traditional n-gram similarity measures. Researchers have proposed new metrics like Intersection over Union (IoU) and specialized metrics for generated answers to address the limitations of existing measures.',
    text: 'Evaluating long-form scientific question answering systems presents unique challenges that traditional metrics struggle to address. Standard metrics like BLEU, ROUGE, METEOR, and F1 score, which rely on n-gram similarity, have well-known limitations when applied to complex question answering tasks  (8, Chen et al., 2019). While these metrics may be suitable for existing QA datasets, they can constrain the complexity of questions and answers that can be effectively evaluated.\\n\\nFor shorter answers, exact match (EM) has been a consistent metric with how humans are expected to answer reading comprehension tests and aligns with TREC QA evaluation standards  <Paper corpusId="207901226" paperTitle="(8, Chen et al., 2019)" isShortName></Paper>. However, for medium and long answers, F1 and ROUGE-L scores are often considered more appropriate  (49, Gao et al., 2023).\n\nTo address the limitations of F1 score in evaluating long answers, researchers have proposed new metrics such as Intersection over Union (IoU), which measures position-sensitive overlap between predicted and target answer spans  (18, Monz et al., 2021). This metric aims to provide a more accurate assessment of long-form answer quality.\n\nFor generated answers, specialized metrics have been developed to better correlate with human judgments. Yoon et al. introduced KPQA-metrics, which demonstrated significantly higher correlations with human evaluations compared to previous metrics when applied to human-evaluation datasets  (14, Yoon et al., 2020).\n\nAs the field of long-form scientific question answering continues to evolve, it\'s likely that new evaluation metrics will be developed to address the unique challenges posed by these complex systems [LLM MEMORY | 2024]. The ongoing research in this area emphasizes the importance of aligning automated evaluation metrics with human judgments to ensure meaningful assessments of system performance.\n\nTesting a list:\n- Item 1\n- Item 2\n- Item 3',
    citations: [
      {
        id: '(8, Chen et al., 2019)',
        corpus_id: 207901226,
        n_citations: 79,
        snippets: [
          'This is especially important as existing metrics (BLEU, ROUGE, METEOR, and F1) are computed using n-gram similarity and have a number of well-known drawbacks',
          'Our study suggests that while current metrics may be suitable for existing QA datasets, they limit the complexity of QA datasets that can be created.',
        ],
      },
      {
        id: '(5, Greiff et al., 2005)',
        corpus_id: 28935117,
        n_citations: 24,
        snippets: [
          'The exact answer metric is consistent with how humans are expected to answer RC tests; it is also consistent with the most recent TREC QA evaluation.',
        ],
      },
      {
        id: '(49, Gao et al., 2023)',
        corpus_id: 259299543,
        n_citations: 1,
        snippets: [
          'Although EM is often the primary metric used in opendomain QA research, we believe that the F1 and ROUGE-L scores are more suitable for medium and long answers following past work on longform QA',
        ],
      },
      {
        id: '(18, Monz et al., 2021)',
        corpus_id: 233189637,
        n_citations: 15,
        snippets: [
          'We show the limitation of the F1 score for evaluation of long answers and introduce Intersection over Union (IoU), which measures position-sensitive overlap between the predicted and the target answer spans',
          'We show the limitations of the F1 score in evaluating long answers and propose a new evaluation metric',
        ],
      },
      {
        id: '(14, Yoon et al., 2020)',
        corpus_id: 222080412,
        n_citations: 10,
        snippets: [
          'To evaluate GenQA metrics, it is necessary to measure the correlation between human judgments and automated text evaluation metrics for evaluating the model generated answers',
          'In experiments on the human-evaluation datasets, we show that our KPQA-metrics have significantly higher correlations with human judgments than the previous metrics.',
        ],
      },
    ],
  },
  {
    id: '1235',
    title: 'Human Evaluation',
    tldr: 'Human evaluation remains the gold standard for assessing long-form scientific question answering systems, despite its costs and challenges. Researchers are exploring ways to improve human evaluation methods and develop automated approaches that align closely with human judgments.',
    text: 'Human evaluation continues to be the most reliable approach for assessing the performance of long-form scientific question answering systems, despite the challenges and costs associated with it  (40, Xu et al., 2023)  (48, Gabburo et al., 2023). This method typically involves comparing model responses to human-annotated gold answers, which provides a more nuanced assessment of answer quality than automated metrics alone  (35, Lu et al., 2023).\n\nThe superiority of human evaluation is evident in studies that compare model performance to human-generated responses. For instance, Auli et al. found that even their best abstractive model, which outperformed conventional approaches, still fell far short of human performance, with raters preferring gold responses in over 86% of cases  (7, Auli et al., 2019). This highlights the significant gap that remains between current AI capabilities and human-level performance in long-form scientific question answering.\n\nTo address the limitations of traditional metrics for long answers, researchers have proposed human-in-the-loop evaluation approaches specifically for science question answering  (41, Kaufmann et al., 2023). These methods aim to capture the nuances and complexities of scientific responses that automated metrics may miss.\n\nWhile human evaluation remains the gold standard, efforts are being made to develop automated evaluation methods that align more closely with human judgments. For example, Lu et al. found that GPT-4 based evaluation (GPT4-eval) achieved the highest agreement with human judgments, with a 70.15 Spearman correlation  (35, Lu et al., 2023). This suggests that large language models may play a role in bridging the gap between automated and human evaluation in the future.\n\nDespite these advancements, the field continues to grapple with the trade-offs between the reliability of human evaluation and the efficiency and scalability of automated methods. As research progresses, it is likely that a combination of refined human evaluation techniques and increasingly sophisticated automated metrics will be used to assess long-form scientific question answering systems more effectively.',
    citations: [
      {
        id: '(40, Xu et al., 2023)',
        corpus_id: 258833523,
        n_citations: 9,
        snippets: [
          'Current automatic evaluation meth-ods have shown limitations, indicating that human evaluation still remains the most reliable approach',
          'Our evaluation of these methods utilizes human-annotated results, and we employ accuracy and F1 score to measure their performance.',
        ],
      },
      {
        id: '(48, Gabburo et al., 2023)',
        corpus_id: 262084005,
        n_citations: 1,
        snippets: [
          'Evaluation of QA systems is very challenging and expensive, with the most reliable approach being human annotations of correctness of answers for questions',
          'We propose a new evaluation metric: SQuArE (Sentence-level QUestion AnsweRing Evaluation), using multiple reference answers (combining multiple correct and incorrect references) for sentence-form QA.',
        ],
      },
      {
        id: '(35, Lu et al., 2023)',
        corpus_id: 260334056,
        n_citations: 58,
        snippets: [
          'Evaluation in QA usually involves comparing model responses to human-annotated gold answers',
          'Notably, GPT4-eval has the highest agreement with human judgments, with 70.15 Spearman cor-',
        ],
      },
      {
        id: '(7, Auli et al., 2019)',
        corpus_id: 196170479,
        n_citations: 428,
        snippets: [
          'Automatic and human evaluations show that an abstractive model trained with a multi-task objective outperforms conventional Seq2Seq, language modeling, as well as a strong extractive baseline',
          'our best model is still far from human performance since raters prefer gold responses in over 86% of cases',
        ],
      },
      {
        id: '(41, Kaufmann et al., 2023)',
        corpus_id: 256390502,
        n_citations: 5,
        snippets: [
          'Long answers on the other hand are more challenging as current metrics like F1 (word overlap), ROGUE Lin & Hovy (2003), BLEU Papineni et al. (2002), BLUERT Sellam et al. (2020), METEOR Banerjee & Lavie (2005), BERTScore Zhang et al. (2019) and Semantic Answer Similarity (SAS) Risch et al. (2021) may not capture the nuances to properly assess the correctness of answers',
          'Human-in-loop evaluation approaches have been proposed for science question answering',
        ],
      },
    ],
  },
  {
    id: '1236',
    title: 'Challenges in Evaluation',
    tldr: 'Evaluating long-form scientific question answering systems faces numerous challenges, including the lack of suitable benchmarks and the difficulty in defining answer correctness. Traditional metrics often fail to capture the complexity of scientific answers, necessitating new evaluation approaches.',
    text: "Evaluating long-form scientific question answering (QA) systems presents several significant challenges that hinder progress in this field. One of the primary issues is the lack of high-quality datasets and well-defined benchmarks specifically tailored for long-form scientific QA  (26, Stelmakh et al., 2022). Existing popular QA benchmarks, such as WebQuestions, SimpleQuestions, TREC, QALD, or SQuAD, are not suitable for this task as they primarily focus on simple questions or natural language passage understanding rather than complex scientific inquiries  (9, Lu et al., 2019).\n\nThe complexity of scientific questions poses another challenge, as sophisticated QA systems and large language models (LLMs) often struggle to provide accurate answers. A study by Auer et al. demonstrated that even advanced systems like ChatGPT could only correctly answer a small fraction of handcrafted scientific questions  (2, Auer et al., 2023). This highlights the gap between current AI capabilities and the level of expertise required for scientific QA.\n\nDefining and assessing answer correctness is particularly challenging in the context of long-form scientific QA. Traditional evaluation metrics often fail to align with human judgments, especially when dealing with verbose, free-form answers generated by LLMs  (57, Liang et al., 2024). This misalignment between automated metrics and human evaluation makes it difficult to accurately measure progress in the field.\n\nThe emergence of increasingly powerful language models has further complicated the evaluation process. Lee et al. noted that evaluating the performance of models like InstructGPT, ChatGPT, and Bard on scientific articles has become increasingly challenging  (39, Lee et al., 2023). This is partly due to the models' ability to generate plausible-sounding but potentially inaccurate responses, making it harder to distinguish between correct and incorrect answers.\n\nMoreover, the task of long-form QA itself presents inherent difficulties in both modeling and reliable evaluation  (42, Xu et al., 2023). The need for in-depth explanations and the potential for multiple valid interpretations of ambiguous questions add layers of complexity to the evaluation process  (26, Stelmakh et al., 2022).\n\nExisting datasets for long-form QA, such as ELI5, have been found to have issues that complicate the development and evaluation of suitable models  (50, Papadopoulou et al., 2023). These issues may include inconsistencies in answer quality, ambiguity in questions, or limitations in the scope of scientific topics covered.\n\nAs the field progresses, addressing these challenges in evaluation will be crucial for advancing long-form scientific question answering systems. Developing more robust evaluation methodologies, creating high-quality benchmarks, and aligning automated metrics with human judgments are key areas that require further research and innovation.",
    citations: [
      {
        id: '(26, Stelmakh et al., 2022)',
        corpus_id: 248157463,
        n_citations: 79,
        snippets: [
          "Recent progress on open domain factoid question answering (QA) does not easily transfer to the task of long-form QA, where the goal is to answer questions that require in-depth explanations. The hurdles include a lack of high-quality data and the absence of a well-defined notion of an answer's quality",
          'ASQA admits a clear notion of correctness: a user faced with a good summary should be able to answer different interpretations of the original ambiguous question.',
        ],
      },
      {
        id: '(9, Lu et al., 2019)',
        corpus_id: 197928345,
        n_citations: 58,
        snippets: [
          'Popular QA benchmarks like WebQuestions [7], SimpleQuestions [10], TREC [2,19], QALD [60], or SQuAD [48], are not suitable, as they mostly focus on answering simple questions or understanding natural language passages.',
        ],
      },
      {
        id: '(2, Auer et al., 2023)',
        corpus_id: 258507546,
        n_citations: 19,
        snippets: [
          'As our applicability and feasibility evaluation has shown, sophisticated QA systems and LLMs, like ChatGPT, have difficulties answering these types of questions that require scholarly knowledge',
          'In fact, only 12 and 14 of the 100 handcrafted SciQA questions were answered correctly by the QA system and the large language model, respectively.',
        ],
      },
      {
        id: '(57, Liang et al., 2024)',
        corpus_id: 267199734,
        n_citations: 0,
        snippets: [
          'QA can only make progress if we know if an answer is correct, but for many of the most challenging and interesting QA examples, current evaluation metrics to determine answer equivalence (AE) often do not align with human judgments, particularly more verbose, free-form answers from large language models (LLM).',
        ],
      },
      {
        id: '(39, Lee et al., 2023)',
        corpus_id: 260927520,
        n_citations: 13,
        snippets: [
          'While we proposed a new benchmark for QA task on scientific articles, evaluation is becoming difficult, especially on recently emerging language models (InstructGPT as well as ChatGPT, Bard).',
        ],
      },
      {
        id: '(42, Xu et al., 2023)',
        corpus_id: 258967761,
        n_citations: 5,
        snippets: [
          'However, long-form question answering remains challenging, both in terms of modeling',
          'and reliable evaluation',
        ],
      },
      {
        id: '(50, Papadopoulou et al., 2023)',
        corpus_id: 258833404,
        n_citations: 0,
        snippets: [
          'Recently, Krishna et al. (2021) performed a case study on ELI5 (Fan et al., 2019), one of the largest collections available for LFQA, and pointed out several issues that complicate the development and evaluation of suitable models.',
        ],
      },
    ],
  },
  {
    id: '1238',
    title: 'Proposed Evaluation Approaches',
    tldr: 'Researchers have proposed various innovative methods to evaluate long-form scientific question answering systems, moving beyond traditional metrics. These approaches include multi-faceted evaluation, exam-based assessment, granularity-aware evaluation, and leveraging large language models for scoring.',
    text: '1. Multi-faceted Evaluation: Choi et al.  (1, Choi et al., 2023) advocate for moving away from a single "overall score" and instead adopting a multi-faceted evaluation approach. This method targets specific aspects of long-form answers, such as factuality and completeness, providing a more comprehensive assessment of system performance.\n\n2. EXAM Paradigm: Dietz et al.  (19, Dietz et al., 2021) propose EXAM, an evaluation paradigm that uses held-out exam questions and an automated question-answering system to assess how well generated responses can answer follow-up questions. This approach evaluates the effectiveness of systems that combine retrieval with language generation.\n\n3. GRANOLA QA: Yona et al.  (54, Yona et al., 2024) introduce GRANOLA QA, a novel evaluation setting that considers answer granularity. This method evaluates predicted answers in terms of both accuracy and informativeness against a set of multi-granularity answers, acknowledging that factual questions can often be correctly answered at different levels of detail.\n\n4. LLM-based Evaluation: Liu et al.  (56, Liu et al., 2024) propose using GPT-4 to evaluate answers on a scale from 0 to 5. Their approach includes a structured evaluation template with clear task descriptions, expertly crafted criteria, and demonstrations of various answer qualities to guide the LLM\'s assessment.\n\n5. Extractive QA for Factual Correctness: Jiang et al.  (27, Jiang et al., 2022) suggest evaluating the factual correctness of long-form QA models by using them to answer questions from extractive QA tasks, such as Natural Questions. This method aims to efficiently assess the faithfulness of the model\'s outputs.\n\n6. Domain-specific Evaluation: Sun et al.  (36, Sun et al., 2023) highlight the use of PubMedQA for evaluating literature comprehension ability in the biomedical domain. This task involves answering research questions with yes/no/maybe responses using corresponding abstracts.\n\n7. Context Selection Assessment: Ordonez et al.  (32, Ordonez et al., 2022) utilize the QASPER dataset to evaluate both answer quality and context selection in scientific question answering. Their detect-retrieve-comprehend (DRC) system demonstrates improvements in Answer-F1 scores while also excelling in context selection.\n\nThese proposed approaches represent a diverse range of strategies for evaluating long-form scientific question answering systems, addressing various aspects of performance and overcoming limitations of traditional metrics.',
    citations: [
      {
        id: '(1, Choi et al., 2023)',
        corpus_id: 258960565,
        n_citations: 50,
        snippets: [
          'We perform the first targeted study of the evaluation of long-form answers, covering both human and automatic evaluation practices',
          'We encourage future work to move away from a single "overall score" of the answer and adopt a multi-faceted evaluation, targeting aspects such as factuality and completeness',
          'We publicly release all of our annotations and code to spur future work into LFQA evaluation.',
        ],
      },
      {
        id: '(19, Dietz et al., 2021)',
        corpus_id: 238207962,
        n_citations: 15,
        snippets: [
          'To be effective, such systems should be allowed to combine retrieval with language generation',
          'we propose EXAM, an evaluation paradigm that uses held-out exam questions and an automated questionanswering system to evaluate how well generated responses can answer follow-up questions—without knowing the exam questions in advance',
          'These articles are evaluated based on how many exam questions an automated Q/A system can answer correctly.',
        ],
      },
      {
        id: '(54, Yona et al., 2024)',
        corpus_id: 266899703,
        n_citations: 5,
        snippets: [
          'Factual questions typically can be answered correctly at different levels of granularity',
          "both ``August 4, 1961'' and ``1961'' are correct answers to the question ``When was Barack Obama born?''",
          'we propose GRANOLA QA, a novel evaluation setting where a predicted answer is evaluated in terms of accuracy and informativeness against a set of multi-granularity answers.',
        ],
      },
      {
        id: '(56, Liu et al., 2024)',
        corpus_id: 267617073,
        n_citations: 1,
        snippets: [
          'We ask GPT-4 to range an answer from 0 (worst) to 5 (best)',
          'The evaluation template includes four components: a clear task description, expertly crafted evaluation criteria for objectivity, demonstrations with a variety of answer qualities (best, worst, intermediate) each with a score and rationale, and specific evaluation instructions for the LLM, encompassing the questionanswer pair to be evaluated and a reference answer.',
        ],
      },
      {
        id: '(27, Jiang et al., 2022)',
        corpus_id: 247188085,
        n_citations: 40,
        snippets: [
          'We also propose to evaluate the factual correctness of LFQA model by answering questions of extractive QA tasks (e.g., Natural Questions), which may be helpful to evaluate the faithfulness of LFQA model efficiently.',
        ],
      },
      {
        id: '(36, Sun et al., 2023)',
        corpus_id: 261214653,
        n_citations: 24,
        snippets: [
          'The task of PubMedQA is to answer research questions with yes/no/maybe using the corresponding abstracts, which is fit for evaluating the literature comprehension ability.',
        ],
      },
      {
        id: '(32, Ordonez et al., 2022)',
        corpus_id: 252715637,
        n_citations: 3,
        snippets: [
          'Using QASPER for evaluation, our detect-retrieve-comprehend (DRC) system achieves a +7.19 improvement in Answer-F1 over existing baselines while delivering superior context selection.',
        ],
      },
    ],
  },
  {
    id: '1240',
    title: 'Datasets and Benchmarks',
    tldr: 'Several datasets and benchmarks have been developed to evaluate long-form scientific question answering systems. These resources aim to assess various aspects of scientific understanding and answer generation, ranging from fill-in-the-blank questions to non-factoid question answering tasks.',
    text: '1. PaperQA: Kang et al. introduced PaperQA, a scientific question answering task designed to measure a machine\'s ability to understand professional-level scientific articles  (11, Kang et al., 2019). This dataset consists of over 80,000 "fill-in-the-blank" type questions based on articles from reputable scientific journals such as Nature and Science. PaperQA aims to provide a comprehensive benchmark for evaluating scientific comprehension in AI systems.\n\n2. Non-factoid QA Evaluation: Nakatsuji et al. emphasize the importance of using both automated metrics and human judgment for evaluating non-factoid question answering tasks  (10, Nakatsuji et al., 2019). They suggest using popular metrics like ROUGE-L and BLEU-4 to measure the fluency of computer-generated text, particularly for non-factoid QA tasks. However, they also stress the significance of human evaluation in assessing the quality of long-form scientific answers.\n\n[LLM MEMORY | 2024] While not mentioned in the provided references, it\'s worth noting that other datasets such as SciQ, AI2 Science Questions, and QASPER have also been developed to evaluate scientific question answering systems. These datasets cover various aspects of scientific knowledge and can be used in conjunction with PaperQA and non-factoid QA evaluation methods to provide a more comprehensive assessment of long-form scientific question answering systems.',
    citations: [
      {
        id: '(11, Kang et al., 2019)',
        corpus_id: 61809920,
        n_citations: 5,
        snippets: [
          'To measure the ability of a machine to understand professional-level scientific articles, we construct a scientific question answering task called PaperQA. The PaperQA task is based on more than 80 000 "fill-in-the-blank" type questions on articles from reputed scientific journals such as Nature and Science.',
        ],
      },
      {
        id: '(10, Nakatsuji et al., 2019)',
        corpus_id: 208527006,
        n_citations: 7,
        snippets: [
          'To measure performance, we used human judgment as well as two popular metrics',
          'for measuring the fluency of computer-generated text: ROUGE-L',
          'and BLEU-4',
          'ROUGE-L is used for measuring the performance for evaluating non-factoid QAs',
          'however, we also think human judgement is important in this task.',
        ],
      },
    ],
  },
];
