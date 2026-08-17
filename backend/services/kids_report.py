from io import BytesIO
from pathlib import Path

import fitz

from backend.schemas import KidsExperienceAnalyzeRequest, KidsExperienceAnalyzeResponse

FONT_CANDIDATES = [
    Path("/System/Library/Fonts/Supplemental/AppleGothic.ttf"),
    Path("/System/Library/Fonts/AppleSDGothicNeo.ttc"),
]


def pick_fontfile() -> str | None:
    for candidate in FONT_CANDIDATES:
        if candidate.exists():
            return str(candidate)
    return None


def apply_font(page: fitz.Page) -> str:
    fontfile = pick_fontfile()
    if fontfile:
        page.insert_font(fontname="kidsgothic", fontfile=fontfile)
        return "kidsgothic"
    return "helv"


def draw_title(page: fitz.Page, fontname: str, title: str, subtitle: str):
    page.draw_rect(fitz.Rect(24, 24, 571, 136), fill=(0.92, 0.97, 0.94), color=None)
    page.draw_rect(fitz.Rect(24, 24, 571, 818), color=(0.09, 0.42, 0.32), width=1.5)
    page.insert_text((40, 60), "GILJABI CAREER REPORT", fontsize=11, fontname="helv")
    page.insert_text((40, 92), title, fontsize=23, fontname=fontname)
    page.insert_textbox(
        fitz.Rect(40, 102, 555, 130),
        subtitle,
        fontsize=11,
        fontname=fontname,
        color=(0.24, 0.31, 0.28),
        lineheight=1.3,
    )


def draw_labeled_box(page: fitz.Page, fontname: str, rect: fitz.Rect, label: str, body: str, fill=(0.98, 0.99, 0.98)):
    page.draw_rect(rect, fill=fill, color=(0.84, 0.9, 0.86), width=0.8)
    page.insert_text((rect.x0 + 14, rect.y0 + 22), label, fontsize=12, fontname=fontname)
    page.insert_textbox(
        fitz.Rect(rect.x0 + 14, rect.y0 + 34, rect.x1 - 14, rect.y1 - 12),
        body,
        fontsize=10.5,
        fontname=fontname,
        color=(0.23, 0.29, 0.26),
        lineheight=1.45,
    )


