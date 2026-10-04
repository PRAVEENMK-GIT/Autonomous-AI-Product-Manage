import argparse
from datetime import datetime, timezone
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

from genai.analyzer import analyze_document
from genai.llm import is_llm_configured

logger = logging.getLogger(__name__)

DEFAULT_LABELS_PATH = Path(__file__).parent.parent / "data" / "sample" / "labels.json"
DEFAULT_OUTPUT_PATH = Path(__file__).parent.parent / "data" / "eval_results.json"


def evaluate_dataset(labels_path: Path, use_stub: bool = False) -> Dict[str, Any]:
    if not labels_path.exists():
        raise FileNotFoundError(f"Evaluation labels file not found at: {labels_path}")

    with open(labels_path, "r", encoding="utf-8") as f:
        ground_truth: List[Dict[str, Any]] = json.load(f)

    total_items = len(ground_truth)
    if total_items == 0:
        raise ValueError("Labels dataset is empty")

    correct_sentiment = 0
    total_expected_themes = 0
    total_predicted_themes = 0
    true_positive_themes = 0

    total_expected_pains = 0
    captured_pains = 0

    mismatches: List[Dict[str, Any]] = []

    print(f"\n========================================================")
    print(f"  RUNNING EVALUATION ON {total_items} GROUND TRUTH ITEMS")
    print(f"  Stub Mode: {use_stub or not is_llm_configured()}")
    print(f"========================================================\n")

    for idx, item in enumerate(ground_truth, start=1):
        text = item["text"]
        source_type = item["sourceType"]
        rating = item.get("rating")
        expected_sentiment = item["expectedSentiment"]
        expected_themes: Set[str] = set([t.lower().strip() for t in item.get("expectedThemes", [])])
        expected_pains: List[str] = item.get("expectedPainPoints", [])

        # Run extraction
        result = analyze_document(
            text=text,
            source_type=source_type,
            rating=rating,
            use_stub=use_stub,
        )

        pred_themes = set(result.themes)
        pred_sentiment = result.sentiment

        # Sentiment accuracy
        if pred_sentiment == expected_sentiment:
            correct_sentiment += 1

        # Theme matching (allowing substring / overlap matches)
        matched_expected = set()
        matched_pred = set()
        for e in expected_themes:
            for p in pred_themes:
                if e in p or p in e:
                    matched_expected.add(e)
                    matched_pred.add(p)

        tp = len(matched_expected)
        true_positive_themes += tp
        total_expected_themes += len(expected_themes)
        total_predicted_themes += len(pred_themes)

        # Pain point check
        total_expected_pains += len(expected_pains)
        if expected_pains:
            for ep in expected_pains:
                ep_lower = ep.lower()
                if any(ep_lower in pp.lower() or pp.lower() in ep_lower for pp in result.painPoints):
                    captured_pains += 1

        # Check for mismatch
        has_mismatch = (
            pred_sentiment != expected_sentiment or
            len(matched_expected) < len(expected_themes)
        )
        if has_mismatch:
            mismatches.append({
                "itemIndex": idx,
                "textSnippet": text[:80] + "...",
                "expectedSentiment": expected_sentiment,
                "predictedSentiment": pred_sentiment,
                "expectedThemes": list(expected_themes),
                "predictedThemes": list(pred_themes),
                "missedThemes": list(expected_themes - matched_expected),
            })

        print(f"[{idx:02d}/{total_items:02d}] {source_type.upper():10s} | Sent: {pred_sentiment:8s} (exp: {expected_sentiment:8s}) | Themes: {len(pred_themes)} pred / {len(expected_themes)} exp")

    # Metrics
    sentiment_acc = round(correct_sentiment / total_items, 4)
    precision = round(true_positive_themes / max(total_predicted_themes, 1), 4)
    recall = round(true_positive_themes / max(total_expected_themes, 1), 4)
    f1 = round((2 * precision * recall) / max(precision + recall, 1e-6), 4)
    pain_capture = round(captured_pains / max(total_expected_pains, 1), 4) if total_expected_pains > 0 else 1.0

    eval_report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": os.getenv("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct"),
        "promptVersion": "v1",
        "totalItems": total_items,
        "sentimentAccuracy": sentiment_acc,
        "themePrecision": precision,
        "themeRecall": recall,
        "themeF1": f1,
        "painPointCaptureRate": pain_capture,
        "mismatches": mismatches,
    }

    print("\n--------------------------------------------------------")
    print("                    EVALUATION RESULTS                  ")
    print("--------------------------------------------------------")
    print(f" Total Evaluated Items:    {total_items}")
    print(f" Sentiment Accuracy:       {sentiment_acc * 100:.1f}%")
    print(f" Theme Precision:          {precision * 100:.1f}%")
    print(f" Theme Recall:             {recall * 100:.1f}%")
    print(f" Theme F1 Score:           {f1 * 100:.1f}%")
    print(f" Pain Points Captured:     {pain_capture * 100:.1f}%")
    print(f" Total Mismatches:         {len(mismatches)}")
    print("--------------------------------------------------------\n")

    return eval_report


def main():
    parser = argparse.ArgumentParser(description="Evaluate GenAI extraction against hand-labelled items")
    parser.add_argument("--labels", type=str, default=str(DEFAULT_LABELS_PATH), help="Path to ground truth labels JSON")
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT_PATH), help="Path to write eval results")
    parser.add_argument("--stub", action="store_true", help="Force stub analyzer mode")
    args = parser.parse_args()

    labels_p = Path(args.labels)
    output_p = Path(args.output)

    report = evaluate_dataset(labels_p, use_stub=args.stub)

    output_p.parent.mkdir(parents=True, exist_ok=True)
    with open(output_p, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"Evaluation report written to {output_p}")


if __name__ == "__main__":
    main()
