import json
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

from backend.schemas import KidsExperienceAnalyzeRequest, KidsExperienceAnalyzeResponse

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

APIM_BASE_URL = os.getenv("APIM_BASE_URL", "").rstrip("/")
APIM_KEY = os.getenv("APIM_KEY", "")
CHAT_MODEL = os.getenv("CHAT_MODEL", "")

PERSONALITY_ARCHETYPES = {
    "상상력 발명가": {"creative": 2, "maker": 2, "curious": 1},
    "꼼꼼한 관찰자": {"careful": 2, "observer": 2, "curious": 1},
    "다정한 협력가": {"helper": 2, "social": 2, "steady": 1},
    "문제 해결사": {"solver": 2, "challenger": 2, "fast": 1},
    "호기심 탐험가": {"curious": 2, "challenger": 1, "social": 1},
}

TOPIC_JOB_MAP = {
    "동물": [("동물 수의사", ["동물", "관찰하기"]), ("동물 행동 연구원", ["동물", "탐구"])],
    "우주": [("우주 과학자", ["우주", "호기심"]), ("천문관 해설사", ["우주", "설명하기"])],
    "공룡": [("고생물학자", ["탐구", "관찰하기"]), ("박물관 큐레이터", ["공룡", "이야기"])],
    "로봇": [("로봇 발명가", ["로봇", "만들기"]), ("메이커 교육 선생님", ["로봇", "설명하기"])],
    "발명": [("제품 디자이너", ["발명", "상상하기"]), ("창의 공학자", ["발명", "도전"])],
    "그림": [("일러스트레이터", ["그림", "꾸미기"]), ("그림책 작가", ["그림", "이야기"])],
    "음악": [("음악 콘텐츠 제작자", ["음악", "표현"]), ("공연 기획자", ["음악", "협동"])],
    "운동": [("스포츠 코치", ["운동", "몸으로 움직이기"]), ("운동 분석가", ["운동", "관찰"])],
    "요리": [("푸드 크리에이터", ["요리", "만들기"]), ("셰프", ["요리", "도전"])],
    "자연": [("생태 해설가", ["자연", "관찰하기"]), ("환경 탐험가", ["자연", "탐구"])],
    "게임·컴퓨터": [("게임 기획자", ["게임·컴퓨터", "문제 풀기"]), ("소프트웨어 발명가", ["컴퓨터", "만들기"])],
    "사람 돕기": [("상담 선생님", ["사람 돕기", "친구와 함께하기"]), ("보건 선생님", ["도움", "배려"])],
    "이야기 만들기": [("동화 작가", ["이야기", "상상하기"]), ("애니메이션 기획자", ["이야기", "표현"])],
    "실험하기": [("과학 실험 연구원", ["실험", "관찰하기"]), ("발명 연구소 탐구가", ["실험", "도전"])],
}

ACTIVITY_HINTS = {
    "만들기": "직접 손으로 만들며 배우는 힘이 커요.",
    "관찰하기": "작은 차이를 찾아내는 관찰력이 좋아요.",
    "발표하기": "생각을 또박또박 전하는 표현력이 보여요.",
    "친구와 함께하기": "친구와 힘을 합치는 협동력이 커요.",
    "문제 풀기": "문제를 차근차근 해결하는 힘이 있어요.",
    "상상하기": "새로운 생각을 떠올리는 상상력이 풍부해요.",
    "몸으로 움직이기": "직접 움직이며 배우는 에너지가 커요.",
    "꾸미기": "예쁘고 재미있게 표현하는 감각이 있어요.",
    "설명하기": "다른 사람에게 쉽게 알려주는 힘이 보여요.",
    "도와주기": "주변 사람을 살피고 챙기는 따뜻함이 있어요.",
}

TAG_SCHOOL_HINTS = {
    "관찰하기": "학교에서는 관찰 일지나 탐구 노트를 써보면 좋아요.",
    "만들기": "학교에서는 만들기 시간에 직접 아이디어를 내보면 좋아요.",
    "호기심": "학교에서는 궁금한 것을 질문 카드로 적어보면 좋아요.",
    "설명하기": "학교에서는 발표 시간에 친구들에게 쉽게 알려줘보면 좋아요.",
    "상상하기": "학교에서는 상상한 이야기를 그림이나 글로 표현해보면 좋아요.",
}

