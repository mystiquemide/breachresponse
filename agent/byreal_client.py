import os
import json
import time
from openai import OpenAI

class ByrealClient:
    def __init__(self, api_key: str = None):
        # We assume the user passes the API key or sets OPENAI_API_KEY
        # Since main.py passes BYREAL_API_KEY initially, we'll check OPENAI_API_KEY
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            print("[BYREAL] Warning: OPENAI_API_KEY not found in environment. Using fallback mock mode.")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
            print(f"[BYREAL] Initialized OpenAI GPT-5.5 Client")
            
        self.last_analysis = {}

    def analyze_exploit_payload(self, tx_calldata: str) -> float:
        """
        Uses OpenAI to analyze a transaction calldata for exploits.
        Returns a threat confidence score between 0.0 and 1.0.
        """
        if not self.client:
            # Fallback mock logic if no API key
            if "0x2e1a7d4d" in tx_calldata.lower() or "withdraw" in tx_calldata.lower() or "reentrant" in tx_calldata.lower() or "multiple" in tx_calldata.lower():
                self.last_analysis = {
                    "is_exploit": True,
                    "confidence_score": 0.98,
                    "exploit_type": "Reentrancy",
                    "recommended_calldata": "0x8456cb59"
                }
                return 0.98
            return 0.01

        prompt = f"""
You are a Web3 Security Auditor. Analyze the following transaction activity or calldata.
Determine if it is an exploit. If it is an exploit, recommend the emergency pause calldata.
Assume the target contract implements `IPausable.pause()` with keccak256 selector `0x8456cb59`.

Input Data:
{tx_calldata}

Respond strictly in JSON format matching this schema:
{{
  "is_exploit": boolean,
  "confidence_score": float (0.0 to 1.0),
  "exploit_type": string,
  "recommended_calldata": string
}}
"""

        try:
            print("[BYREAL-LLM] Requesting exploit analysis from GPT-5.5...")
            response = self.client.chat.completions.create(
                model="gpt-5.5",
                messages=[
                    {"role": "system", "content": "You are a smart contract active-defense AI."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0.0
            )
            
            result = json.loads(response.choices[0].message.content)
            self.last_analysis = result
            print(f"[BYREAL-LLM] GPT-5.5 Analysis Response:\n{json.dumps(result, indent=2)}")
            return float(result.get("confidence_score", 0.0))
            
        except Exception as e:
            print(f"[BYREAL-LLM] API Error: {e}. Falling back to 0 score.")
            return 0.0

    def formulate_rescue_transaction(self, target_address: str, exploit_type: str) -> dict:
        """
        Formulates the defensive transaction parameters based on LLM output.
        """
        print(f"\n[BYREAL-AGENT] !!! THREAT DETECTED: {exploit_type} on {target_address} !!!")
        print(f"[BYREAL-AGENT] Retrieving dynamic payload from LLM analysis...")
        time.sleep(0.5)
        
        pause_calldata = self.last_analysis.get("recommended_calldata", "0x8456cb59")
        
        print(f"[BYREAL-AGENT] Mitigation payload generated: {pause_calldata}")
        print(f"[BYREAL-AGENT] Recommended Action: Send pause transaction immediately.")
        
        return {
            "to": target_address,
            "data": pause_calldata,
            "gas_limit": 120000,
            "description": f"Emergency mitigation for {exploit_type}"
        }
