from fastapi.testclient import TestClient
import fitz

from backend.main import app


client = TestClient(app)


def test_create_kids_report_returns_pdf():
    response = client.post(
        "/api/kids-experience/report",
        json={
            "draft": {
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
            "result": {
                "participant_name": "민지",
                "personality_type": "상상력 발명가",
                "personality_summary": "새로운 아이디어를 떠올리고 직접 만들어보는 걸 좋아하는 스타일이에요.",
                "strength_keywords": ["상상력", "도전정신", "배려심"],
                "recommended_jobs": [
                    {
                        "title": "동물 수의사",
                        "reason": "동물을 좋아하고 자세히 관찰하는 모습이 보여요.",
                        "fit_comment": "동물을 세심하게 살피는 민지의 모습이 이 직업과 특히 닮아 있어요.",
                        "tags": ["동물", "관찰하기"],
                        "school_hint": "학교에서는 동물 관찰 일지를 써보면 좋아요.",
                        "home_mission": "집에서는 좋아하는 동물을 소개하는 카드를 만들어봐요.",
                        "friend_fit": "동물을 아끼고 차분히 살피는 친구에게 잘 어울려요.",
                    },
                    {
                        "title": "우주 과학자",
                        "reason": "우주에 대한 호기심이 커서 잘 어울려요.",
                        "fit_comment": "궁금한 것을 그냥 지나치지 않는 민지의 성향이 우주 탐험과 잘 어울려요.",
                        "tags": ["우주", "호기심"],
                        "school_hint": "학교에서는 우주 주제 발표를 해보면 좋아요.",
                        "home_mission": "집에서는 별자리 그림을 그려봐요.",
                        "friend_fit": "궁금한 것이 생기면 끝까지 찾아보는 친구에게 잘 어울려요.",
                    },
                    {
                        "title": "로봇 발명가",
                        "reason": "직접 만들고 실험하는 걸 좋아해서 잘 맞아요.",
                        "fit_comment": "생각한 것을 손으로 만들어보는 민지의 즐거움이 로봇 발명과 이어질 수 있어요.",
                        "tags": ["로봇", "만들기"],
                        "school_hint": "학교에서는 만들기 활동 시간에 아이디어를 내보면 좋아요.",
                        "home_mission": "집에서는 레고나 종이로 움직이는 것을 만들어봐요.",
                        "friend_fit": "손으로 직접 만들고 고치는 걸 좋아하는 친구에게 잘 어울려요.",
                    },
                ],
                "suggested_activities": ["동물 도감 만들기", "우주 그림일기 쓰기", "레고 로봇 만들기"],
                "quick_counsel": {
                    "why_this_fits": "좋아하는 주제와 활동이 자연스럽게 이어지고 있어요.",
                    "strengths": "상상력과 도전정신이 큰 강점이에요.",
                    "alternative_jobs": "비슷한 직업으로 생태 해설가도 있어요.",
                },
                "report_sections": {
                    "one_line_summary": "민지는 상상력과 관찰력을 바탕으로 동물과 로봇을 연결하는 탐험형 배움이 잘 맞아요.",
                    "profile_overview": "민지는 좋아하는 주제를 오래 붙잡고, 직접 만들어 보거나 자세히 살피는 과정에서 몰입이 커지는 편이에요. 새로운 생각이 떠오르면 바로 해보고 싶어 하는 힘도 함께 보여요.",
                    "strengths_summary": "민지는 좋아하는 것을 오래 붙잡고, 떠오른 생각을 직접 해보며 배워가는 힘이 보여요.",
                    "home_observation_points": [
                        "레고나 만들기 활동을 할 때 얼마나 오래 몰입하는지 지켜봐 주세요.",
                        "무엇이 재미있었는지 먼저 설명하는지 살펴봐 주세요.",
                    ],
                    "school_support_points": [
                        "학교에서는 관찰 기록이나 발표 활동으로 자신감을 키워주면 좋아요.",
                        "친구와 함께하는 프로젝트에서 어떤 역할을 편해하는지 봐주면 좋아요.",
                    ],
                    "parent_message": "부모님은 결과를 정답처럼 묻기보다, 오늘 가장 재미있었던 장면을 다시 물어봐 주시면 좋아요.",
                    "next_talk_question": "다음에는 동물, 우주, 로봇 중 어떤 걸 직접 만들어 보고 싶은지 이야기해 보세요.",
                    "hidden_potential_fields": ["생명 관찰", "창의 발명", "과학 스토리텔링"],
                    "closing_message": "민지야, 좋아하는 것을 계속 해보는 동안 너에게 잘 맞는 길이 더 또렷해질 거야.",
                },
                "fallback_used": True,
            },
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")

    document = fitz.open(stream=response.content, filetype="pdf")
    report_text = "\n".join(page.get_text() for page in document)
    document.close()

    assert "길잡이 초등 진로 체험 리포트" in report_text
    assert "민지의 진로 상담 한눈에 보기" in report_text
    assert "오늘의 상담 한 줄 총평" in report_text
    assert "상담 선생님이 본 전체 모습" in report_text
    assert "민지는 좋아하는 주제를 오래 붙잡고" in report_text
    assert "새로운 생각이 떠오르면 바로 해보고 싶어 하는 힘도 함께 보여요." in report_text
    assert "상담 선생님이 본 강점" in report_text
    assert "학교에서 이렇게 해봐요" in report_text
    assert "상담 선생님 한마디" in report_text
    assert "집에서는 이렇게 놀아봐요" in report_text
    assert "이런 친구에게 잘 어울려요" in report_text
    assert "상담 선생님 정리 노트" in report_text
    assert "가장 잘 맞는 이유" in report_text
    assert "강점이 드러난 장면" in report_text
    assert "비슷한 가능성" in report_text
    assert "집에서 이렇게 지켜봐 주세요" in report_text
    assert "학교에서 이렇게 응원해 주세요" in report_text
    assert "부모님께 먼저 전하는 말" in report_text
    assert "다음 대화 시작 질문" in report_text
    assert "숨은 가능성 분야" in report_text
    assert "생명 관찰" in report_text
    assert "민지에게 전하는 한마디" in report_text
    assert "다음에 해보면 좋은 활동" in report_text
    assert "요즘 자주 하는 활동" in report_text
    assert "편한 활동 방식" in report_text
    assert "좋아하는 결과 방식" in report_text
    assert "뿌듯했던 순간" in report_text
    assert "이번 상담에 함께 반영된 아이의 모습" in report_text
