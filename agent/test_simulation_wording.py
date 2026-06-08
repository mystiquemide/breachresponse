import pathlib


def test_ui_simulation_does_not_claim_real_broadcast_or_registry_mutation():
    source = pathlib.Path(__file__).with_name("main.py").read_text()

    simulation_start = source.index("# Every 12 steps, simulate an anomaly alert")
    simulation_end = source.index("time.sleep", simulation_start)
    simulation_block = source[simulation_start:simulation_end]

    forbidden_phrases = [
        "Executing defensive payload action",
        "Transaction broadcasted",
        "Registry state updated",
        "MITIGATED",
    ]

    for phrase in forbidden_phrases:
        assert phrase not in simulation_block

    assert "SIMULATION" in simulation_block
    assert "PROPOSED" in simulation_block
    assert "operator approval" in simulation_block.lower()