def build_kids_report_pdf(
    draft: KidsExperienceAnalyzeRequest,
    result: KidsExperienceAnalyzeResponse,
) -> bytes:
    document = fitz.open()

    page1 = document.new_page(width=595, height=842)
    fontname = apply_font(page1)
    draw_title(
        page1,
        fontname,
        "길잡이 초등 진로 체험 리포트",
        "정답을 고르는 종이가 아니라, 지금 좋아하는 것에서 미래의 힌트를 찾는 상담 레포트예요.",
    )

    page1.insert_text((40, 170), f"{result.participant_name}의 진로 상담 한눈에 보기", fontsize=20, fontname=fontname)
    page1.insert_text((40, 200), f"성향 타입 · {result.personality_type}", fontsize=13, fontname=fontname)
    page1.insert_textbox(
        fitz.Rect(40, 220, 555, 252),
        result.personality_summary,
        fontsize=11.5,
        fontname=fontname,
        lineheight=1.35,
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(40, 264, 555, 336),
        "오늘의 상담 한 줄 총평",
        result.report_sections.one_line_summary,
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(40, 346, 555, 438),
        "상담 선생님이 본 전체 모습",
        result.report_sections.profile_overview,
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(40, 448, 555, 520),
        "상담 선생님이 본 강점",
        result.report_sections.strengths_summary,
    )

    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(40, 534, 200, 606),
        "가장 잘 보이는 힘",
        " · ".join(result.strength_keywords),
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(218, 534, 378, 606),
        "가장 끌린 직업",
        result.recommended_jobs[0].title if result.recommended_jobs else "직업 탐색",
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(396, 534, 555, 606),
        "다음에 해보면 좋은 활동",
        result.suggested_activities[0] if result.suggested_activities else "작은 탐험 시작하기",
    )

    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(40, 620, 292, 692),
        "좋아하는 주제",
        ", ".join(draft.favorite_topics),
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(304, 620, 555, 692),
        "좋아하는 활동",
        ", ".join(draft.favorite_activities),
    )

    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(40, 704, 165, 756),
        "요즘 자주 하는 활동",
        ", ".join(draft.frequent_activities),
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(177, 704, 292, 756),
        "편한 활동 방식",
        draft.comfort_style,
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(304, 704, 429, 756),
        "좋아하는 결과 방식",
        ", ".join(draft.preferred_outcome_types),
    )
    draw_labeled_box(
        page1,
        fontname,
        fitz.Rect(441, 704, 555, 756),
        "뿌듯했던 순간",
        draft.proud_moment_type,
    )

    if draft.free_text_note:
        draw_labeled_box(
            page1,
            fontname,
            fitz.Rect(40, 764, 555, 812),
            "내가 직접 적은 한 줄",
            draft.free_text_note,
        )

    page2 = document.new_page(width=595, height=842)
    fontname = apply_font(page2)
    draw_title(
        page2,
        fontname,
        "추천 직업별 상담 카드",
        "잘 어울리는 이유만이 아니라, 학교와 집에서 바로 해볼 수 있는 행동까지 함께 정리했어요.",
    )

    cursor_y = 158
    for index, job in enumerate(result.recommended_jobs[:3], start=1):
        rect = fitz.Rect(40, cursor_y, 555, cursor_y + 186)
        page2.draw_rect(rect, fill=(0.99, 1.0, 0.99), color=(0.82, 0.89, 0.84), width=0.8)
        card_label = ["가장 잘 맞는 방향", "함께 볼 수 있는 방향", "숨은 가능성 방향"][index - 1]
        page2.insert_text((56, cursor_y + 24), card_label, fontsize=10, fontname=fontname, color=(0.09, 0.42, 0.32))
        page2.insert_text((56, cursor_y + 48), job.title, fontsize=18, fontname=fontname)
        page2.insert_textbox(
            fitz.Rect(56, cursor_y + 58, 539, cursor_y + 92),
            f"이 직업이 특히 잘 맞는 이유 · {job.reason}",
            fontsize=10.5,
            fontname=fontname,
            lineheight=1.35,
        )
        page2.insert_textbox(
            fitz.Rect(56, cursor_y + 88, 539, cursor_y + 116),
            f"상담 선생님 한마디 · {job.fit_comment}",
            fontsize=9.5,
            fontname=fontname,
            color=(0.24, 0.31, 0.28),
            lineheight=1.3,
        )

        page2.insert_text((56, cursor_y + 126), "학교에서 이렇게 해봐요", fontsize=11, fontname=fontname)
        page2.insert_textbox(
            fitz.Rect(56, cursor_y + 136, 218, cursor_y + 172),
            job.school_hint,
            fontsize=9.5,
            fontname=fontname,
            lineheight=1.35,
        )
        page2.insert_text((228, cursor_y + 126), "집에서는 이렇게 놀아봐요", fontsize=11, fontname=fontname)
        page2.insert_textbox(
            fitz.Rect(228, cursor_y + 136, 390, cursor_y + 172),
            job.home_mission,
            fontsize=9.5,
            fontname=fontname,
            lineheight=1.35,
        )
        page2.insert_text((400, cursor_y + 126), "이런 친구에게 잘 어울려요", fontsize=11, fontname=fontname)
        page2.insert_textbox(
            fitz.Rect(400, cursor_y + 136, 539, cursor_y + 172),
            job.friend_fit,
            fontsize=9.5,
            fontname=fontname,
            lineheight=1.35,
        )
        cursor_y += 202

    page3 = document.new_page(width=595, height=842)
    fontname = apply_font(page3)
    draw_title(
        page3,
        fontname,
        "다음에 해보면 좋은 활동",
        "직업 이름을 외우는 것보다, 직접 해보는 경험이 훨씬 더 큰 힌트를 줘요.",
    )

    page3.insert_text((40, 165), f"{result.participant_name}의 이번 주 탐험 미션", fontsize=18, fontname=fontname)
    mission_y = 205
    for activity in result.suggested_activities[:5]:
        page3.draw_rect(fitz.Rect(44, mission_y - 12, 58, mission_y + 2), color=(0.09, 0.42, 0.32), width=1)
        page3.insert_textbox(
            fitz.Rect(70, mission_y - 18, 545, mission_y + 16),
            activity,
            fontsize=12,
            fontname=fontname,
            lineheight=1.3,
        )
        mission_y += 48

    draw_labeled_box(
        page3,
        fontname,
        fitz.Rect(40, 360, 555, 452),
        "집에서 이렇게 지켜봐 주세요",
        "\n".join(result.report_sections.home_observation_points),
    )
    draw_labeled_box(
        page3,
        fontname,
        fitz.Rect(40, 470, 555, 562),
        "학교에서 이렇게 응원해 주세요",
        "\n".join(result.report_sections.school_support_points),
    )
    draw_labeled_box(
        page3,
        fontname,
        fitz.Rect(40, 580, 555, 684),
        "숨은 가능성 분야",
        "\n".join(result.report_sections.hidden_potential_fields),
        fill=(0.96, 0.94, 0.88),
    )
    draw_labeled_box(
        page3,
        fontname,
        fitz.Rect(40, 700, 555, 792),
        f"{result.participant_name}에게 전하는 한마디",
        result.report_sections.closing_message,
    )

    page4 = document.new_page(width=595, height=842)
    fontname = apply_font(page4)
    draw_title(
        page4,
        fontname,
        "앞으로 이렇게 이어가면 좋아요",
        "상담 결과를 읽고 끝내지 않고, 집과 학교에서 자연스럽게 대화를 이어갈 수 있도록 정리했어요.",
    )
    draw_labeled_box(
        page4,
        fontname,
        fitz.Rect(40, 170, 555, 300),
        "상담 선생님 정리 노트",
        (
            f"가장 잘 맞는 이유 · {result.quick_counsel.why_this_fits}\n\n"
            f"강점이 드러난 장면 · {result.quick_counsel.strengths}\n\n"
            f"비슷한 가능성 · {result.quick_counsel.alternative_jobs}"
        ),
        fill=(1.0, 0.97, 0.91),
    )
    draw_labeled_box(
        page4,
        fontname,
        fitz.Rect(40, 320, 555, 430),
        "부모님께 먼저 전하는 말",
        result.report_sections.parent_message,
        fill=(0.97, 0.98, 1.0),
    )
    draw_labeled_box(
        page4,
        fontname,
        fitz.Rect(40, 450, 555, 560),
        "다음 대화 시작 질문",
        result.report_sections.next_talk_question,
        fill=(0.99, 0.97, 0.93),
    )
    draw_labeled_box(
        page4,
        fontname,
        fitz.Rect(40, 580, 555, 720),
        "오늘 결과를 이렇게 활용해 보세요",
        (
            "• 아이가 가장 오래 이야기한 직업이나 주제를 다시 한 번 물어봐 주세요.\n"
            "• 결과를 맞고 틀림으로 보지 말고, 다음 놀이 아이디어로 이어가 주세요.\n"
            "• 오늘 고른 답이 다음 체험에서 바뀌어도 자연스러운 성장 과정으로 받아들여 주세요."
        ),
        fill=(0.96, 0.94, 0.88),
    )
    intake_rect = fitz.Rect(40, 734, 555, 812)
    page4.draw_rect(intake_rect, fill=(0.97, 0.98, 1.0), color=(0.84, 0.9, 0.86), width=0.8)
    page4.insert_text((intake_rect.x0 + 14, intake_rect.y0 + 22), "이번 상담에 함께 반영된 아이의 모습", fontsize=12, fontname=fontname)
    page4.insert_textbox(
        fitz.Rect(intake_rect.x0 + 14, intake_rect.y0 + 34, intake_rect.x1 - 14, intake_rect.y1 - 10),
        (
            f"요즘 자주 하는 활동 · {', '.join(draft.frequent_activities)}\n"
            f"편한 활동 방식 · {draft.comfort_style}\n"
            f"좋아하는 결과 방식 · {', '.join(draft.preferred_outcome_types)}\n"
            f"뿌듯했던 순간 · {draft.proud_moment_type}"
        ),
        fontsize=8.8,
        fontname=fontname,
        color=(0.23, 0.29, 0.26),
        lineheight=1.28,
    )

    buffer = BytesIO()
    document.save(buffer)
    document.close()
    return buffer.getvalue()
