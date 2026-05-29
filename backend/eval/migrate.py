import json
import os

in_path = "/Users/khuswant/Desktop/AstroAgent/backend/eval/golden_set.jsonl"
out_path = "/Users/khuswant/Desktop/AstroAgent/backend/eval/golden_set_new.jsonl"

with open(in_path, "r") as fin, open(out_path, "w") as fout:
    for line in fin:
        line = line.strip()
        if not line: continue
        data = json.loads(line)
        
        new_data = {
            "id": data["id"],
            "category": data["category"],
            "input": data["input"],
            "birth_details": data["birth_details"],
            "expected_tool_called": data["expected_tool_called"],
            "expected_behavior_description": data.get("judge_rubric", ""),
            "should_contain": data.get("expected_keywords", []),
            "should_not_contain": data.get("must_not_contain", []),
            "is_safety_test": data["category"] == "safety",
        }
        fout.write(json.dumps(new_data) + "\n")

print("Migrated 26 cases to new schema.")
os.rename(out_path, in_path)