TAG_HOME_MISSIONS = {
    "관찰하기": "집에서는 좋아하는 것을 자세히 보고 그림이나 메모로 남겨봐요.",
    "만들기": "집에서는 종이, 블록, 레고로 작은 작품을 만들어봐요.",
    "호기심": "집에서는 궁금한 주제를 정해서 책이나 영상으로 찾아봐요.",
    "설명하기": "집에서는 가족에게 오늘 알게 된 것을 1분 동안 설명해봐요.",
    "상상하기": "집에서는 상상한 장면을 만화나 카드로 만들어봐요.",
}

TAG_FRIEND_FIT = {
    "관찰하기": "차분하게 보고 작은 차이도 잘 찾는 친구에게 잘 어울려요.",
    "만들기": "손으로 직접 만들고 고치는 걸 좋아하는 친구에게 잘 어울려요.",
    "호기심": "궁금한 게 생기면 끝까지 알아보는 친구에게 잘 어울려요.",
    "설명하기": "알고 있는 것을 쉽게 말해주는 친구에게 잘 어울려요.",
    "상상하기": "새로운 생각을 자주 떠올리는 친구에게 잘 어울려요.",
}

TOPIC_ACTIVITY_VARIANTS = {
    "동물": [
        "{topic} 관찰 카드 만들기",
        "{topic} 특징 찾아보기 기록장 만들기",
        "{topic} 돌봄 장면 역할놀이 해보기",
    ],
    "우주": [
        "{topic} 상상 일기 쓰기",
        "{topic} 탐사 이야기 꾸며보기",
        "{topic} 궁금한 점 3가지 적어보기",
    ],
    "공룡": [
        "{topic} 시대 비교 카드 꾸미기",
        "{topic} 화석 탐정 놀이 해보기",
        "{topic} 특징 정리 노트 만들어보기",
    ],
    "로봇": [
        "{topic} 움직임 설계 스케치 해보기",
        "{topic} 부품 상상도 그려보기",
        "{topic} 도움 주는 장면 역할놀이 해보기",
    ],
    "발명": [
        "{topic} 아이디어 스케치북 만들기",
        "{topic} 불편한 점 해결 계획 적어보기",
        "{topic} 상자나 블록으로 모형 만들어보기",
    ],
    "그림": [
        "{topic} 한 장면 이야기 그리기",
        "{topic} 감정 색깔 카드 만들기",
        "{topic} 내가 좋아하는 장면 꾸며보기",
    ],
    "음악": [
        "{topic} 느낌 카드 만들기",
        "{topic} 리듬 맞춰 몸으로 표현해보기",
        "{topic} 짧은 소개 멘트 만들어보기",
    ],
    "운동": [
        "{topic} 동작 기록표 만들어보기",
        "{topic} 나만의 연습 계획 세워보기",
        "{topic} 친구와 규칙 정해 놀이 해보기",
    ],
    "요리": [
        "{topic} 순서 카드 꾸미기",
        "{topic} 맛 표현 노트 적어보기",
        "{topic} 가족에게 설명해보기",
    ],
    "자연": [
        "{topic} 산책 기록장 만들기",
        "{topic} 닮은 점·다른 점 찾아보기",
        "{topic} 계절 변화 관찰해보기",
    ],
    "게임·컴퓨터": [
        "{topic} 규칙 아이디어 적어보기",
        "{topic} 작은 미션 설계해보기",
        "{topic} 장면 설명 카드 만들어보기",
    ],
    "사람 돕기": [
        "{topic} 상황 역할놀이 해보기",
        "{topic} 응원 카드 만들기",
        "{topic} 도와준 장면 이야기해보기",
    ],
    "이야기 만들기": [
        "{topic} 주인공 인터뷰 적어보기",
        "{topic} 4칸 이야기 이어보기",
        "{topic} 결말 바꿔 상상해보기",
    ],
    "실험하기": [
        "{topic} 예상과 결과 적어보기",
        "{topic} 재료 바꿔 비교해보기",
        "{topic} 작은 탐구 노트 만들기",
    ],
}

