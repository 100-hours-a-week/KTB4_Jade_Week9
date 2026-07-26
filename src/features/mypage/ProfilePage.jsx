import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import { profileImages, validateImageFile } from "../../services/profileImages.js";
import Field from "../../shared/components/Field.jsx";
import Loading from "../../shared/components/Loading.jsx";
import Modal from "../../shared/components/Modal.jsx";
import Shell from "../../shared/components/Shell.jsx";
import { toast } from "../../shared/toast.js";
import useCurrentUser from "../../shared/hooks/useCurrentUser.js";
import useObjectUrl from "../../shared/hooks/useObjectUrl.js";
import { NICKNAME_PATTERN } from "../../shared/utils.js";

export default function ProfilePage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { loading, user } = useCurrentUser();
  const currentUrl = useObjectUrl(user?.profileImageUrl);
  // null이면 아직 손대지 않았다는 뜻. 서버에서 온 닉네임을 그대로 보여준다.
  const [nickInput, setNickInput] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const nick = nickInput ?? user?.nick ?? "";

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const selectAvatar = (file) => {
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      toast(invalid);
      return;
    }

    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!NICKNAME_PATTERN.test(nick.trim())) {
      toast("닉네임은 띄어쓰기 없이 1~10자로 입력해 줘");
      return;
    }

    setPending(true);
    let nextImage;

    try {
      if (avatar) nextImage = await profileImages.save(avatar);
      await api.updateMe({
        nick: nick.trim(),
        profileImageUrl: nextImage,
      });
      if (nextImage && profileImages.isLocal(user.profileImageUrl)) {
        await profileImages.remove(user.profileImageUrl);
      }
      toast("회원정보 수정 완료");
      navigate("/games");
    } catch (error) {
      if (nextImage) await profileImages.remove(nextImage);
      toast(error.message || "수정에 실패했어요");
    } finally {
      setPending(false);
    }
  };

  const withdraw = async () => {
    try {
      await api.withdraw();
      toast("탈퇴 완료");
      navigate("/", { replace: true });
    } catch (error) {
      toast(error.message || "탈퇴에 실패했어요");
    }
  };

  if (loading) return <Loading />;

  // getMe가 실패하면 user가 null로 온다. 역참조하기 전에 막는다.
  if (!user) {
    return (
      <Shell header back="/games">
        <div className="wrap-narrow profile-wrap">
          <h1 className="page-title profile-title">회원정보 수정</h1>
          <p className="comment-empty">
            회원 정보를 불러오지 못했어요. 잠시 후 다시 시도해 줘.
          </p>
        </div>
      </Shell>
    );
  }

  const avatarUrl = preview || currentUrl;

  return (
    <Shell header back="/games" user={user}>
      <div className="wrap-narrow profile-wrap">
        <h1 className="page-title profile-title">회원정보 수정</h1>
        <form className="card" onSubmit={submit}>
          <div className="center">
            <label className="lbl">프로필 사진</label>
            <button
              type="button"
              className={`avatar-lg${avatarUrl ? " has-profile-image" : ""}`}
              style={{
                backgroundImage: avatarUrl
                  ? `url("${avatarUrl}")`
                  : undefined,
              }}
              onClick={() => inputRef.current.click()}
            >
              {avatarUrl ? "" : (user.nick || "?").slice(0, 1)}
              <span className="edit-tag">변경</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => selectAvatar(event.target.files?.[0])}
            />
            <p className="hint">5MB 이하 이미지를 선택해 주세요</p>
          </div>
          <Field label="이메일">
            <div className="readonly">{user.email}</div>
          </Field>
          <Field
            label="닉네임"
            hint="1~10자, 띄어쓰기 없이 입력해 주세요"
          >
            <input
              className="input"
              maxLength="10"
              value={nick}
              onChange={(event) => setNickInput(event.target.value)}
            />
          </Field>
          <button className="btn btn-accent form-submit" disabled={pending}>
            {pending ? "저장 중..." : "수정하기"}
          </button>
        </form>
        <button
          className="link-danger"
          onClick={() => setWithdrawModalOpen(true)}
        >
          회원 탈퇴
        </button>
      </div>
      {withdrawModalOpen && (
        <Modal
          title="탈퇴...? 진심임...?"
          text={
            <>
              탈퇴하면 그동안 반틈 낸
              <br />
              모든 기록이 사라져요.
            </>
          }
          cancel="더 갈래요"
          confirm="탈퇴할래요"
          onCancel={() => setWithdrawModalOpen(false)}
          onConfirm={withdraw}
        />
      )}
    </Shell>
  );
}
