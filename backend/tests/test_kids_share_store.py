from backend.models import KidsExperienceShare
from backend.schemas import KidsExperienceAnalyzeRequest, KidsExperienceAnalyzeResponse
from backend.services.kids_share_store import create_kids_share, read_kids_share


def build_draft() -> KidsExperienceAnalyzeRequest:
    return KidsExperienceAnalyzeRequest(
        participant_name="민지",
        favorite_topics=["동물", "우주", "로봇"],
        favorite_activities=["만들기", "관찰하기"],
        frequent_activities=["레고 만들기"],
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


def build_result() -> KidsExperienceAnalyzeResponse:
    return KidsExperienceAnalyzeResponse(
        participant_name="민지",
        personality_type="상상력 발명가",
        personality_summary="새로운 생각을 떠올리고 직접 만들어보는 걸 좋아하는 스타일이에요.",
        strength_keywords=["상상력", "도전정신", "배려심"],
        recommended_jobs=[
            {
                "title": "로봇 발명가",
                "reason": "직접 만들기를 좋아해서 잘 맞아요.",
                "fit_comment": "민지는 손으로 바꾸고 만들어보는 즐거움이 커요.",
                "tags": ["로봇", "만들기"],
                "school_hint": "학교에서는 만들기 활동 아이디어를 내보세요.",
                "home_mission": "집에서는 종이 로봇을 만들어보세요.",
                "friend_fit": "만들기를 좋아하는 친구와 잘 어울려요.",
            },
            {
                "title": "우주 상상 설계자",
                "reason": "우주를 상상하고 설명하는 걸 좋아해서 잘 맞아요.",
                "fit_comment": "민지는 상상한 것을 이야기로 풀어내는 힘이 있어요.",
                "tags": ["우주", "상상하기"],
                "school_hint": "학교에서는 우주 발표를 해보세요.",
                "home_mission": "집에서는 별자리 그림을 그려보세요.",
                "friend_fit": "우주를 좋아하는 친구와 잘 어울려요.",
            },
            {
                "title": "동물 탐험 연구가",
                "reason": "동물과 관찰 활동을 좋아해서 잘 어울려요.",
                "fit_comment": "민지는 좋아하는 대상을 오래 관찰하는 힘이 보여요.",
                "tags": ["동물", "관찰하기"],
                "school_hint": "학교에서는 동물 관찰 기록을 남겨보세요.",
                "home_mission": "집에서는 동물 소개 카드를 만들어보세요.",
                "friend_fit": "동물을 좋아하는 친구와 잘 어울려요.",
            },
        ],
        suggested_activities=["동물 도감 만들기", "우주 포스터 그리기", "로봇 만들기 놀이"],
        quick_counsel={
            "why_this_fits": "좋아하는 주제와 활동이 자연스럽게 이어져요.",
            "strengths": "상상력과 도전정신이 잘 보여요.",
            "alternative_jobs": "비슷한 방향으로 과학 해설가도 있어요.",
        },
        report_sections={
            "one_line_summary": "민지는 상상력과 관찰력을 바탕으로 탐험형 배움이 잘 맞아요.",
            "profile_overview": "민지는 좋아하는 주제를 오래 붙잡고 직접 해보는 과정에서 몰입이 커지는 편이에요.",
            "strengths_summary": "좋아하는 것을 오래 바라보고 직접 해보는 힘이 있어요.",
            "home_observation_points": ["오래 집중하는지 지켜봐 주세요.", "재미있었던 장면을 다시 말하는지 봐 주세요."],
            "school_support_points": ["학교에서 관찰 기록을 해보면 좋아요.", "친구와 함께 역할을 나눠보면 좋아요."],
            "parent_message": "오늘 재미있었던 장면을 먼저 물어봐 주세요.",
            "next_talk_question": "다음에는 무엇을 직접 만들어 보고 싶은지 물어봐 주세요.",
            "hidden_potential_fields": ["생명 관찰", "창의 발명", "과학 스토리텔링"],
            "closing_message": "민지야, 좋아하는 것을 계속 해보면 더 잘 맞는 길이 보일 거야.",
        },
        fallback_used=False,
    )


class FakeQuery:
    def __init__(self, values: dict[str, KidsExperienceShare]):
        self.values = values
        self.token = ""

    def filter_by(self, **kwargs):
        self.token = kwargs.get("share_token", "")
        return self

    def first(self):
        return self.values.get(self.token)


class FakeSession:
    def __init__(self):
        self.values: dict[str, KidsExperienceShare] = {}
        self.added: KidsExperienceShare | None = None

    def add(self, item: KidsExperienceShare):
        self.added = item
        self.values[item.share_token] = item

    def commit(self):
        return None

    def refresh(self, item: KidsExperienceShare):
        return None

    def query(self, model):
        assert model is KidsExperienceShare
        return FakeQuery(self.values)


def test_create_kids_share_persists_report_in_database(monkeypatch):
    monkeypatch.setattr("backend.services.kids_share_store.create_share_token", lambda: "db-share-token")
    session = FakeSession()

    token = create_kids_share(session, build_draft(), build_result())

    assert token == "db-share-token"
    assert session.added is not None
    assert session.added.share_token == "db-share-token"
    assert session.added.participant_name == "민지"
    assert session.added.result_payload["personality_type"] == "상상력 발명가"


def test_read_kids_share_restores_saved_report_from_database():
    session = FakeSession()
    saved_share = KidsExperienceShare(
        share_token="db-share-token",
        participant_name="민지",
        draft_payload=build_draft().model_dump(mode="json"),
        result_payload=build_result().model_dump(mode="json"),
    )
    session.values["db-share-token"] = saved_share

    response = read_kids_share(session, "db-share-token")

    assert response.token == "db-share-token"
    assert response.draft.participant_name == "민지"
    assert response.result.personality_type == "상상력 발명가"
