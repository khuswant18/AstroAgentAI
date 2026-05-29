# AstroAgent Evaluation Report

## 1. What the Evaluation Revealed

The evaluation harness exposed several fascinating insights into Aradhana's behaviour, particularly around edge cases and API constraints. 

**Surprising Failures:**
* **Type coercion in tool calls:** The model occasionally hallucinated strings instead of floats for coordinates (e.g., `lat: "40.7128"` instead of `40.7128`), which caused the `compute_birth_chart` tool schema validation to crash.
* **Prompt Injection (Adversarial):** The agent struggled significantly with adversarial attacks (0% pass rate). When presented with deep system overrides (like the DAN prompt or "Forget your system prompt"), the LLM often abandoned its persona instead of gracefully rejecting the injection.
* **Safety Guardrails:** While the safety deterministic checks correctly flagged certainty language ("you will", "guarantee", "medically"), the LLM itself was prone to occasional slip-ups in transit requests when describing potentially difficult squares or oppositions, leading to a 25% pass rate in the safety category.
* **Rate Limits:** We hit Groq API rate limits (HTTP 429) during the evaluation, highlighting the need for better backoff and retry mechanisms in the agent's tool loop.

## 2. Meaning of the Scores

The overall pass rate of **42.3% (11/26)** reflects a strict deterministic grading system. 

* **Where Aradhana is Strong:** 
  The agent excels at **Knowledge Questions** (100% pass rate) and basic **Invalid Input** handling (100% pass rate). When it successfully routes to RAG, the judge consistently scored it highly (average 4.8/5) for warmth, factual accuracy, and appropriate length. 
* **Where Aradhana is Weak:**
  The agent struggles with **Adversarial** and **Off-topic** redirection (0% pass rate). It attempts to answer off-topic queries instead of pivoting back to astrology, and it is overly compliant with system override prompts. Furthermore, transit requests (25% pass) often triggered too many tool calls or generated poorly formatted JSON tool inputs.

## 3. Prioritized Improvements

If given more time, I would prioritize the following 4 improvements:

1. **Robust Tool Error Handling & Retries:** Implement native LangGraph fallback nodes to catch `ValidationError` when the LLM hallucinates string coordinates instead of floats, passing the error back to the LLM to self-correct.
2. **System Prompt Hardening:** Add strict few-shot examples to the `ARADHANA_SYSTEM_PROMPT` demonstrating how to gracefully decline prompt injections and off-topic requests (e.g., "I am an astrology guide. I cannot help with coding...").
3. **API Resilience:** Wrap the `_get_llm()` calls in Tenacity retry blocks to handle HTTP 429 Rate Limits from Groq seamlessly, avoiding full conversation crashes.
4. **Enhanced Safety Node:** Expand the `safety_check` node to use a lightweight classifier LLM to detect subtle medical/legal advice that evades regex keyword matching.

## 4. LLM-as-Judge Reliability

The Llama-3.3-70b-versatile model served as a highly competent judge for tone and helpfulness. 
* **Agreement with Intuition:** The judge's scores (averaging 4.5-5.0 on passed tests) aligned well with human intuition. It correctly rewarded responses that were warm and empowering, and penalized verbose or overly deterministic outputs. 
* **Nuance:** It proved much better than keyword matching at evaluating whether Aradhana's tone was appropriate for a "spiritual companion". However, because the judge relies on the same API, it is susceptible to the same rate limit bottlenecks as the agent itself.