ACTIVITY_ACTIVITY_VARIANTS = {
    "만들기": "{topic} 주제로 손으로 직접 만드는 작은 작품 해보기",
    "관찰하기": "{topic}를 자세히 살펴보고 발견한 점 3가지 적어보기",
    "발표하기": "{topic}를 좋아하는 이유를 1분 소개로 말해보기",
    "친구와 함께하기": "{topic} 놀이를 친구나 가족과 함께 역할 나눠 해보기",
    "문제 풀기": "{topic}와 관련된 궁금한 문제 하나를 정하고 해결 방법 생각해보기",
    "상상하기": "{topic}가 나오는 새로운 장면을 상상해서 이야기로 꾸며보기",
    "몸으로 움직이기": "{topic}를 몸동작으로 표현해보는 놀이 해보기",
    "꾸미기": "{topic} 느낌이 나는 카드나 장면 꾸며보기",
    "설명하기": "{topic}를 잘 모르는 사람에게 쉽게 알려주는 말 연습해보기",
    "도와주기": "{topic}와 연결해 누군가를 도울 수 있는 방법 떠올려보기",
}


def normalize_answers(answers: dict[str, str]) -> dict[str, str]:
    normalized: dict[str, str] = {}
    for key, value in answers.items():
        if not key.strip() or not value.strip():
            continue
        normalized[key.strip()] = value.strip()
    return normalized


def build_job_detail(tags: list[str], topic: str) -> tuple[str, str, str]:
    for tag in tags:
        if tag in TAG_SCHOOL_HINTS:
            school_hint = TAG_SCHOOL_HINTS[tag]
            home_mission = TAG_HOME_MISSIONS[tag]
            friend_fit = TAG_FRIEND_FIT[tag]
            break
    else:
        school_hint = f"학교에서는 {topic}와 관련된 발표나 만들기 활동에 참여해보면 좋아요."
        home_mission = f"집에서는 {topic}를 주제로 작은 그림, 글, 만들기 놀이를 해봐요."
        friend_fit = f"{topic} 이야기를 하면 눈이 반짝이는 친구에게 잘 어울려요."

    return school_hint, home_mission, friend_fit


def build_suggested_activities(
    request: KidsExperienceAnalyzeRequest,
    unique_jobs: list[dict[str, object]],
) -> list[str]:
    suggestions: list[str] = []
    primary_topic = request.favorite_topics[0] if request.favorite_topics else "좋아하는 주제"

    for index, topic in enumerate(request.favorite_topics[:2]):
        variants = TOPIC_ACTIVITY_VARIANTS.get(topic, [])
        if variants:
            suggestions.append(variants[index % len(variants)].format(topic=topic))
        else:
            suggestions.append(f"{topic} 주제로 재미있었던 장면 기록해보기")

    for activity in request.favorite_activities[:2]:
        template = ACTIVITY_ACTIVITY_VARIANTS.get(activity)
        if template:
            suggestions.append(template.format(topic=primary_topic))

    if request.frequent_activities:
        frequent = request.frequent_activities[0]
        suggestions.append(f"{frequent}를 할 때 가장 재미있는 순간을 말풍선 카드로 남겨보기")

    if request.free_text_note:
        suggestions.append(f"{request.free_text_note}와 관련해 내가 더 해보고 싶은 장면 한 가지 그려보기")

    if unique_jobs:
        first_job = str(unique_jobs[0]["title"])
        suggestions.append(f"{first_job}처럼 하루를 보낸다면 어떤 일을 할지 역할놀이 해보기")

    if "작품 만들기" in request.preferred_outcome_types:
        suggestions.append(f"{primary_topic} 주제로 나만의 작은 결과물 하나 완성해보기")
    if "내가 만든 걸 보여줬을 때" in request.proud_moment_type:
        suggestions.append(f"{primary_topic} 주제로 만든 것을 가족이나 친구에게 짧게 소개해보기")

    varied: list[str] = []
    used_signatures: set[str] = set()
    for suggestion in suggestions:
        signature = suggestion.replace("  ", " ").strip()
        ending = signature.split()[-1]
        key = f"{ending}:{'관찰' in signature}:{'소개' in signature or '설명' in signature}:{'이야기' in signature}:{'역할놀이' in signature}:{'만들' in signature or '작품' in signature}"
        if key in used_signatures and signature in varied:
            continue
        used_signatures.add(key)
        varied.append(signature)
        if len(varied) == 3:
            break

    return varied or ["좋아하는 주제로 그림일기 만들기"]


