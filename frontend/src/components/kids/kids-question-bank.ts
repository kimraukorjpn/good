export const KIDS_TOPIC_OPTIONS = [
  "동물",
  "우주",
  "공룡",
  "로봇",
  "발명",
  "그림",
  "음악",
  "운동",
  "요리",
  "자연",
  "게임·컴퓨터",
  "사람 돕기",
  "이야기 만들기",
  "실험하기",
] as const;

export const KIDS_ACTIVITY_OPTIONS = [
  "만들기",
  "관찰하기",
  "발표하기",
  "친구와 함께하기",
  "문제 풀기",
  "상상하기",
  "몸으로 움직이기",
  "꾸미기",
  "설명하기",
  "도와주기",
] as const;

export const KIDS_FREQUENT_ACTIVITY_OPTIONS = [
  "레고 만들기",
  "그림 그리기",
  "책 읽기",
  "축구·달리기 같은 운동",
  "블록 쌓기 놀이",
  "실험 놀이",
  "노래 부르기",
  "이야기 만들기 놀이",
  "퍼즐 맞추기",
  "자연 관찰하기",
  "종이접기·오리기",
] as const;

export const KIDS_COMFORT_STYLE_OPTIONS = [
  "혼자 천천히",
  "친구와 함께",
  "상황에 따라 둘 다 좋아",
] as const;

export const KIDS_OUTCOME_TYPE_OPTIONS = [
  "작품 만들기",
  "이야기 들려주기",
  "발표하기",
  "문제 해결하기",
  "사람 돕기",
  "꾸미기",
  "관찰 기록 남기기",
] as const;

export const KIDS_PROUD_MOMENT_OPTIONS = [
  "내가 만든 걸 보여줬을 때",
  "친구를 도와줬을 때",
  "어려운 걸 해냈을 때",
  "새로운 걸 해봤을 때",
  "오래 집중했을 때",
] as const;

export const KIDS_PERSONALITY_QUESTIONS = [
  {
    id: "social_style",
    title: "어떤 시간이 더 편해?",
    options: ["혼자 차분히 집중하기", "친구와 함께 이야기하기"],
  },
  {
    id: "start_style",
    title: "처음 시작할 때는?",
    options: ["바로 해보는 편", "먼저 살펴보는 편"],
  },
  {
    id: "expression_style",
    title: "어떤 방식이 더 좋아?",
    options: ["직접 만들어 보여주기", "말로 쉽게 설명하기"],
  },
  {
    id: "idea_style",
    title: "더 끌리는 건?",
    options: ["상상하고 새로 떠올리기", "자세히 관찰하며 알아내기"],
  },
  {
    id: "plan_style",
    title: "진행 방식은?",
    options: ["계획을 세우고 하기", "생각나는 대로 해보기"],
  },
  {
    id: "care_style",
    title: "더 재미있는 건?",
    options: ["문제 해결하기", "사람 도와주기"],
  },
  {
    id: "challenge_style",
    title: "어떤 게 더 좋아?",
    options: ["새로운 것 도전하기", "익숙한 것 깊게 하기"],
  },
  {
    id: "speed_style",
    title: "내 스타일은?",
    options: ["꼼꼼하게 천천히", "신나게 빠르게"],
  },
] as const;
