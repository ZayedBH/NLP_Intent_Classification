def test_grouped_split_keeps_similar_templates_together():
    from scripts.train import grouped_split
    rows = []
    for label in ["track_order", "cancel_order"]:
        for i in range(40):
            rows.extend([{"text": f"{label} phrase {chr(97+i//26)}{chr(97+i%26)} {{\u007bOrder ID}}", "label": label},
                         {"text": f"{label} phrase {chr(97+i//26)}{chr(97+i%26)} {{\u007bOrder Number}}!", "label": label}])
    train, validation, test = grouped_split(rows)
    from intentlab.nlp import template_key
    groups = [{template_key(r["text"]) for r in split} for split in [train, validation, test]]
    assert not groups[0] & groups[1]
    assert not groups[0] & groups[2]
    assert not groups[1] & groups[2]
    assert all({r["label"] for r in split} == {"track_order", "cancel_order"} for split in [train, validation, test])