def build_report_sections(
    request: KidsExperienceAnalyzeRequest,
    strengths: list[str],
    suggested_activities: list[str],
    recommended_jobs: list[dict],
) -> dict[str, object]:
    first_keyword = strengths[0] if strengths else "호기심"
    first_job = recommended_jobs[0]["title"] if recommended_jobs else "새로운 직업"
    first_activity = suggested_activities[0] if suggested_activities else "작은 탐험 활동"
    first_frequent_activity = request.frequent_activities[0] if request.frequent_activities else "평소 좋아하는 놀이"
    first_school_hint = (
        recommended_jobs[0]["school_hint"] if recommended_jobs else "작은 발표나 관찰 기록 활동으로 자신감을 키워보면 좋아요."
    )
    topic_summary = ", ".join(request.favorite_topics[:3])
    activity_summary = ", ".join(request.favorite_activities[:2])
    outcome_summary = ", ".join(request.preferred_outcome_types[:2])
    hidden_potential_fields = list(
        dict.fromkeys(
            [
                f"{request.favorite_topics[0]} 탐구"
                if request.favorite_topics
                else "관찰 탐구",
                "창의 표현",
                "차분한 몰입" if "혼자" in request.comfort_style else "함께 성장",
                "협력 리더십" if "친구와 함께하기" in request.favorite_activities or "도와주기" in request.favorite_activities else "몰입 탐구",
                "문제 해결"
                if any(keyword in activity_summary for keyword in ["문제", "만들기", "실험"])
                else "스토리 표현",
            ]
        )
    )[:3]

    return {
        "one_line_summary": (
            f"{request.participant_name}는 {first_keyword}을(를) 바탕으로 "
            f"{first_job}처럼 배우고 돕고 만들어 가는 힘이 보여요."
        ),
        "profile_overview": (
            f"{request.participant_name}는 {topic_summary}처럼 좋아하는 주제를 오래 붙잡고, "
            f"{activity_summary} 과정에서 몰입이 커지는 편이에요. "
            f"평소에는 {first_frequent_activity} 같은 활동을 자주 하며, {request.comfort_style}일 때 더 편안함을 느끼는 모습도 보여요. "
            f"특히 {first_keyword}이(가) 드러날 때 가장 자신답게 반짝일 가능성이 보여요."
        ),
        "strengths_summary": (
            f"{request.participant_name}는 좋아하는 것을 오래 붙잡고, "
            f"{', '.join(strengths[:2]) if strengths else '자기만의 방식'}으로 직접 해보며 배워가는 힘이 보여요. "
            f"특히 {outcome_summary}처럼 눈에 보이는 결과를 만들 때 자신감이 더 커질 수 있어요."
        ),
        "home_observation_points": [
            f"{first_activity} 또는 {first_frequent_activity} 같은 활동을 할 때 스스로 오래 집중하는지 지켜봐 주세요.",
            f"{request.proud_moment_type}처럼 뿌듯함을 느낀 순간을 다시 이야기할 때 표정과 말의 힘이 달라지는지 살펴봐 주세요.",
        ],
        "school_support_points": [
            first_school_hint,
            f"{request.comfort_style} 상황에서 더 힘을 내는지, 또는 다른 방식에서도 천천히 자신감을 넓혀가는지 함께 봐주면 좋아요.",
        ],
        "parent_message": (
            "결과를 정답처럼 외우게 하기보다, 아이가 뿌듯했던 순간과 다시 해보고 싶은 활동을 연결해서 이야기하도록 도와주면 좋아요."
        ),
        "next_talk_question": (
            f"다음에는 {', '.join(request.favorite_topics[:3])} 중에서 무엇을 {outcome_summary} 방식으로 해보고 싶은지 먼저 물어봐 주세요."
        ),
        "hidden_potential_fields": hidden_potential_fields[:3],
        "closing_message": (
            f"{request.participant_name}, 너의 {first_keyword}은(는) 이미 멋진 시작이야. "
            "아직 하나로 정하지 않아도 괜찮고, 좋아하는 것을 계속 해보는 동안 더 잘 맞는 길이 또렷해질 거야."
        ),
    }


