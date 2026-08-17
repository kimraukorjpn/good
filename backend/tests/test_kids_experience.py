import asyncio
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas import KidsExperienceAnalyzeRequest
from backend.services import kids_experience


client = TestClient(app)


def test_analyze_kids_experience_returns_fallback_result():
    response = client.post(
        "/api/kids-experience/analyze",
        json={
            "participant_name": "민지",
            "favorite_topics": ["동물", "우주", "로봇"],
            "favorite_activities": ["만들기", "관찰하기"],
            "frequent_activities": ["레고 만들기", "그림 그리기"],
            "comfort_style": "혼자 천천히",
            "preferred_outcome_types": ["작품 만들기"],
            "proud_moment_type": "내가 만든 걸 보여줬을 때",
            "free_text_note": "강아지 돌보기",
            "personality_answers": {
                "social_style": "친구와 함께 이야기하기",
                "start_style": "바로 해보는 편",
                "expression_style": "직접 만들어 보여주기",
                "idea_style": "상상하고 새로 떠올리기",
                "plan_style": "생각나는 대로 해보기",
                "care_style": "사람 도와주기",
                "challenge_style": "새로운 것 도전하기",
                "speed_style": "신나게 빠르게",
            },
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["participant_name"] == "민지"
    assert len(payload["recommended_jobs"]) == 3
    assert payload["report_sections"]["one_line_summary"]
    assert payload["report_sections"]["profile_overview"]
    assert payload["report_sections"]["strengths_summary"]
    assert len(payload["report_sections"]["home_observation_points"]) >= 2
    assert len(payload["report_sections"]["school_support_points"]) >= 2
    assert payload["report_sections"]["parent_message"]
    assert payload["report_sections"]["next_talk_question"]
    assert len(payload["report_sections"]["hidden_potential_fields"]) >= 2
    assert payload["report_sections"]["closing_message"]
    first_job = payload["recommended_jobs"][0]
    assert first_job["fit_comment"]
    assert first_job["school_hint"]
    assert first_job["home_mission"]
    assert first_job["friend_fit"]
    assert payload["fallback_used"] is True


def test_analyze_kids_experience_rejects_too_few_topics():
    response = client.post(
        "/api/kids-experience/analyze",
        json={
            "participant_name": "민지",
            "favorite_topics": ["동물", "우주"],
            "favorite_activities": ["만들기", "관찰하기"],
            "frequent_activities": ["레고 만들기"],
            "comfort_style": "혼자 천천히",
            "preferred_outcome_types": ["작품 만들기"],
            "proud_moment_type": "내가 만든 걸 보여줬을 때",
            "free_text_note": "",
            "personality_answers": {
                "social_style": "친구와 함께 이야기하기",
                "start_style": "바로 해보는 편",
                "expression_style": "직접 만들어 보여주기",
                "idea_style": "상상하고 새로 떠올리기",
                "plan_style": "생각나는 대로 해보기",
                "care_style": "사람 도와주기",
                "challenge_style": "새로운 것 도전하기",
                "speed_style": "신나게 빠르게",
            },
        },
    )

    assert response.status_code == 422


def test_maybe_generate_with_ai_uses_apim_when_configured(monkeypatch):
    request = KidsExperienceAnalyzeRequest(
        participant_name="민지",
        favorite_topics=["동물", "우주", "로봇"],
        favorite_activities=["만들기", "관찰하기"],
        frequent_activities=["레고 만들기", "그림 그리기"],
        comfort_style="혼자 천천히",
        preferred_outcome_types=["작품 만들기"],
        proud_moment_type="내가 만든 걸 보여줬을 때",
        free_text_note="강아지 돌보기",
        personality_answers={
            "social_style": "친구와 함께 이야기하기",
            "start_style": "바로 해보는 편",
            "expression_style": "직접 만들어 보여주기",
            "idea_style": "상상하고 새로 떠올리기",
            "plan_style": "생각나는 대로 해보기",
            "care_style": "사람 도와주기",
            "challenge_style": "새로운 것 도전하기",
            "speed_style": "신나게 빠르게",
        },
    )

    monkeypatch.setattr(kids_experience, "APIM_BASE_URL", "https://example-apim.test/foundry")
    monkeypatch.setattr(kids_experience, "APIM_KEY", "test-key")
    monkeypatch.setattr(kids_experience, "CHAT_MODEL", "gpt-test")

    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": """{
                                "participant_name": "민지",
                                "personality_type": "상상력 발명가",
                                "personality_summary": "AI가 민지의 답변을 바탕으로 정리한 성향 요약이에요.",
                                "strength_keywords": ["상상력", "관찰력", "도전정신"],
                                "recommended_jobs": [
                                    {
                                        "title": "동물 탐험 연구가",
                                        "reason": "동물과 관찰 활동을 좋아해서 잘 어울려요.",
                                        "fit_comment": "민지는 좋아하는 대상을 오래 관찰하는 힘이 보여요.",
                                        "tags": ["동물", "관찰하기"],
                                        "school_hint": "학교에서는 동물 관찰 기록을 남겨보세요.",
                                        "home_mission": "집에서는 동물 소개 카드를 만들어보세요.",
                                        "friend_fit": "동물을 좋아하는 친구와 잘 어울려요."
                                    },
                                    {
                                        "title": "우주 상상 설계자",
                                        "reason": "우주를 상상하고 설명하는 걸 좋아해서 잘 맞아요.",
                                        "fit_comment": "민지는 상상한 것을 이야기로 풀어내는 힘이 있어요.",
                                        "tags": ["우주", "상상하기"],
                                        "school_hint": "학교에서는 우주 발표를 해보세요.",
                                        "home_mission": "집에서는 별자리 그림을 그려보세요.",
                                        "friend_fit": "우주를 좋아하는 친구와 잘 어울려요."
                                    },
                                    {
                                        "title": "로봇 발명가",
                                        "reason": "직접 만들기를 좋아해서 잘 맞아요.",
                                        "fit_comment": "민지는 손으로 바꾸고 만들어보는 즐거움이 커요.",
                                        "tags": ["로봇", "만들기"],
                                        "school_hint": "학교에서는 만들기 활동 아이디어를 내보세요.",
                                        "home_mission": "집에서는 종이 로봇을 만들어보세요.",
                                        "friend_fit": "만들기를 좋아하는 친구와 잘 어울려요."
                                    }
                                ],
                                "suggested_activities": ["동물 도감 만들기", "우주 포스터 그리기", "로봇 만들기 놀이"],
                                "quick_counsel": {
                                    "why_this_fits": "좋아하는 주제와 활동이 자연스럽게 이어져요.",
                                    "strengths": "상상력과 관찰력이 잘 보여요.",
                                    "alternative_jobs": "비슷한 방향으로 과학 해설가도 있어요."
                                },
                                "report_sections": {
                                    "one_line_summary": "민지는 상상력과 관찰력을 바탕으로 탐험형 배움이 잘 맞아요.",
                                    "profile_overview": "민지는 좋아하는 주제를 오래 붙잡고 직접 해보는 과정에서 몰입이 커지는 편이에요.",
                                    "strengths_summary": "좋아하는 것을 오래 바라보고 직접 해보는 힘이 있어요.",
                                    "home_observation_points": ["오래 집중하는지 지켜봐 주세요.", "재미있었던 장면을 다시 말하는지 봐 주세요."],
                                    "school_support_points": ["학교에서 관찰 기록을 해보면 좋아요.", "친구와 함께 역할을 나눠보면 좋아요."],
                                    "parent_message": "오늘 재미있었던 장면을 먼저 물어봐 주세요.",
                                    "next_talk_question": "다음에는 무엇을 직접 만들어 보고 싶은지 물어봐 주세요.",
                                    "hidden_potential_fields": ["생명 관찰", "창의 발명", "과학 스토리텔링"],
                                    "closing_message": "민지야, 좋아하는 것을 계속 해보면 더 잘 맞는 길이 보일 거야."
                                },
                                "fallback_used": true
                            }"""
                        }
                    }
                ]
            }

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            return None

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, headers=None, json=None):
            captured["url"] = url
            captured["headers"] = headers
            captured["json"] = json
            return FakeResponse()

    monkeypatch.setattr(kids_experience.httpx, "AsyncClient", FakeAsyncClient)

    result = asyncio.run(kids_experience.maybe_generate_with_ai(request))

    assert captured["url"] == "https://example-apim.test/foundry/gpt-test/chat/completions"
    assert captured["headers"] == {"api-key": "test-key", "Content-Type": "application/json"}
    assert captured["json"]["response_format"] == {"type": "json_object"}
    assert "초등학생 행사 체험용 진로 안내 도우미" in captured["json"]["messages"][0]["content"]
    assert "recommended_jobs는 정확히 3개" in captured["json"]["messages"][0]["content"]
    assert "report_sections의 one_line_summary, profile_overview" in captured["json"]["messages"][0]["content"]
    assert "보호자가 바로 이해할 수 있는 상담 문장" in captured["json"]["messages"][0]["content"]
    assert "직업 이름만 나열하지 말고" in captured["json"]["messages"][0]["content"]
    assert '"frequent_activities": ["레고 만들기", "그림 그리기"]' in captured["json"]["messages"][1]["content"]
    assert '"comfort_style": "혼자 천천히"' in captured["json"]["messages"][1]["content"]
    assert result.fallback_used is False
    assert result.report_sections.parent_message
    assert result.report_sections.profile_overview
    assert result.report_sections.hidden_potential_fields
    assert result.recommended_jobs[0].fit_comment


def test_fallback_suggested_activities_are_varied_and_not_poster_only():
    request = KidsExperienceAnalyzeRequest(
        participant_name="민지",
        favorite_topics=["동물", "우주", "로봇"],
        favorite_activities=["만들기", "관찰하기"],
        frequent_activities=["레고 만들기", "그림 그리기"],
        comfort_style="혼자 천천히",
        preferred_outcome_types=["작품 만들기"],
        proud_moment_type="내가 만든 걸 보여줬을 때",
        free_text_note="강아지 돌보기",
        personality_answers={
            "social_style": "친구와 함께 이야기하기",
            "start_style": "바로 해보는 편",
            "expression_style": "직접 만들어 보여주기",
            "idea_style": "상상하고 새로 떠올리기",
            "plan_style": "생각나는 대로 해보기",
            "care_style": "사람 도와주기",
            "challenge_style": "새로운 것 도전하기",
            "speed_style": "신나게 빠르게",
        },
    )

    result = kids_experience.build_fallback_result(request)

    assert len(result.suggested_activities) == 3
    assert len(set(result.suggested_activities)) == 3
    assert any("미니 포스터 만들기" not in activity for activity in result.suggested_activities)
    assert any("관찰" in activity or "살펴" in activity for activity in result.suggested_activities)
    assert any("작품" in activity or "결과물" in activity or "만들기" in activity for activity in result.suggested_activities)
