import json
import sys

import pytest


CONTRACT_PATH = "contracts/genlayer/IncidentConsensusGuard.py"


def mock_eval(approved, severity="high", confidence="0.91", action="pause_protocol", rationale="validator agrees"):
    return json.dumps(
        {
            "approved": approved,
            "severity": severity,
            "confidence": confidence,
            "action": action,
            "rationale": rationale,
        }
    )


def deploy_guard(direct_deploy):
    for module_name in list(sys.modules):
        if module_name == "genlayer" or module_name.startswith("genlayer."):
            del sys.modules[module_name]
    return direct_deploy(CONTRACT_PATH, sdk_version="v0.2.16")


def submit_sample(contract, incident_id="incident-1", action="pause_protocol", confidence="0.82"):
    contract.submit_incident(
        incident_id,
        "MantleSwap",
        "0x8f2a9aac",
        "Reentrancy",
        action,
        "Primary LLM detected repeated external call before balance update",
        confidence,
    )


def test_submit_and_read_incident(direct_vm, direct_deploy):
    contract = deploy_guard(direct_deploy)

    submit_sample(contract)

    incident = contract.get_incident("incident-1")
    assert incident["id"] == "incident-1"
    assert incident["protocol"] == "MantleSwap"
    assert incident["proposed_action"] == "pause_protocol"
    assert incident["status"] == "pending_consensus"
    assert incident["llm_confidence"] == "82"

    listed = contract.list_incidents()
    assert len(listed) == 1
    assert listed[0]["id"] == "incident-1"


def test_rejects_non_allowlisted_action(direct_vm, direct_deploy):
    contract = deploy_guard(direct_deploy)

    with direct_vm.expect_revert("Proposed action is not allowlisted"):
        submit_sample(contract, action="transfer_funds")


def test_evaluate_approved_incident_with_llm_consensus(direct_vm, direct_deploy):
    contract = deploy_guard(direct_deploy)
    submit_sample(contract, "incident-approved", "pause_protocol", "0.88")
    direct_vm.mock_llm(r".*decentralized incident-response validator.*", mock_eval(True, "critical", "0.93", "pause_protocol"))

    contract.evaluate_incident("incident-approved")

    incident = contract.get_incident("incident-approved")
    assert incident["approved"] is True
    assert incident["status"] == "approved"
    assert incident["severity"] == "critical"
    assert incident["consensus_confidence"] == "93"
    assert incident["consensus_action"] == "pause_protocol"


def test_low_confidence_llm_escalates_instead_of_approving(direct_vm, direct_deploy):
    contract = deploy_guard(direct_deploy)
    submit_sample(contract, "incident-low-confidence", "quarantine_address", "0.52")
    direct_vm.mock_llm(r".*decentralized incident-response validator.*", mock_eval(True, "high", "0.42", "quarantine_address"))

    contract.evaluate_incident("incident-low-confidence")

    incident = contract.get_incident("incident-low-confidence")
    assert incident["approved"] is False
    assert incident["status"] == "escalated"
    assert incident["consensus_confidence"] == "42"


def test_llm_rejection_is_stored(direct_vm, direct_deploy):
    contract = deploy_guard(direct_deploy)
    submit_sample(contract, "incident-rejected", "multisig_proposal", "0.79")
    direct_vm.mock_llm(r".*decentralized incident-response validator.*", mock_eval(False, "none", "0.86", "alert", "evidence is insufficient"))

    contract.evaluate_incident("incident-rejected")

    incident = contract.get_incident("incident-rejected")
    assert incident["approved"] is False
    assert incident["status"] == "rejected"
    assert "insufficient" in incident["consensus_reason"]


def test_mark_executed_requires_approval(direct_vm, direct_deploy):
    contract = deploy_guard(direct_deploy)
    submit_sample(contract, "incident-not-approved", "alert", "0.70")

    with direct_vm.expect_revert("Cannot execute unapproved incident"):
        contract.mark_executed("incident-not-approved")


def test_mark_executed_after_consensus_approval(direct_vm, direct_deploy):
    contract = deploy_guard(direct_deploy)
    submit_sample(contract, "incident-executed", "pause_protocol", "0.91")
    direct_vm.mock_llm(r".*decentralized incident-response validator.*", mock_eval(True, "high", "0.94", "pause_protocol"))

    contract.evaluate_incident("incident-executed")
    contract.mark_executed("incident-executed")

    incident = contract.get_incident("incident-executed")
    assert incident["executed"] is True
    assert incident["executed_at"] != ""


def test_unknown_incident_reverts(direct_vm, direct_deploy):
    contract = deploy_guard(direct_deploy)

    with direct_vm.expect_revert("Incident not found"):
        contract.evaluate_incident("missing")