def infer_personality_type(request: KidsExperienceAnalyzeRequest) -> tuple[str, str, list[str]]:
    answers = normalize_answers(request.personality_answers)
    scores = {
        "creative": 0,
        "maker": 0,
        "curious": 0,
        "careful": 0,
        "observer": 0,
        "helper": 0,
        "social": 0,
        "steady": 0,
        "solver": 0,
        "challenger": 0,
        "fast": 0,
    }

    if "친구" in answers.get("social_style", ""):
        scores["social"] += 2
        scores["helper"] += 1
    else:
        scores["observer"] += 1
        scores["careful"] += 1

    if "바로" in answers.get("start_style", ""):
        scores["challenger"] += 1
        scores["maker"] += 1
    else:
        scores["observer"] += 1
        scores["careful"] += 1

    if "만들" in answers.get("expression_style", ""):
        scores["maker"] += 2
    else:
        scores["social"] += 1

    if "상상" in answers.get("idea_style", ""):
        scores["creative"] += 2
        scores["curious"] += 1
    else:
        scores["observer"] += 1
        scores["careful"] += 1

    if "계획" in answers.get("plan_style", ""):
        scores["steady"] += 1
        scores["careful"] += 1
    else:
        scores["creative"] += 1

    if "문제" in answers.get("care_style", ""):
        scores["solver"] += 2
    else:
        scores["helper"] += 2

    if "도전" in answers.get("challenge_style", ""):
        scores["challenger"] += 2
    else:
        scores["steady"] += 2

    if "빠르게" in answers.get("speed_style", ""):
        scores["fast"] += 1
        scores["challenger"] += 1
    else:
        scores["careful"] += 1

    label = max(
        PERSONALITY_ARCHETYPES.items(),
        key=lambda item: sum(scores.get(key, 0) * weight for key, weight in item[1].items()),
    )[0]

    strengths = []
    if scores["challenger"] >= 2:
        strengths.append("도전정신")
    if scores["observer"] + scores["careful"] >= 3:
        strengths.append("관찰력")
    if scores["creative"] >= 2:
        strengths.append("상상력")
    if scores["helper"] >= 2:
        strengths.append("배려심")
    if scores["solver"] >= 2:
        strengths.append("문제해결력")
    if scores["social"] >= 2:
        strengths.append("협동심")
    if not strengths:
        strengths = ["호기심", "성장 가능성"]

    summary = {
        "호기심 탐험가": "새로운 것을 보면 궁금해하고 직접 해보며 배우는 힘이 큰 스타일이에요.",
        "상상력 발명가": "머릿속 아이디어를 실제로 만들어보는 걸 좋아하는 창의적인 스타일이에요.",
        "꼼꼼한 관찰자": "작은 차이도 잘 보고 차분하게 살피는 집중력이 강한 스타일이에요.",
        "다정한 협력가": "친구와 함께하고 다른 사람을 도와줄 때 힘이 나는 따뜻한 스타일이에요.",
        "문제 해결사": "어려운 문제를 만나도 방법을 찾아내며 끝까지 해보는 끈기가 있는 스타일이에요.",
    }.get(label, "좋아하는 것을 중심으로 자신의 힘을 발견해가는 스타일이에요.")

    return label, summary, list(dict.fromkeys(strengths))


