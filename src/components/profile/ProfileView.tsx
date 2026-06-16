"use client";

import { useRef, useState } from "react";

import { ApiError } from "@/lib/api";
import { useCurrentUser } from "@/lib/currentUser";
import { updateProfile, uploadAvatar, removeAvatar } from "@/lib/users";
import { fullName } from "@/lib/format";
import Avatar from "@/components/Avatar";
import Spinner from "@/components/Spinner";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function memberSince(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function ProfileView() {
  const { user, loading, setUser } = useCurrentUser();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // The name inputs are only shown while editing, and startEdit() seeds them
  // from the current user, so there's nothing to sync on load.

  async function onPickFile(file: File | null) {
    setAvatarError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError("Please choose a JPEG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be at most 5MB.");
      return;
    }
    setAvatarBusy(true);
    try {
      const { user: updated } = await uploadAvatar(file);
      setUser(updated);
    } catch (err) {
      setAvatarError(
        err instanceof ApiError ? err.message : "Couldn't upload your photo. Please try again."
      );
    } finally {
      setAvatarBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onRemoveAvatar() {
    if (avatarBusy) return;
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const { user: updated } = await removeAvatar();
      setUser(updated);
    } catch (err) {
      setAvatarError(
        err instanceof ApiError ? err.message : "Couldn't remove your photo. Please try again."
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  function startEdit() {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setNameError(null);
    setEditing(true);
  }

  async function saveName() {
    if (savingName) return;
    if (!firstName.trim() || !lastName.trim()) {
      setNameError("First and last name are required.");
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const { user: updated } = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setUser(updated);
      setEditing(false);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setNameError(
        apiError?.fieldErrors.firstName ??
          apiError?.fieldErrors.lastName ??
          apiError?.message ??
          "Couldn't save your changes. Please try again."
      );
    } finally {
      setSavingName(false);
    }
  }

  if (loading) {
    return (
      <div className="_uprofile_wrap" aria-busy="true" aria-label="Loading your profile">
        <div className="_uprofile_card">
          <div className="_uprofile_cover" />
          <div className="_uprofile_head">
            <div className="_uprofile_skel_block _uprofile_skel_avatar" />
            <div className="_uprofile_identity">
              <div className="_uprofile_skel_block _uprofile_skel_name" />
              <div className="_uprofile_skel_block _uprofile_skel_meta" />
              <div className="_uprofile_skel_block _uprofile_skel_meta _is_short" />
            </div>
            <div className="_uprofile_actions">
              <div className="_uprofile_skel_block _uprofile_skel_btn" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="_uprofile_wrap">
        <p style={{ textAlign: "center", color: "var(--color7)" }}>
          Couldn&apos;t load your profile. Please refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="_uprofile_wrap">
      <div className="_uprofile_card">
        <div className="_uprofile_cover" />
        <div className="_uprofile_head">
          <div className="_uprofile_avatar_wrap">
            <Avatar src={user.avatarUrl} name={fullName(user)} className="_uprofile_avatar" size={90} />
            {avatarBusy && (
              <span className="_uprofile_avatar_busy">
                <Spinner size={24} />
              </span>
            )}
            <button
              type="button"
              className="_uprofile_cam_btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarBusy}
              aria-label="Change profile photo"
              title="Change profile photo"
            >
              <CameraIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(event) => void onPickFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="_uprofile_identity">
            <h2 className="_uprofile_name">{fullName(user)}</h2>
            <p className="_uprofile_meta">{user.email}</p>
            <p className="_uprofile_meta">Member since {memberSince(user.createdAt)}</p>
          </div>

          <div className="_uprofile_actions">
            {!editing && (
              <button type="button" className="_uprofile_btn _uprofile_btn_primary" onClick={startEdit}>
                Edit profile
              </button>
            )}
            {user.avatarUrl && (
              <button
                type="button"
                className="_uprofile_btn _uprofile_btn_danger"
                onClick={() => void onRemoveAvatar()}
                disabled={avatarBusy}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {avatarError && (
          <p className="_uprofile_error" role="alert" style={{ padding: "0 32px 16px" }}>
            {avatarError}
          </p>
        )}

        {editing && (
          <div className="_uprofile_edit">
            <div className="_uprofile_field">
              <label className="_uprofile_label" htmlFor="firstName">
                First name
              </label>
              <input
                id="firstName"
                className="_uprofile_input"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                maxLength={50}
              />
            </div>
            <div className="_uprofile_field">
              <label className="_uprofile_label" htmlFor="lastName">
                Last name
              </label>
              <input
                id="lastName"
                className="_uprofile_input"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                maxLength={50}
              />
            </div>
            {nameError && (
              <p className="_uprofile_error" role="alert">
                {nameError}
              </p>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="_uprofile_btn _uprofile_btn_primary"
                onClick={() => void saveName()}
                disabled={savingName}
                aria-busy={savingName}
              >
                {savingName ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="_uprofile_btn"
                onClick={() => setEditing(false)}
                disabled={savingName}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
