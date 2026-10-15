# Demo and viva notes

## A three-minute demo

1. Explain the goal: classify the purpose of an English customer-support message into one of eight labels.
2. Analyze “Where is my order? I need to track my package.” Show the top result, score and alternatives.
3. Show feature evidence and switch to NLP pipeline. Explain NLTK tokenization and TF-IDF words/bigrams.
4. Try the refund and account-access examples. Scores come from the saved model, not fixed example responses.
5. Enter an unrelated astronomy request to demonstrate clarification; explain that this is heuristic rejection, not guaranteed unknown-intent detection.
6. Show batch analysis and CSV export.
7. Finish on Model insights: Naive Bayes vs Logistic Regression, held-out scores, confusion matrix and synthetic-data limitation.

## Questions to prepare for

**What is intent classification?** Predicting the goal of a message, such as tracking an order or recovering a password. It differs from sentiment classification, which identifies emotional polarity.

**Where is NLTK used?** `intentlab/nlp.py` uses NLTK's TreebankWordTokenizer to split text. The tokenizer is also passed into the TF-IDF vectorizer during training and inference. It requires no downloaded corpora. Scikit-learn performs vectorization and classification.

**Why preserve negation?** “I can log in” and “I cannot log in” differ in meaning. Removing negation as a stopword would discard an important signal. Stopwords are excluded only from the separate vocabulary-overlap heuristic, not from model features.

**What does TF-IDF mean?** Term frequency measures occurrence in a message, and inverse document frequency downweights terms common across the training corpus. This implementation also learns two-word phrases and uses sublinear term frequency.

**Why Naive Bayes?** It is a lightweight probabilistic baseline that combines feature likelihoods under a conditional-independence assumption. It won this experiment's validation macro F1 against Logistic Regression. That result is dataset-specific; it is not universally better.

**What is the alternative?** Logistic Regression learns linear class weights in TF-IDF feature space. Both models use the same data partitions and feature settings. Training hyperparameters are recorded in `scripts/train.py`.

**Why three data partitions?** Training fits parameters; validation selects the model and confidence threshold; the held-out test set reports final performance. Fitting TF-IDF on all data would leak evaluation information.

**How are duplicates handled?** Exact-message duplicates are removed. Entity/number-normalized templates and near-duplicate char-trigram clusters stay in the same partition. Group-level stratification gives approximate 70/15/15 proportions by message count. Original generation seed IDs are unavailable, so related templates can still leak.

**What does macro F1 measure?** Compute F1 for each intent, then average equally. F1 is the harmonic mean of precision and recall. Accuracy counts the fraction of correct predictions; it can conceal weak minority classes.

**Are probabilities true confidence?** No. They are uncalibrated model estimates. A confident answer can be wrong, especially out of domain.

**How does explanation work?** For the selected Naive Bayes model, each active TF-IDF feature is multiplied by its class log-likelihood contrast relative to other classes. The UI shows the largest signed contributions for the top candidate. It does not claim causal explanation.

**How does clarification work?** Require a validation-selected probability threshold of 0.40, a lead of at least 0.15, at least three tokens, and at least 35% overlap with content vocabulary. These are heuristics, not a trained unknown-intent class.

**Why is accuracy so high?** The dataset is hybrid synthetic with fairly distinct intent patterns. Test accuracy is 99.6209% and macro F1 is 0.9940 on this subset; that does not establish real-world performance. Four errors are misspelled cancellation messages.

**How does Vercel serving work?** The React frontend sends a same-origin JSON request to a Python Function. The function loads the saved artifact and runs inference. Training happens beforehand. Local verification is complete; the recipient must verify the actual hosted deployment and cold starts.

**What would improve it?** Add separately labeled real-world evaluation messages, measure unknown-intent detection, calibrate probabilities using validation data, improve robustness to typos, and collect more representative labels. Do not claim these improvements already exist.

## Honest project scope

English only; eight labels; one intent per message; no multilingual model, sentiment classifier, entity extractor, generative chatbot, live retraining, or external LLM API. The project uses NLTK and scikit-learn. The source dataset is by Bitext and retains its CDLA-Sharing-1.0 license.