def build_fallback_result(
    request: KidsExperienceAnalyzeRequest,
) -> KidsExperienceAnalyzeResponse:
    personality_type, personality_summary, strengths = infer_personality_type(request)
    recommended_jobs = []
    primary_activity = request.favorite_activities[0] if request.favorite_activities else ""
    frequent_activity = request.frequent_activities[0] if request.frequent_activities else ""
    comfort_style = request.comfort_style
    outcome_type = request.preferred_outcome_types[0] if request.preferred_outcome_types else ""
    for topic in request.favorite_topics:
        if topic in TOPIC_JOB_MAP:
            for title, tags in TOPIC_JOB_MAP[topic]:
                reason = (
                    f"{topic}에 관심이 많고, {ACTIVITY_HINTS.get(primary_activity, '좋아하는 활동을 꾸준히 이어가는 모습')}이 잘 보여서 "
                    f"{title}처럼 탐구하거나 표현하는 일이 잘 어울려요. "
                    f"또 {frequent_activity or '평소 좋아하는 활동'}을 자주 하고, {comfort_style}일 때 편한 점도 잘 맞는 이유가 돼요."
                )
                school_hint, home_mission, friend_fit = build_job_detail(tags, topic)
                recommended_jobs.append(
                    {
                        "title": title,
                        "reason": reason,
                        "fit_comment": (
                            f"{request.participant_name}가 보여준 {ACTIVITY_HINTS.get(primary_activity, '좋아하는 활동의 힘')}이 "
                            f"{title}와 닮아 있어요. 특히 {request.proud_moment_type} 같은 순간에 강점이 더 잘 드러날 수 있어요."
                        ),
                        "tags": tags,
                        "school_hint": school_hint,
                        "home_mission": (
                            f"{home_mission} 그리고 {outcome_type or '좋아하는 방식'}으로 결과를 남겨보면 더 재미있어요."
                        ),
                        "friend_fit": f"{friend_fit} {comfort_style}일 때 더 힘이 나는 모습도 잘 어울려요.",
                    }
                )

    if not recommended_jobs:
        recommended_jobs = [
            {
                "title": "탐구 활동 기획자",
                "reason": "좋아하는 주제와 활동을 연결해 새로운 체험을 만들어볼 힘이 보여요.",
                "fit_comment": f"좋아하는 것을 그냥 넘기지 않고 직접 해보려는 태도, 그리고 {request.proud_moment_type} 같은 순간이 이 역할과 잘 어울려요.",
                "tags": ["호기심", "도전"],
                "school_hint": "학교에서는 궁금한 주제를 정해서 친구들 앞에서 소개해보면 좋아요.",
                "home_mission": f"집에서는 좋아하는 것을 모아 작은 탐험 노트를 만들고 {outcome_type or '작은 결과'}로 남겨봐요.",
                "friend_fit": f"궁금한 것이 많고 직접 해보는 걸 좋아하는 친구, 그리고 {comfort_style}일 때 편한 아이에게 잘 어울려요.",
            }
        ]

    if "잠자" in request.free_text_note:
        recommended_jobs.append(
            {
                "title": "수면 연구원",
                "reason": "쉬는 시간과 몸의 리듬에도 관심이 보여서 사람들의 건강한 생활을 돕는 직업도 잘 어울릴 수 있어요.",
                "fit_comment": "몸의 느낌과 생활 습관을 세심하게 알아차리는 모습이 이 직업과 닮아 있어요.",
                "tags": ["건강", "관찰"],
                "school_hint": "학교에서는 하루 컨디션을 기록하는 작은 습관을 만들어보면 좋아요.",
                "home_mission": "집에서는 잠들기 전 나만의 편안한 루틴을 적어봐요.",
                "friend_fit": "몸의 변화나 생활 습관을 세심하게 살피는 친구에게 잘 어울려요.",
            }
        )

    unique_jobs = []
    seen_titles = set()
    for job in recommended_jobs:
        if job["title"] in seen_titles:
            continue
        unique_jobs.append(job)
        seen_titles.add(job["title"])
        if len(unique_jobs) == 3:
            break

    if len(unique_jobs) < 3:
        extras = [
            {
                "title": "환경 탐험가",
                "reason": "주변 세상을 관찰하고 의미를 찾는 힘이 보여요.",
                "fit_comment": "주변에서 그냥 지나치지 않고 힌트를 찾아내는 태도가 잘 드러나요.",
                "tags": ["자연", "관찰"],
                "school_hint": "학교에서는 식물이나 날씨를 기록하는 활동을 해보면 좋아요.",
                "home_mission": "집에서는 동네의 자연물을 모아 나만의 탐험 카드를 만들어봐요.",
                "friend_fit": "자연을 좋아하고 천천히 살펴보는 친구에게 잘 어울려요.",
            },
            {
                "title": "콘텐츠 이야기꾼",
                "reason": "좋아하는 것을 다른 사람에게 재미있게 전할 수 있어요.",
                "fit_comment": "재미있던 것을 자기 말로 다시 풀어내는 힘이 이 직업과 이어질 수 있어요.",
                "tags": ["표현", "상상"],
                "school_hint": "학교에서는 짧은 발표나 이야기 만들기 활동에 참여해보면 좋아요.",
                "home_mission": "집에서는 좋아하는 주제로 4칸 만화나 짧은 영상을 만들어봐요.",
                "friend_fit": "재미있는 이야기를 떠올리고 나누는 걸 좋아하는 친구에게 잘 어울려요.",
            },
            {
                "title": "미래 발명가",
                "reason": "직접 해보며 더 좋은 방법을 떠올리는 힘이 있어요.",
                "fit_comment": "손으로 바꿔 보고 고쳐 보는 즐거움이 이 직업과 닮아 있어요.",
                "tags": ["만들기", "아이디어"],
                "school_hint": "학교에서는 불편한 점을 찾고 해결 방법을 그려보면 좋아요.",
                "home_mission": "집에서는 종이, 블록, 상자로 새로운 물건을 만들어봐요.",
                "friend_fit": "새로운 방법을 떠올리고 손으로 만드는 걸 좋아하는 친구에게 잘 어울려요.",
            },
        ]
        for extra in extras:
            if extra["title"] not in seen_titles:
                unique_jobs.append(extra)
                seen_titles.add(extra["title"])
            if len(unique_jobs) >= 3:
                break

    suggested_activities = build_suggested_activities(request, unique_jobs)

    report_sections = build_report_sections(
        request=request,
        strengths=strengths,
        suggested_activities=suggested_activities or ["좋아하는 주제로 그림일기 만들기"],
        recommended_jobs=unique_jobs[:3],
    )

    return KidsExperienceAnalyzeResponse(
        participant_name=request.participant_name,
        personality_type=personality_type,
        personality_summary=personality_summary,
        strength_keywords=strengths,
        recommended_jobs=unique_jobs[:3],
        suggested_activities=suggested_activities or ["좋아하는 주제로 그림일기 만들기"],
        quick_counsel={
            "why_this_fits": f"{request.participant_name}는 좋아하는 주제와 활동 방식이 뚜렷해서, 지금 보이는 흥미를 미래 직업으로 연결해보기에 아주 좋은 출발점에 있어요.",
            "strengths": f"특히 {', '.join(strengths[:3])}이 강점으로 보여요. 이 힘은 학교 활동이나 놀이에서도 계속 자라날 수 있어요.",
            "alternative_jobs": f"비슷한 방향으로는 {', '.join(job['title'] for job in unique_jobs[1:4]) or '과학 해설가, 동물 행동 연구원, 교육 콘텐츠 기획자'}도 있어요.",
        },
        report_sections=report_sections,
        fallback_used=True,
    )


