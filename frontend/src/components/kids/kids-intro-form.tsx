"use client";

import { FormEvent, useState } from "react";

export function KidsIntroForm({
  onStart,
}: {
  onStart: (participantName: string) => void;
}) {
  const [name, setName] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onStart(trimmed);
  }

  return (
    <form className="kids-card kids-intro-form kids-intro-welcome" onSubmit={submit}>
      <p className="eyebrow">START TOGETHER</p>
      <h2>먼저 어떻게 불러주면 좋을까?</h2>
      <p>이름을 알려주면 더 다정하게 불러주고, 리포트도 더 자연스럽게 만들어줄 수 있어요.</p>
      <label>
        이름 또는 별명
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="예: 홍길동, 하늘이"
          aria-label="이름 또는 별명"
        />
      </label>
      <button className="kids-primary-button" type="submit">
        시작하기
      </button>
    </form>
  );
}
