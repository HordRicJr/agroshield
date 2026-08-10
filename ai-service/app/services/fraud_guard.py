"""Point d'entrée Fraud Guard — délègue au package fraud/."""

from app.schemas.fraud import AnalyzeMessageRequest, AnalyzeMessageResponse
from app.services.fraud.service import analyze_message as _analyze


async def analyze_message(request: AnalyzeMessageRequest) -> AnalyzeMessageResponse:
    return await _analyze(request)