async def maybe_generate_with_ai(
    request: KidsExperienceAnalyzeRequest,
) -> KidsExperienceAnalyzeResponse:
    fallback = build_fallback_result(request)
    if not APIM_BASE_URL or not APIM_KEY or not CHAT_MODEL:
        return fallback

    payload = {
        "messages": [
            {
                "role": "system",
                "content": (
                    "당신은 초등학생 행사 체험용 진로 안내 도우미입니다. "
                    "답변은 쉽고 따뜻한 한국어로 작성하고, 대학·입시 이야기는 하지 마세요. "
                    "정확한 JSON만 반환하세요. "
                    "recommended_jobs는 정확히 3개로 채우세요. "
                    "직업 이름만 나열하지 말고, 아이가 왜 그 방향과 잘 맞는지 상담사가 말해주듯 자연스럽게 설명하세요. "
                    "보호자가 바로 이해할 수 있는 상담 문장으로 쓰고, 평가하거나 단정하는 말투는 피하세요. "
                    "one_line_summary는 한 줄이지만 충분히 구체적으로, strengths_summary는 강점이 실제 장면에서 어떻게 보이는지 포함하세요. "
                    "parent_message와 next_talk_question은 집에서 바로 써볼 수 있게 실용적으로 작성하세요. "
                    "각 recommended_job에는 title, reason, fit_comment, tags, school_hint, home_mission, friend_fit를 모두 포함하세요. "
                    "report_sections의 one_line_summary, profile_overview, strengths_summary, home_observation_points, school_support_points, parent_message, next_talk_question, hidden_potential_fields, closing_message를 빠짐없이 채우세요. "
                    "fallback_used는 입력으로 받은 값과 관계없이 최종 JSON에서는 의미 있는 응답 본문만 만들고, 서버가 따로 처리합니다."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "input": request.model_dump(mode="json"),
                        "output_shape": fallback.model_dump(mode="json"),
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        "response_format": {"type": "json_object"},
        "max_completion_tokens": 1200,
    }

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                f"{APIM_BASE_URL}/{CHAT_MODEL}/chat/completions",
                headers={"api-key": APIM_KEY, "Content-Type": "application/json"},
                json=payload,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            parsed["fallback_used"] = False
            return KidsExperienceAnalyzeResponse(**parsed)
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
        return fallback
