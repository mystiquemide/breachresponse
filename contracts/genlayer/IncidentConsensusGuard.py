# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


ERROR_EXPECTED = "[EXPECTED]"
ERROR_LLM = "[LLM_ERROR]"
ERROR_TRANSIENT = "[TRANSIENT]"

SEVERITY_WEIGHTS = {
    "none": 0,
    "low": 1,
    "medium": 2,
    "high": 3,
    "critical": 4,
}

ALLOWED_ACTIONS = {
    "monitor_only": True,
    "alert": True,
    "pause_protocol": True,
    "quarantine_address": True,
    "multisig_proposal": True,
}


class IncidentConsensusGuard(gl.Contract):
    owner: Address
    operator: Address
    incidents: TreeMap[str, str]
    incident_ids: TreeMap[str, str]
    incident_count: u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.operator = gl.message.sender_address
        self.incident_count = u256(0)

    def _require_operator(self):
        sender = gl.message.sender_address
        if sender != self.owner and sender != self.operator:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only owner or operator can call this method")

    def _normalize_confidence(self, raw) -> int:
        try:
            value = int(float(str(raw).strip()) * 100)
        except Exception:
            value = 0
        if value < 0:
            return 0
        if value > 100:
            return 100
        return value

    def _normalize_severity(self, raw) -> str:
        severity = str(raw).strip().lower()
        if severity not in SEVERITY_WEIGHTS:
            return "none"
        return severity

    def _normalize_action(self, raw) -> str:
        action = str(raw).strip().lower()
        if action not in ALLOWED_ACTIONS:
            return "reject"
        return action

    def _require_incident(self, incident_id: str) -> dict:
        if incident_id not in self.incidents:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Incident not found")
        return json.loads(self.incidents[incident_id])

    def _store_incident(self, incident: dict):
        self.incidents[incident["id"]] = json.dumps(incident)

    def _normalize_assessment(self, raw, proposed_action: str) -> dict:
        if not isinstance(raw, dict):
            raise gl.vm.UserError(f"{ERROR_LLM} LLM response must be a JSON object")

        approved = bool(raw.get("approved", False))
        severity = self._normalize_severity(raw.get("severity", "none"))
        confidence = self._normalize_confidence(raw.get("confidence", "0"))
        action = self._normalize_action(raw.get("action", proposed_action))
        rationale = str(raw.get("rationale", ""))[:600]

        if action == "reject":
            approved = False
        if confidence < 70:
            approved = False
            action = "multisig_proposal"
            rationale = "LLM confidence below autonomous threshold. Escalate to human or multisig approval. " + rationale
        if approved and action not in ALLOWED_ACTIONS:
            approved = False
            action = "multisig_proposal"

        return {
            "approved": approved,
            "severity": severity,
            "confidence": str(confidence),
            "action": action,
            "rationale": rationale,
        }

    def _handle_leader_error(self, leaders_res, leader_fn) -> bool:
        leader_msg = getattr(leaders_res, "message", "")
        try:
            leader_fn()
            return False
        except gl.vm.UserError as e:
            validator_msg = getattr(e, "message", str(e))
            if validator_msg.startswith(ERROR_EXPECTED):
                return validator_msg == leader_msg
            if validator_msg.startswith(ERROR_TRANSIENT) and leader_msg.startswith(ERROR_TRANSIENT):
                return True
            return False
        except Exception:
            return False

    @gl.public.write
    def set_operator(self, operator: Address):
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Only owner can set operator")
        self.operator = operator

    @gl.public.write
    def submit_incident(
        self,
        incident_id: str,
        protocol: str,
        tx_hash: str,
        threat_type: str,
        proposed_action: str,
        llm_reasoning: str,
        confidence: str,
    ) -> str:
        self._require_operator()

        incident_id = incident_id.strip()
        if not incident_id:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Incident id cannot be empty")
        if incident_id in self.incidents:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Incident already exists")

        action = self._normalize_action(proposed_action)
        if action == "reject":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Proposed action is not allowlisted")

        self.incident_count += u256(1)
        incident = {
            "id": incident_id,
            "index": str(int(self.incident_count)),
            "submitter": gl.message.sender_address.as_hex,
            "protocol": protocol[:120],
            "tx_hash": tx_hash[:120],
            "threat_type": threat_type[:80],
            "proposed_action": action,
            "llm_reasoning": llm_reasoning[:800],
            "llm_confidence": str(self._normalize_confidence(confidence)),
            "status": "pending_consensus",
            "approved": False,
            "consensus_action": "none",
            "severity": "none",
            "consensus_confidence": "0",
            "consensus_reason": "",
            "executed": False,
            "created_at": gl.message_raw["datetime"],
            "evaluated_at": "",
            "executed_at": "",
        }
        self._store_incident(incident)
        self.incident_ids[str(int(self.incident_count))] = incident_id
        return incident_id

    @gl.public.write
    def evaluate_incident(self, incident_id: str) -> dict:
        self._require_operator()
        incident = self._require_incident(incident_id)
        if incident["status"] == "executed":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Incident already executed")

        def leader_fn():
            prompt = f"""You are a decentralized incident-response validator for a Web3 security system.

Incident id: {incident['id']}
Protocol: {incident['protocol']}
Suspicious tx hash: {incident['tx_hash']}
Threat type: {incident['threat_type']}
Proposed action: {incident['proposed_action']}
Primary LLM confidence 0-100: {incident['llm_confidence']}
Primary LLM reasoning: {incident['llm_reasoning']}

Allowed actions: monitor_only, alert, pause_protocol, quarantine_address, multisig_proposal.
Reject any action outside that list. Reject fund movement, withdrawals, ownership transfer, broad approvals, or irreversible execution.
If primary confidence is below 70, do not autonomously approve. Escalate to multisig_proposal.

Return JSON with:
- approved: boolean
- severity: one of none, low, medium, high, critical
- confidence: integer 0-100
- action: one allowed action
- rationale: short reason"""
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return self._normalize_assessment(raw, incident["proposed_action"])

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return self._handle_leader_error(leaders_res, leader_fn)

            validator_result = leader_fn()
            leader_data = leaders_res.calldata if isinstance(leaders_res.calldata, dict) else {}
            validator_data = validator_result if isinstance(validator_result, dict) else {}

            if bool(leader_data.get("approved", False)) != bool(validator_data.get("approved", False)):
                return False
            if str(leader_data.get("action", "")) != str(validator_data.get("action", "")):
                return False

            leader_severity = SEVERITY_WEIGHTS.get(str(leader_data.get("severity", "none")), 0)
            validator_severity = SEVERITY_WEIGHTS.get(str(validator_data.get("severity", "none")), 0)
            if abs(leader_severity - validator_severity) > 1:
                return False

            leader_confidence = int(str(leader_data.get("confidence", "0")))
            validator_confidence = int(str(validator_data.get("confidence", "0")))
            if abs(leader_confidence - validator_confidence) > 20:
                return False

            if incident["proposed_action"] not in ALLOWED_ACTIONS:
                return False
            if int(str(incident["llm_confidence"])) < 70 and bool(leader_data.get("approved", False)):
                return False

            return True

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        if isinstance(result, dict):
            assessment = result
        elif isinstance(result, gl.vm.Return) and isinstance(result.calldata, dict):
            assessment = result.calldata
        else:
            raise gl.vm.UserError(f"{ERROR_LLM} Consensus failed")

        incident["approved"] = bool(assessment["approved"])
        incident["status"] = "approved" if incident["approved"] else "rejected"
        if assessment["action"] == "multisig_proposal" and not incident["approved"]:
            incident["status"] = "escalated"
        incident["consensus_action"] = assessment["action"]
        incident["severity"] = assessment["severity"]
        incident["consensus_confidence"] = str(assessment["confidence"])
        incident["consensus_reason"] = assessment["rationale"]
        incident["evaluated_at"] = gl.message_raw["datetime"]
        self._store_incident(incident)
        return assessment

    @gl.public.write
    def mark_executed(self, incident_id: str) -> bool:
        self._require_operator()
        incident = self._require_incident(incident_id)
        if not bool(incident.get("approved", False)):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Cannot execute unapproved incident")
        incident["executed"] = True
        incident["status"] = "executed"
        incident["executed_at"] = gl.message_raw["datetime"]
        self._store_incident(incident)
        return True

    @gl.public.view
    def get_incident(self, incident_id: str) -> dict:
        if incident_id not in self.incidents:
            return {"error": "not_found"}
        return json.loads(self.incidents[incident_id])

    @gl.public.view
    def list_incidents(self, limit: int = 20) -> list:
        results = []
        count = int(self.incident_count)
        start = max(1, count - limit + 1)
        for i in range(start, count + 1):
            key = str(i)
            if key in self.incident_ids:
                incident_id = self.incident_ids[key]
                if incident_id in self.incidents:
                    results.append(json.loads(self.incidents[incident_id]))
        return results

    @gl.public.view
    def get_stats(self) -> dict:
        count = int(self.incident_count)
        approved = 0
        rejected = 0
        escalated = 0
        executed = 0
        for i in range(1, count + 1):
            key = str(i)
            if key in self.incident_ids:
                incident_id = self.incident_ids[key]
                data = json.loads(self.incidents[incident_id])
                if data.get("status") == "approved":
                    approved += 1
                elif data.get("status") == "rejected":
                    rejected += 1
                elif data.get("status") == "escalated":
                    escalated += 1
                elif data.get("status") == "executed":
                    executed += 1
        return {
            "total": count,
            "approved": approved,
            "rejected": rejected,
            "escalated": escalated,
            "executed": executed,
        }
